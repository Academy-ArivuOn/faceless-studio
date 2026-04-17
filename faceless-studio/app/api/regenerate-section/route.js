// app/api/regenerate-section/route.js
export const runtime = 'nodejs';
export const maxDuration = 60;

import { verifyAuth } from '@/packages/supabase';

const SECTION_AGENT_MAP = {
  hook:           'research',
  hook_options:   'research',
  trending_angles:'research',
  full_script:    'creator',
  scenes:         'creator',
  shorts_script:  'creator',
  cta_options:    'creator',
  youtube_titles: 'publisher',
  youtube_tags:   'publisher',
  youtube_description: 'publisher',
  instagram:      'publisher',
  tiktok:         'publisher',
  seven_day_plan: 'publisher',
};

export async function POST(request) {
  try {
    let user;
    try { user = await verifyAuth(request); }
    catch (e) { return Response.json({ error: e.message }, { status: 401 }); }

    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const {
      section,
      instruction,
      currentResult,
      input,
    } = body;

    if (!section) return Response.json({ error: 'section is required' }, { status: 400 });
    if (!currentResult) return Response.json({ error: 'currentResult is required' }, { status: 400 });
    if (!input) return Response.json({ error: 'input is required' }, { status: 400 });

    const agentName = SECTION_AGENT_MAP[section];
    if (!agentName) return Response.json({ error: `Unknown section: ${section}` }, { status: 400 });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://studio-ai-hub.vercel.app';
    const authHeader = request.headers.get('Authorization') || '';

    const {
      research = {},
      creator = {},
      publisher = {},
    } = currentResult;

    const editInstruction = instruction
      ? `\n\nUSER MODIFICATION REQUEST: ${instruction}\nApply this change to the content you generate. Keep everything else consistent with the existing content style and niche.`
      : '';

    let agentPayload = {};

    if (agentName === 'research') {
      agentPayload = {
        niche: input.niche,
        platform: input.platform,
        creatorType: input.creatorType,
        language: input.language,
        tone: input.tone,
        _editInstruction: editInstruction,
        _existingContext: {
          chosen_topic: research.chosen_topic,
          chosen_hook: research.chosen_hook,
        },
      };
    } else if (agentName === 'creator') {
      agentPayload = {
        niche: input.niche,
        platform: input.platform,
        creatorType: input.creatorType,
        language: input.language,
        tone: input.tone,
        chosenTopic: research.chosen_topic,
        chosenHook: research.chosen_hook,
        hookTrigger: research.chosen_hook_trigger,
        _creatorMode: input.creatorMode || 'faceless',
        blogType: input.blogType || null,
        location: input.location || null,
        _editInstruction: editInstruction,
        _targetSection: section,
      };
    } else if (agentName === 'publisher') {
      agentPayload = {
        niche: input.niche,
        platform: input.platform,
        creatorType: input.creatorType,
        language: input.language,
        chosenTopic: research.chosen_topic,
        chosenHook: research.chosen_hook,
        scriptExcerpt: (creator.full_script || '').slice(0, 500),
        _editInstruction: editInstruction,
        _targetSection: section,
      };
    }

    const res = await fetch(`${baseUrl}/api/agents/${agentName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(agentPayload),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return Response.json({ error: json.error || 'Agent failed' }, { status: 500 });
    }

    return Response.json({
      success: true,
      section,
      agentName,
      data: json.data,
    });

  } catch (err) {
    console.error('[regenerate-section]', err.message);
    return Response.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}