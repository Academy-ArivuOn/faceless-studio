export const runtime = 'nodejs';
export const maxDuration = 120;
 
import { verifyAuth, checkUsage, incrementUsage, saveGeneration, updateStreak } from '@/packages/supabase';
import { getCreatorDNA, buildDNAContextBlock, updateCreatorDNA } from '@/packages/creator-dna';
import { saveSessionContext } from '@/packages/session-context';
import { randomUUID } from 'crypto';
import { getChannelDNA, mergeChannelWithInput, incrementChannelGenerations } from '@/packages/channel-dna';
 
async function callAgent(agentName, payload, authHeader, dna, sessionId) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://studio-ai-hub.vercel.app';
  const url = `${baseUrl}/api/agents/${agentName}`;
 
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      'x-internal':   process.env.INTERNAL_SECRET || '',
      'x-session-id': sessionId || '',
    },
    body: JSON.stringify({ ...payload, _dna: dna, _sessionId: sessionId }),
  });
 
  const json = await response.json();
 
  if (!response.ok || !json.success) {
    const err = new Error(json.error || `${agentName} agent returned status ${response.status}`);
    err.agentName  = agentName;
    err.statusCode = response.status;
    throw err;
  }
 
  return { data: json.data, meta: json.meta };
}
 
export async function POST(request) {
  const pipelineStart  = Date.now();
  const agentDurations = {};
  const sessionId      = randomUUID();
 
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    let user;
    try {
      user = await verifyAuth(request);
    } catch (authError) {
      return Response.json(
        { error: authError.message || 'Authentication required' },
        { status: authError.statusCode || 401 }
      );
    }
 
    // ── Usage ─────────────────────────────────────────────────────────────────
    let usageCheck;
    try {
      usageCheck = await checkUsage(user.id);
    } catch (usageError) {
      console.error('[generate] Usage check failed:', usageError.message);
      return Response.json({ error: 'Failed to check usage limits. Please try again.' }, { status: 500 });
    }
 
    if (!usageCheck.allowed) {
      return Response.json(
        {
          error:      usageCheck.reason || 'Monthly generation limit reached',
          code:       'UPGRADE_REQUIRED',
          plan:       usageCheck.plan,
          used:       usageCheck.used,
          limit:      usageCheck.limit,
          reset_date: usageCheck.reset_date,
        },
        { status: 403 }
      );
    }
 
    // ── Parse body ────────────────────────────────────────────────────────────
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }
 
    const {
      niche,
      platform          = 'YouTube',
      creatorType       = 'general',
      tone              = 'Educational',
      language          = 'English',
      creatorMode       = 'faceless',
      blogType          = null,
      location          = null,
      // Blogger-specific
      openingStyle      = 'auto',
      customOpeningNote = '',
      mediaAnalysis     = null,
    } = body;
 
    if (!niche || typeof niche !== 'string' || niche.trim().length < 2) {
      return Response.json({ error: 'niche is required (minimum 2 characters)' }, { status: 400 });
    }
 
    const cleanInput = {
      niche:             niche.trim().slice(0, 150),
      platform:          platform.toString().trim().slice(0, 80),
      creatorType:       creatorType.toString().trim().slice(0, 80),
      tone:              tone.toString().trim().slice(0, 80),
      language:          language.toString().trim().slice(0, 50),
      creatorMode:       (creatorMode || 'faceless').toString().trim().slice(0, 50),
      blogType:          blogType    ? blogType.toString().trim().slice(0, 50)    : null,
      location:          location    ? location.toString().trim().slice(0, 200)   : null,
      openingStyle:      (openingStyle || 'auto').toString().trim().slice(0, 50),
      customOpeningNote: customOpeningNote ? customOpeningNote.toString().trim().slice(0, 400) : '',
      mediaAnalysis:     mediaAnalysis || null,
    };
 
    const authHeader = request.headers.get('Authorization') || '';
 
    // ── Fetch Creator DNA ─────────────────────────────────────────────────────
    const dna = await getCreatorDNA(user.id);
    const { channel, dnaBlock: channelDNABlock } = await getChannelDNA(user.id);
    const mergedInput    = mergeChannelWithInput(channel, cleanInput);
    const profileDNABlock = buildDNAContextBlock(dna, mergedInput);
    const dnaBlock        = [profileDNABlock, channelDNABlock].filter(Boolean).join('\n\n');
 
    // ── Research Agent ────────────────────────────────────────────────────────
    let research;
    {
      const t0 = Date.now();
      try {
        const result = await callAgent('research', {
          ...cleanInput,
          _dnaBlock:    dnaBlock,
          mediaAnalysis: cleanInput.mediaAnalysis,  // pass for context
        }, authHeader, dna, sessionId);
        research = result.data;
        agentDurations.research = Date.now() - t0;
 
        await saveSessionContext(user.id, sessionId, { research });
      } catch (err) {
        console.error('[generate] Research agent failed:', err.message);
        return Response.json(
          { error: 'Content research failed. Please try again with a more specific niche.', stage: 'research',
            detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
          { status: 500 }
        );
      }
    }
 
    // ── Creator Agent ─────────────────────────────────────────────────────────
    let creator;
    {
      const t0 = Date.now();
      try {
        const result = await callAgent('creator', {
          ...cleanInput,
          chosenTopic:       research.chosen_topic,
          chosenHook:        research.chosen_hook,
          hookTrigger:       research.chosen_hook_trigger,
          hookAnalysis:      research.chosen_hook_deep_analysis,
          competitorGap:     research.competitor_gap,
          targetAudience:    research.target_audience_description,
          _dnaBlock:         dnaBlock,
          _creatorMode:      cleanInput.creatorMode,
          blogType:          cleanInput.blogType,
          location:          cleanInput.location,
          // Blogger-specific
          openingStyle:      cleanInput.openingStyle,
          customOpeningNote: cleanInput.customOpeningNote,
          mediaAnalysis:     cleanInput.mediaAnalysis,
        }, authHeader, dna, sessionId);
        creator = result.data;
        agentDurations.creator = Date.now() - t0;
 
        await saveSessionContext(user.id, sessionId, { research, creator });
      } catch (err) {
        console.error('[generate] Creator agent failed:', err.message);
        return Response.json(
          { error: 'Script generation failed. Please try again.', stage: 'creator',
            detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
          { status: 500 }
        );
      }
    }
 
    // ── Publisher Agent ───────────────────────────────────────────────────────
    let publisher;
    {
      const t0 = Date.now();
      try {
        const result = await callAgent('publisher', {
          ...cleanInput,
          chosenTopic:    research.chosen_topic,
          chosenHook:     research.chosen_hook,
          scriptExcerpt:  (creator.full_script || '').slice(0, 500),
          targetAudience: research.target_audience_description,
          _dnaBlock:      dnaBlock,
        }, authHeader, dna, sessionId);
        publisher = result.data;
        agentDurations.publisher = Date.now() - t0;
      } catch (err) {
        console.error('[generate] Publisher agent failed:', err.message);
        return Response.json(
          { error: 'Distribution asset generation failed. Please try again.', stage: 'publisher',
            detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
          { status: 500 }
        );
      }
    }
 
    // ── Persist ───────────────────────────────────────────────────────────────
    const totalDurationMs = Date.now() - pipelineStart;
 
    const [saveResult, streakResult, usageResult] = await Promise.allSettled([
      saveGeneration({
        userId:     user.id,
        input:      {
          ...mergedInput,
          channel_id:         channel?.id || null,
          opening_style:      cleanInput.openingStyle,
          has_media_analysis: !!cleanInput.mediaAnalysis,
        },
        research,
        creator,
        publisher,
        durationMs: totalDurationMs,
      }),
      updateStreak(user.id),
      incrementUsage(user.id),
      channel?.id ? incrementChannelGenerations(channel.id) : Promise.resolve(),
    ]);
 
    if (saveResult.status === 'rejected') {
      console.error('[generate] saveGeneration failed:', saveResult.reason?.message || saveResult.reason);
    }
    if (usageResult.status === 'rejected') {
      console.error('[generate] incrementUsage failed:', usageResult.reason?.message || usageResult.reason);
    }
 
    if (dna !== null) {
      updateCreatorDNA(user.id, {
        primary_niche:   cleanInput.niche,
        primary_platform: cleanInput.platform,
        primary_language: cleanInput.language,
        creator_type:    cleanInput.creatorType,
        creator_mode:    cleanInput.creatorMode,
      }).catch(err => console.error('[generate] updateCreatorDNA failed:', err.message));
    }
 
    const generationId = saveResult.status === 'fulfilled' ? saveResult.value : null;
    const newStreak    = streakResult.status === 'fulfilled' ? streakResult.value : null;
 
    return Response.json({
      success: true,
      generationId,
      sessionId,
      input:    cleanInput,
      research,
      creator,
      publisher,
      channel: channel ? { id: channel.id, name: channel.name, emoji: channel.avatar_emoji, color: channel.avatar_color } : null,
      dna:     dna ? { creator_mode: dna.creator_mode, channel_size: dna.channel_size } : null,
      meta: {
        total_duration_ms: totalDurationMs,
        agent_durations:   agentDurations,
        streak:            newStreak,
        blogger_context:   cleanInput.creatorMode === 'blogger' ? {
          blog_type:         cleanInput.blogType,
          location:          cleanInput.location,
          opening_style:     creator?.opening_style_used || cleanInput.openingStyle,
          opening_style_label: creator?.opening_style_label || null,
          has_media:         !!cleanInput.mediaAnalysis,
          has_filming_guide: !!creator?.filming_guide,
        } : null,
        usage: {
          plan:       usageCheck.plan,
          used:       (usageCheck.used || 0) + 1,
          limit:      usageCheck.limit,
          remaining:  usageCheck.remaining !== null ? Math.max(0, (usageCheck.remaining || 0) - 1) : null,
          reset_date: usageCheck.reset_date,
        },
      },
    });
 
  } catch (err) {
    console.error('[generate] Unexpected top-level error:', err);
    return Response.json(
      { error: 'An unexpected error occurred. Please try again.',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined },
      { status: 500 }
    );
  }
}
 