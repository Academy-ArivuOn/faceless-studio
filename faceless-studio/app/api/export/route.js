// app/api/export/route.js
export const runtime = 'nodejs';
export const maxDuration = 60;

import { verifyAuth } from '@/packages/supabase';

export async function POST(request) {
  try {
    let user;
    try { user = await verifyAuth(request); }
    catch (e) { return Response.json({ error: e.message }, { status: 401 }); }

    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const { format, result } = body;

    if (!format || !['pdf', 'docx'].includes(format)) {
      return Response.json({ error: 'format must be pdf or docx' }, { status: 400 });
    }
    if (!result) {
      return Response.json({ error: 'result data is required' }, { status: 400 });
    }

    const slug = (result?.research?.chosen_topic || 'studio-ai-content')
      .slice(0, 40).replace(/[^a-z0-9]/gi, '-').toLowerCase().replace(/-+/g, '-');

    if (format === 'docx') {
      const buf = await generateDocx(result);
      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${slug}.docx"`,
        },
      });
    }

    if (format === 'pdf') {
      const buf = await generatePdf(result);
      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${slug}.pdf"`,
        },
      });
    }

  } catch (err) {
    console.error('[export]', err.message);
    return Response.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — used across both generators
//   INDIGO  #4F46E5  section headers, topic title
//   AMBER   #D97706  hook / psychological callouts
//   EMERALD #059669  SEO / distribution sections
//   ROSE    #E11D48  CTAs, script sections
//   SLATE   #334155  body text
//   MUTED   #64748B  labels, meta info
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
//  PDF  (pdfkit)
// ═══════════════════════════════════════════════════════════════════════════════
async function generatePdf(result) {
  const { default: PDFDocument } = await import('pdfkit');

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      margin: 0, size: 'A4', bufferPages: true,
      info: { Title: 'Studio AI — Content Pack', Author: 'Studio AI' },
    });
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { research = {}, creator = {}, publisher = {}, input = {}, meta = {} } = result;
    const yt = publisher.youtube   || {};
    const ig = publisher.instagram || {};
    const tt = publisher.tiktok    || {};
    const bl = publisher.blog      || {};
    const ps = publisher.posting_schedule || {};

    const C = {
      indigo:   '#4F46E5', indigoBg: '#EEF2FF',
      amber:    '#D97706', amberBg:  '#FFFBEB',
      emerald:  '#059669', emerBg:   '#ECFDF5',
      rose:     '#E11D48', roseBg:   '#FFF1F2',
      slate:    '#334155',
      muted:    '#64748B',
      border:   '#E2E8F0',
      light:    '#F8FAFC',
      white:    '#FFFFFF',
    };

    const PW = doc.page.width;
    const PH = doc.page.height;
    const ML = 56, MR = 56;
    const CW = PW - ML - MR;
    const FOOTER_H = 34;

    const safe = s => (s || '').toString().replace(/[\u0000-\u001F\u007F]/g, '').trim();

    let y = 56;

    function need(h) { if (y + h > PH - FOOTER_H - 20) newPage(); }
    function move(d) { y += d; }

    function newPage() {
      doc.addPage({ margin: 0, size: 'A4' });
      y = 56;
    }

    // ── coloured left-border section header ────────────────────────────────
    function sectionHeader(num, title, accent) {
      need(60);
      doc.rect(ML, y, CW, 48).fill(accent + '12');
      doc.rect(ML, y, 4, 48).fill(accent);
      doc.fontSize(7.5).fillColor(accent).font('Helvetica-Bold')
        .text(`SECTION ${num}`, ML + 14, y + 8, { characterSpacing: 1, width: CW - 14, lineBreak: false });
      doc.fontSize(16).fillColor(C.slate).font('Helvetica-Bold')
        .text(safe(title), ML + 14, y + 20, { width: CW - 14, lineBreak: false });
      move(58);
      rule(C.border);
    }

    // ── field label ────────────────────────────────────────────────────────
    function fieldLabel(text, color) {
      need(22);
      move(10);
      doc.fontSize(7.5).fillColor(color || C.muted).font('Helvetica-Bold')
        .text(safe(text.toUpperCase()), ML, y, { characterSpacing: 0.8, width: CW, lineBreak: false });
      move(14);
    }

    // ── body text ──────────────────────────────────────────────────────────
    function bodyText(text, opts = {}) {
      if (!text) return;
      const t = safe(text);
      const h = doc.fontSize(10).heightOfString(t, { width: CW, lineGap: 3 });
      need(h + 6);
      doc.fontSize(10).fillColor(opts.color || C.slate)
        .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(t, ML, y, { width: CW, lineGap: 3 });
      move(h + 7);
    }

    // ── coloured callout box ───────────────────────────────────────────────
    function callout(text, bg, accent, textColor) {
      if (!text) return;
      const t   = safe(text);
      const iW  = CW - 28;
      const tH  = doc.fontSize(10.5).heightOfString(t, { width: iW, lineGap: 4 });
      const bH  = tH + 24;
      need(bH + 14);
      move(6);
      doc.roundedRect(ML, y, CW, bH, 5).fill(bg);
      doc.rect(ML, y, 3, bH).fill(accent);
      doc.fontSize(10.5).fillColor(textColor || C.slate).font('Helvetica-Oblique')
        .text(t, ML + 14, y + 11, { width: iW, lineGap: 4 });
      move(bH + 10);
    }

    // ── tag pill row ───────────────────────────────────────────────────────
    function tagRow(tags, textColor, bgColor) {
      if (!tags || tags.length === 0) return;
      need(26);
      let x = ML;
      tags.forEach(tag => {
        const t  = safe(tag);
        const tw = doc.fontSize(8).widthOfString(t) + 16;
        if (x + tw > ML + CW) { x = ML; move(22); need(22); }
        doc.roundedRect(x, y, tw, 17, 3).fill(bgColor);
        doc.fontSize(8).fillColor(textColor).font('Helvetica-Bold')
          .text(t, x + 8, y + 4, { lineBreak: false });
        x += tw + 6;
      });
      move(22);
    }

    // ── numbered card ──────────────────────────────────────────────────────
    function numberedCard(num, title, subtitle, accent) {
      const tH = doc.fontSize(10.5).heightOfString(safe(title), { width: CW - 44, lineGap: 2 });
      const sH = subtitle ? doc.fontSize(9).heightOfString(safe(subtitle), { width: CW - 44 }) + 4 : 0;
      const cH = Math.max(tH + sH + 20, 38);
      need(cH + 10);
      move(4);
      doc.roundedRect(ML, y, CW, cH, 5).fill(C.light);
      doc.rect(ML, y, 3, cH).fill(accent);
      doc.circle(ML + 20, y + cH / 2, 10).fill(accent);
      doc.fontSize(9).fillColor(C.white).font('Helvetica-Bold')
        .text(String(num), ML + 16, y + cH / 2 - 6, { width: 10, lineBreak: false });
      doc.fontSize(10.5).fillColor(C.slate).font('Helvetica-Bold')
        .text(safe(title), ML + 38, y + 10, { width: CW - 46, lineGap: 2 });
      if (subtitle) {
        doc.fontSize(9).fillColor(C.muted).font('Helvetica')
          .text(safe(subtitle), ML + 38, y + 10 + tH + 2, { width: CW - 46 });
      }
      move(cH + 10);
    }

    // ── scene table card ───────────────────────────────────────────────────
    function sceneCard(s) {
      const vo   = safe(s.voiceover || '');
      const vis  = safe(s.visual_direction || s.b_roll_search_term || '');
      const tone = safe(s.tone_direction || '');
      const over = safe(s.overlay_text || '');
      const voH  = doc.fontSize(9.5).heightOfString(vo, { width: CW - 28, lineGap: 2 });
      const extra = [vis, tone, over].filter(Boolean).length * 20;
      const cH   = Math.max(voH + extra + 36, 52);
      need(cH + 12);
      move(6);
      doc.roundedRect(ML, y, CW, cH, 6).fill(C.white)
        .roundedRect(ML, y, CW, cH, 6).strokeColor(C.border).lineWidth(0.5).stroke();
      doc.rect(ML, y, 3, cH).fill(C.indigo);

      // header row background
      doc.rect(ML + 3, y, CW - 3, 26).fill(C.indigoBg);
      doc.fontSize(8).fillColor(C.indigo).font('Helvetica-Bold')
        .text(`S${s.scene_number}  ·  ${safe(s.section_type || '')}`, ML + 12, y + 7, { lineBreak: false });
      doc.fontSize(7.5).fillColor(C.muted).font('Helvetica')
        .text(`${s.timestamp_start || '0:00'} – ${s.timestamp_end || ''}`, ML + CW - 80, y + 8, { width: 76, align: 'right', lineBreak: false });

      let iy = y + 32;
      const writeRow = (labelTxt, valTxt, labelColor) => {
        if (!valTxt) return;
        doc.fontSize(8).fillColor(labelColor || C.muted).font('Helvetica-Bold')
          .text(labelTxt, ML + 12, iy, { width: 64, lineBreak: false });
        const h = doc.fontSize(9).heightOfString(valTxt, { width: CW - 90, lineGap: 2 });
        doc.fontSize(9).fillColor(C.slate).font('Helvetica')
          .text(valTxt, ML + 78, iy, { width: CW - 90, lineGap: 2 });
        iy += h + 5;
      };
      writeRow('VOICEOVER',  vo,   C.slate);
      writeRow('VISUAL',     vis,  C.indigo);
      writeRow('OVERLAY',    over, C.rose);
      writeRow('DIRECTION',  tone, C.amber);

      move(cH + 10);
    }

    // ── day card ───────────────────────────────────────────────────────────
    function dayCard(item, dayName, idx) {
      const DAY_ACCENTS = [C.indigo, C.emerald, C.amber, C.rose, '#7C3AED', '#0891B2', '#65A30D'];
      const accent = DAY_ACCENTS[idx % 7];
      const topic  = safe(item.topic_angle || '');
      const tH     = doc.fontSize(10).heightOfString(topic, { width: CW - 76, lineGap: 2 });
      const cH     = Math.max(tH + 28, 50);
      need(cH + 10);
      move(4);
      doc.roundedRect(ML, y, CW, cH, 6).fill(C.white)
        .roundedRect(ML, y, CW, cH, 6).strokeColor(C.border).lineWidth(0.5).stroke();
      // day number block left
      doc.rect(ML, y, 54, cH).fill(accent);
      doc.roundedRect(ML, y, 54, cH, 6).fill(accent);
      doc.fontSize(18).fillColor(C.white).font('Helvetica-Bold')
        .text(String(item.day), ML + 8, y + (cH - 22) / 2, { width: 36, align: 'center', lineBreak: false });
      doc.fontSize(7).fillColor('rgba(255,255,255,0.75)').font('Helvetica')
        .text(dayName.slice(0, 3).toUpperCase(), ML + 8, y + (cH - 22) / 2 + 21, { width: 36, align: 'center', lineBreak: false });
      // content type badge
      const ctLabel = safe(item.content_type || '');
      const ctW     = doc.fontSize(7.5).widthOfString(ctLabel) + 12;
      doc.roundedRect(ML + 62, y + 10, ctW, 15, 3).fill(accent + '22');
      doc.fontSize(7.5).fillColor(accent).font('Helvetica-Bold')
        .text(ctLabel, ML + 68, y + 14, { lineBreak: false });
      // topic text
      doc.fontSize(10).fillColor(C.slate).font('Helvetica')
        .text(topic, ML + 62, y + 30, { width: CW - 74, lineGap: 2 });
      // platform right
      doc.fontSize(8).fillColor(C.muted).font('Helvetica')
        .text(safe(item.platform || ''), ML + CW - 64, y + (cH - 10) / 2, { width: 60, align: 'right', lineBreak: false });
      move(cH + 10);
    }

    // ── thin rule ──────────────────────────────────────────────────────────
    function rule(color) {
      need(16);
      move(8);
      doc.moveTo(ML, y).lineTo(ML + CW, y).strokeColor(color || C.border).lineWidth(0.5).stroke();
      move(8);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  COVER PAGE
    // ══════════════════════════════════════════════════════════════════════
    // Indigo hero band
    doc.rect(0, 0, PW, 210).fill(C.indigo);

    // wordmark
    doc.fontSize(10).fillColor('rgba(255,255,255,0.55)').font('Helvetica-Bold')
      .text('STUDIO  AI', ML, 48, { characterSpacing: 3, width: CW });

    // topic title
    const topicSafe = safe(research.chosen_topic || 'Content Generation Report');
    doc.fontSize(24).fillColor(C.white).font('Helvetica-Bold')
      .text(topicSafe, ML, 78, { width: CW, lineGap: 6 });

    doc.fontSize(10).fillColor('rgba(255,255,255,0.65)').font('Helvetica')
      .text('Content Pack  ·  Studio AI', ML, 190, { width: CW });

    // white stats card
    doc.roundedRect(ML, 195, CW, 88, 8).fill(C.white);
    const metaItems = [
      ['Platform',  input.platform   || '—'],
      ['Language',  input.language   || 'English'],
      ['Tone',      input.tone       || 'Educational'],
      ['Generated', meta.total_duration_ms ? `${(meta.total_duration_ms / 1000).toFixed(1)}s` : '—'],
    ];
    const cw4 = CW / 4;
    metaItems.forEach(([lbl, val], i) => {
      const x = ML + i * cw4 + 12;
      doc.fontSize(7).fillColor(C.muted).font('Helvetica-Bold')
        .text(lbl.toUpperCase(), x, 210, { width: cw4 - 14, characterSpacing: 0.5, lineBreak: false });
      doc.fontSize(11).fillColor(C.slate).font('Helvetica-Bold')
        .text(safe(val), x, 224, { width: cw4 - 14, lineBreak: false });
    });

    // hook preview box
    if (research.chosen_hook) {
      move(295);
      doc.roundedRect(ML, y, CW, 2).fill(C.border);
      move(2);
      const hkText = safe(research.chosen_hook);
      const hkH   = doc.fontSize(12).heightOfString(`"${hkText}"`, { width: CW - 28, lineGap: 5 });
      doc.roundedRect(ML, y + 10, CW, hkH + 26, 6).fill(C.amberBg);
      doc.rect(ML, y + 10, 4, hkH + 26).fill(C.amber);
      doc.fontSize(7.5).fillColor(C.amber).font('Helvetica-Bold')
        .text('OPENING HOOK', ML + 14, y + 18, { characterSpacing: 1, lineBreak: false });
      doc.fontSize(12).fillColor(C.slate).font('Helvetica-Oblique')
        .text(`"${hkText}"`, ML + 14, y + 32, { width: CW - 28, lineGap: 5 });
      move(hkH + 46);
    } else {
      move(295);
    }

    // table of contents
    move(20);
    doc.rect(0, y, PW, PH - y).fill(C.light);
    move(16);
    doc.fontSize(8).fillColor(C.muted).font('Helvetica-Bold')
      .text('CONTENTS', ML, y, { characterSpacing: 1, width: CW });
    move(16);

    const tocItems = [
      ['01', 'Research & Strategy',  'Topic, hook, trending angles, audience'],
      ['02', 'Script & Content',     'Full script, Shorts version, CTAs'],
      ['03', 'Scene Breakdown',      'Scene-by-scene direction & B-roll'],
      ['04', 'YouTube SEO',          'Titles, description, tags, keywords'],
      ['05', 'Social Media Assets',  'Instagram, TikTok captions & hashtags'],
      ['06', '7-Day Content Sprint', 'Day-by-day publishing plan'],
    ];
    tocItems.forEach(([num, title, desc]) => {
      if (y + 44 > PH - FOOTER_H - 10) return;
      doc.moveTo(ML, y).lineTo(ML + CW, y).strokeColor(C.border).lineWidth(0.3).stroke();
      move(6);
      doc.fontSize(18).fillColor(C.border).font('Helvetica-Bold')
        .text(num, ML, y, { width: 36, lineBreak: false });
      doc.fontSize(11).fillColor(C.slate).font('Helvetica-Bold')
        .text(title, ML + 44, y + 2, { width: CW - 44, lineBreak: false });
      doc.fontSize(8.5).fillColor(C.muted).font('Helvetica')
        .text(desc, ML + 44, y + 17, { width: CW - 44, lineBreak: false });
      move(38);
    });

    // ══════════════════════════════════════════════════════════════════════
    //  S1 — RESEARCH & STRATEGY
    // ══════════════════════════════════════════════════════════════════════
    newPage();
    sectionHeader(1, 'Research & Strategy', C.indigo);

    if (research.chosen_topic) {
      fieldLabel('Chosen Topic', C.indigo);
      const ttxt = safe(research.chosen_topic);
      const th   = doc.fontSize(15).heightOfString(ttxt, { width: CW, lineGap: 4 });
      need(th + 10);
      doc.fontSize(15).fillColor(C.slate).font('Helvetica-Bold')
        .text(ttxt, ML, y, { width: CW, lineGap: 4 });
      move(th + 12);
    }

    if (research.chosen_hook) {
      fieldLabel('Opening Hook', C.amber);
      callout(research.chosen_hook, C.amberBg, C.amber, '#92400E');
    }

    if (research.chosen_hook_trigger) {
      fieldLabel('Psychological Trigger', C.amber);
      tagRow([research.chosen_hook_trigger], C.amber, C.amberBg);
      move(6);
    }

    if (research.chosen_topic_reasoning)     { fieldLabel('Why This Topic Wins');      bodyText(research.chosen_topic_reasoning); }
    if (research.target_audience_description){ fieldLabel('Target Audience');           bodyText(research.target_audience_description); }
    if (research.competitor_gap)             { fieldLabel('Competitor Gap');            bodyText(research.competitor_gap); }
    if (research.chosen_hook_deep_analysis)  { fieldLabel('Hook Psychology', C.amber); bodyText(research.chosen_hook_deep_analysis); }

    if (research.best_upload_time) {
      const t = research.best_upload_time;
      fieldLabel('Best Upload Window', C.emerald);
      callout(`${t.day || ''} at ${t.time || ''} — ${t.reasoning || ''}`, C.emerBg, C.emerald, '#065F46');
    }

    if (research.thumbnail_concept) { fieldLabel('Thumbnail Concept'); bodyText(research.thumbnail_concept); }

    if (Array.isArray(research.trending_angles) && research.trending_angles.length > 0) {
      rule();
      fieldLabel('Trending Angles Considered', C.indigo);
      research.trending_angles.forEach((a, i) => {
        numberedCard(i + 1, a.topic,
          [a.why_now, a.urgency_level ? `Urgency: ${a.urgency_level}` : ''].filter(Boolean).join('  ·  '),
          C.indigo);
      });
    }

    if (Array.isArray(research.hook_options) && research.hook_options.length > 0) {
      rule();
      fieldLabel('All Hook Options', C.amber);
      research.hook_options.forEach(h => {
        if (h.psychological_trigger) {
          tagRow([h.psychological_trigger], C.amber, C.amberBg);
          move(4);
        }
        callout(h.hook_text, C.amberBg, C.amber, '#92400E');
        if (h.trigger_explanation) bodyText(h.trigger_explanation, { color: C.muted });
        move(4);
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    //  S2 — SCRIPT & CONTENT
    // ══════════════════════════════════════════════════════════════════════
    newPage();
    sectionHeader(2, 'Script & Content', C.rose);

    const statTags = [
      creator.word_count        ? `${creator.word_count} words`       : null,
      creator.estimated_duration ? creator.estimated_duration          : null,
      creator.scenes?.length    ? `${creator.scenes.length} scenes`   : null,
    ].filter(Boolean);
    if (statTags.length) { tagRow(statTags, C.rose, C.roseBg); move(10); }

    if (creator.full_script) {
      fieldLabel('Full Script', C.rose);
      creator.full_script.split('\n').forEach(line => {
        if (line.trim()) bodyText(line);
        else move(6);
      });
    }

    if (creator.shorts_script) {
      rule();
      fieldLabel('Shorts / Reels Script (60s)', C.rose);
      callout(creator.shorts_script, C.roseBg, C.rose, '#881337');
    }

    if (Array.isArray(creator.cta_options) && creator.cta_options.length > 0) {
      rule();
      fieldLabel('CTA Options', C.rose);
      creator.cta_options.forEach((cta, i) => {
        numberedCard(i + 1, `"${cta.cta_text}"`,
          [cta.placement, cta.goal].filter(Boolean).join('  ·  '), C.rose);
      });
    }

    if (creator.hook_breakdown) {
      const hb = creator.hook_breakdown;
      rule();
      fieldLabel('Hook Psychology Breakdown', C.amber);
      if (hb.psychological_mechanism) { fieldLabel('Mechanism'); bodyText(hb.psychological_mechanism); }
      if (hb.what_viewer_is_thinking)  {
        fieldLabel("Viewer's Internal Monologue");
        callout(hb.what_viewer_is_thinking, C.amberBg, C.amber, '#92400E');
      }
      if (hb.why_first_3_seconds)      { fieldLabel('Why First 3 Seconds'); bodyText(hb.why_first_3_seconds); }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  S3 — SCENES
    // ══════════════════════════════════════════════════════════════════════
    if (Array.isArray(creator.scenes) && creator.scenes.length > 0) {
      newPage();
      sectionHeader(3, 'Scene Breakdown', C.indigo);
      creator.scenes.forEach(s => sceneCard(s));
    }

    // ══════════════════════════════════════════════════════════════════════
    //  S4 — YOUTUBE SEO
    // ══════════════════════════════════════════════════════════════════════
    newPage();
    sectionHeader(4, 'YouTube SEO', C.emerald);

    if (yt.recommended_title) {
      fieldLabel('Recommended Title ⭐', C.emerald);
      const rt  = safe(yt.recommended_title);
      const rtH = doc.fontSize(13).heightOfString(rt, { width: CW - 22, lineGap: 4 });
      need(rtH + 26);
      doc.roundedRect(ML, y, CW, rtH + 22, 6).fill(C.emerBg);
      doc.rect(ML, y, 4, rtH + 22).fill(C.emerald);
      doc.fontSize(13).fillColor(C.slate).font('Helvetica-Bold')
        .text(rt, ML + 14, y + 10, { width: CW - 22, lineGap: 4 });
      move(rtH + 32);
    }

    if (Array.isArray(yt.title_options) && yt.title_options.length > 0) {
      fieldLabel('All Title Options', C.emerald);
      yt.title_options.forEach((t, i) => {
        numberedCard(i + 1, t.title,
          [
            `${t.character_count || t.title?.length || 0} chars`,
            t.ctr_prediction ? `CTR: ${t.ctr_prediction}` : null,
            t.primary_strategy || null,
          ].filter(Boolean).join('  ·  '), C.emerald);
      });
    }

    if (yt.description) { rule(); fieldLabel('YouTube Description', C.emerald); bodyText(yt.description); }

    if (Array.isArray(yt.tags) && yt.tags.length > 0) {
      rule();
      fieldLabel(`SEO Tags (${yt.tags.length})`, C.emerald);
      // render tags in rows of 5
      for (let i = 0; i < yt.tags.length; i += 5) {
        tagRow(yt.tags.slice(i, i + 5), C.emerald, C.emerBg);
      }
    }

    if (yt.primary_keyword) {
      fieldLabel('Primary Keyword', C.emerald);
      tagRow([yt.primary_keyword], C.white, C.emerald);
      move(4);
    }
    if (Array.isArray(yt.secondary_keywords) && yt.secondary_keywords.length > 0) {
      fieldLabel('Secondary Keywords');
      tagRow(yt.secondary_keywords, C.emerald, C.emerBg);
    }

    if (bl.seo_title) {
      rule();
      fieldLabel('Blog SEO Title', C.emerald);
      bodyText(bl.seo_title, { bold: true });
      if (bl.meta_description) { fieldLabel('Meta Description'); bodyText(bl.meta_description); }
      if (bl.url_slug)          { fieldLabel('URL Slug'); bodyText(`/${bl.url_slug}`, { color: C.emerald }); }
      if (Array.isArray(bl.suggested_h2_headers) && bl.suggested_h2_headers.length) {
        fieldLabel('Suggested H2 Headers');
        bl.suggested_h2_headers.forEach((h, i) => bodyText(`${i + 1}.  ${h}`));
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  S5 — SOCIAL MEDIA ASSETS
    // ══════════════════════════════════════════════════════════════════════
    newPage();
    sectionHeader(5, 'Social Media Assets', C.rose);

    if (ig.caption) {
      need(24);
      doc.roundedRect(ML, y, CW, 22, 4).fill('#FDF2F8');
      doc.fontSize(8).fillColor('#9D174D').font('Helvetica-Bold')
        .text('INSTAGRAM', ML + 10, y + 6, { characterSpacing: 1, lineBreak: false });
      move(30);

      fieldLabel('Caption'); bodyText(ig.caption);
      if (ig.reel_cover_text)  { fieldLabel('Reel Cover Text');  tagRow([ig.reel_cover_text], '#9D174D', '#FDF2F8'); move(4); }
      if (ig.story_slide_text) { fieldLabel('Story Slide Text'); bodyText(ig.story_slide_text); }
      if (ig.save_cta)         { fieldLabel('Save CTA');         bodyText(ig.save_cta); }
      if (Array.isArray(ig.hashtags) && ig.hashtags.length > 0) {
        fieldLabel(`Hashtags (${ig.hashtags.length})`);
        const hTags = ig.hashtags.map(h => h.startsWith('#') ? h : `#${h}`);
        for (let i = 0; i < hTags.length; i += 5) tagRow(hTags.slice(i, i + 5), '#9D174D', '#FDF2F8');
      }
    }

    if (tt.caption) {
      rule();
      need(24);
      doc.roundedRect(ML, y, CW, 22, 4).fill(C.indigoBg);
      doc.fontSize(8).fillColor(C.indigo).font('Helvetica-Bold')
        .text('TIKTOK', ML + 10, y + 6, { characterSpacing: 1, lineBreak: false });
      move(30);

      fieldLabel('Caption'); bodyText(tt.caption);
      if (tt.first_frame_text)       { fieldLabel('First Frame Text');       callout(tt.first_frame_text, C.indigoBg, C.indigo, '#3730A3'); }
      if (tt.trending_sound_category){ fieldLabel('Trending Sound Category'); bodyText(tt.trending_sound_category); }
      if (tt.duet_stitch_suggestion) { fieldLabel('Duet / Stitch Suggestion'); bodyText(tt.duet_stitch_suggestion); }
      if (Array.isArray(tt.hashtags) && tt.hashtags.length > 0) {
        fieldLabel('Hashtags');
        tagRow(tt.hashtags, C.indigo, C.indigoBg);
      }
    }

    if (ps.primary_post_day) {
      rule();
      fieldLabel('Posting Schedule', C.emerald);
      callout(`${ps.primary_post_day} at ${ps.primary_post_time || 'TBD'} — ${ps.reasoning || ''}`,
        C.emerBg, C.emerald, '#065F46');
    }

    if (Array.isArray(publisher.cross_platform_repurpose) && publisher.cross_platform_repurpose.length > 0) {
      rule();
      fieldLabel('Cross-Platform Repurpose');
      publisher.cross_platform_repurpose.forEach((r, i) => {
        numberedCard(i + 1, `${r.platform} — ${r.format}`, r.specific_angle || '', C.muted);
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    //  S6 — 7-DAY CONTENT SPRINT
    // ══════════════════════════════════════════════════════════════════════
    if (Array.isArray(publisher.seven_day_content_plan) && publisher.seven_day_content_plan.length > 0) {
      newPage();
      sectionHeader(6, '7-Day Content Sprint', C.amber);
      const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      publisher.seven_day_content_plan.forEach((item, i) => dayCard(item, DAYS[i] || '', i));
    }

    // ══════════════════════════════════════════════════════════════════════
    //  FOOTER on every page
    // ══════════════════════════════════════════════════════════════════════
    const totalPages = doc.bufferedPageRange().count;
    for (let p = 0; p < totalPages; p++) {
      doc.switchToPage(p);
      doc.rect(0, PH - FOOTER_H, PW, FOOTER_H).fill(C.light);
      doc.moveTo(0, PH - FOOTER_H).lineTo(PW, PH - FOOTER_H)
        .strokeColor(C.border).lineWidth(0.5).stroke();
      doc.fontSize(8).fillColor(C.muted).font('Helvetica')
        .text('Studio AI  ·  Content Pack', ML, PH - FOOTER_H + 12,
          { width: CW / 2, lineBreak: false });
      doc.fontSize(8).fillColor(C.muted).font('Helvetica')
        .text(`Page ${p + 1} of ${totalPages}`, ML + CW / 2, PH - FOOTER_H + 12,
          { width: CW / 2, align: 'right', lineBreak: false });
    }

    doc.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DOCX  (docx npm)
// ═══════════════════════════════════════════════════════════════════════════════
async function generateDocx(result) {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, BorderStyle, ShadingType, WidthType,
    Table, TableRow, TableCell, LevelFormat, PageBreak,
  } = await import('docx');

  const { research = {}, creator = {}, publisher = {}, input = {}, meta = {} } = result;
  const yt = publisher.youtube   || {};
  const ig = publisher.instagram || {};
  const tt = publisher.tiktok    || {};
  const bl = publisher.blog      || {};
  const ps = publisher.posting_schedule || {};

  // hex colours without #
  const INDIGO   = '4F46E5'; const INDIGOBG  = 'EEF2FF';
  const AMBER    = 'D97706'; const AMBERBG   = 'FFFBEB';
  const EMERALD  = '059669'; const EMERBG    = 'ECFDF5';
  const ROSE     = 'E11D48'; const ROSEBG    = 'FFF1F2';
  const SLATE    = '334155';
  const MUTED    = '64748B';
  const BORDER   = 'E2E8F0';
  const LIGHT    = 'F8FAFC';
  const WHITE    = 'FFFFFF';
  const PINK     = '9D174D'; const PINKBG   = 'FDF2F8';

  const safe = s => (s || '').toString().replace(/[\u0000-\u001F\u007F]/g, '').trim();
  const sp   = (b = 0, a = 0) => ({ spacing: { before: b, after: a } });
  const br   = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
  const allBorders = { top: br, bottom: br, left: br, right: br };

  // ── helpers ─────────────────────────────────────────────────────────────────

  function sectionHeading(num, title, accent) {
    return [
      new Paragraph({
        ...sp(480, 0),
        shading: { type: ShadingType.CLEAR, fill: accent + '18' },
        border: {
          left:   { style: BorderStyle.THICK, size: 24, color: accent, space: 10 },
          bottom: { style: BorderStyle.SINGLE, size: 4,  color: BORDER, space: 0  },
        },
        children: [
          new TextRun({ text: `SECTION ${num}`, size: 14, bold: true, font: 'Calibri', color: accent, characterSpacing: 20 }),
          new TextRun({ break: 1 }),
          new TextRun({ text: safe(title), size: 32, bold: true, font: 'Calibri', color: SLATE }),
        ],
      }),
      new Paragraph({ ...sp(0, 80), children: [] }),
    ];
  }

  function fieldLabel(text, color) {
    return new Paragraph({
      ...sp(180, 50),
      children: [new TextRun({
        text: safe(text.toUpperCase()),
        size: 15, bold: true, font: 'Calibri',
        color: color || MUTED, characterSpacing: 18,
      })],
    });
  }

  function body(text, opts = {}) {
    if (!text) return null;
    return new Paragraph({
      ...sp(40, 60),
      children: [new TextRun({
        text: safe(text), size: 20, font: 'Calibri',
        color: opts.color || SLATE,
        bold:    opts.bold    || false,
        italics: opts.italics || false,
      })],
    });
  }

  function quoteBlock(text, accent, bg) {
    if (!text) return null;
    return new Paragraph({
      ...sp(60, 80),
      shading: { type: ShadingType.CLEAR, fill: bg },
      border:  { left: { style: BorderStyle.THICK, size: 20, color: accent, space: 10 } },
      children: [new TextRun({ text: safe(text), size: 22, font: 'Calibri', color: SLATE, italics: true })],
    });
  }

  function highlightBox(text, bg, textColor) {
    if (!text) return null;
    return new Paragraph({
      ...sp(60, 80),
      shading: { type: ShadingType.CLEAR, fill: bg },
      children: [new TextRun({ text: safe(text), size: 20, font: 'Calibri', color: textColor || SLATE })],
    });
  }

  function tagLine(tags, color, bg) {
    if (!tags || tags.length === 0) return null;
    const runs = [];
    tags.forEach((t, i) => {
      runs.push(new TextRun({
        text: `  ${safe(t)}  `,
        size: 16, font: 'Calibri', bold: true, color,
        shading: { type: ShadingType.CLEAR, fill: bg },
      }));
      if (i < tags.length - 1) runs.push(new TextRun({ text: '  ', size: 16, font: 'Calibri' }));
    });
    return new Paragraph({ ...sp(50, 50), children: runs });
  }

  function divider() {
    return new Paragraph({
      ...sp(200, 200),
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER, space: 0 } },
      children: [],
    });
  }

  function pb() { return new Paragraph({ children: [new PageBreak()] }); }

  // numbered item with left accent
  function numberedItem(num, title, subtitle, accent) {
    const rows = [
      new Paragraph({
        ...sp(50, 0),
        shading: { type: ShadingType.CLEAR, fill: LIGHT },
        border:  { left: { style: BorderStyle.THICK, size: 16, color: accent, space: 10 } },
        children: [
          new TextRun({ text: `${num}.  `, size: 20, bold: true, font: 'Calibri', color: accent }),
          new TextRun({ text: safe(title), size: 20, bold: true, font: 'Calibri', color: SLATE }),
        ],
      }),
    ];
    if (subtitle) {
      rows.push(new Paragraph({
        ...sp(0, 60),
        shading: { type: ShadingType.CLEAR, fill: LIGHT },
        children: [new TextRun({ text: `        ${safe(subtitle)}`, size: 17, font: 'Calibri', color: MUTED })],
      }));
    }
    return rows;
  }

  // scene table
  function sceneTable(s) {
    const cell = (label, value, labelColor) => new TableRow({
      children: [
        new TableCell({
          borders: allBorders,
          shading: { type: ShadingType.CLEAR, fill: LIGHT },
          width:   { size: 1800, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: safe(label), size: 15, bold: true, font: 'Calibri', color: labelColor || MUTED })] })],
        }),
        new TableCell({
          borders: allBorders,
          width:   { size: 7560, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: safe(value || ''), size: 18, font: 'Calibri', color: SLATE })] })],
        }),
      ],
    });

    const headerRow = new TableRow({
      children: [new TableCell({
        borders: allBorders,
        shading: { type: ShadingType.CLEAR, fill: INDIGOBG },
        columnSpan: 2,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [
          new TextRun({ text: `Scene ${s.scene_number}  ·  ${safe(s.section_type || '')}`, size: 20, bold: true, font: 'Calibri', color: INDIGO }),
          new TextRun({ text: `        ${s.timestamp_start || ''} → ${s.timestamp_end || ''}`, size: 17, font: 'Calibri', color: MUTED }),
        ]})],
      })],
    });

    const rows = [headerRow];
    if (s.voiceover)       rows.push(cell('VOICEOVER',  s.voiceover,       SLATE));
    if (s.visual_direction) rows.push(cell('VISUAL',    s.visual_direction, INDIGO));
    if (s.b_roll_search_term && !s.visual_direction) rows.push(cell('B-ROLL', s.b_roll_search_term, INDIGO));
    if (s.overlay_text)    rows.push(cell('OVERLAY',    s.overlay_text,     ROSE));
    if (s.tone_direction)  rows.push(cell('DIRECTION',  s.tone_direction,   AMBER));

    return [
      new Paragraph({ ...sp(100, 0), children: [] }),
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [1800, 7560], rows }),
    ];
  }

  // day card paragraph group
  function dayCardGroup(item, dayName, idx) {
    const DAY_ACCENTS = [INDIGO, EMERALD, AMBER, ROSE, '7C3AED', '0891B2', '65A30D'];
    const DAY_BG      = ['EEF2FF','ECFDF5','FFFBEB','FFF1F2','F5F3FF','ECFEFF','F7FEE7'];
    const accent = DAY_ACCENTS[idx % 7];
    const bg     = DAY_BG[idx % 7];
    return [
      new Paragraph({
        ...sp(80, 0),
        shading: { type: ShadingType.CLEAR, fill: bg },
        border:  { left: { style: BorderStyle.THICK, size: 20, color: accent, space: 10 } },
        children: [
          new TextRun({ text: `Day ${item.day}  ·  ${dayName}`, size: 22, bold: true, font: 'Calibri', color: accent }),
          new TextRun({ text: `        ${safe(item.content_type || '')}`, size: 17, font: 'Calibri', color: MUTED }),
        ],
      }),
      new Paragraph({
        ...sp(0, 0),
        shading: { type: ShadingType.CLEAR, fill: bg },
        children: [new TextRun({ text: safe(item.topic_angle || ''), size: 20, font: 'Calibri', color: SLATE })],
      }),
      new Paragraph({
        ...sp(0, 80),
        shading: { type: ShadingType.CLEAR, fill: bg },
        children: [new TextRun({
          text: `Platform: ${safe(item.platform || '')}  ·  ${safe(item.repurpose_from || 'Original')}`,
          size: 16, font: 'Calibri', color: MUTED,
        })],
      }),
    ];
  }

  // ── Build document children ──────────────────────────────────────────────────
  const children = [];

  // COVER
  children.push(
    new Paragraph({ ...sp(320, 60), children: [
      new TextRun({ text: 'STUDIO  AI', size: 56, bold: true, font: 'Calibri', color: INDIGO, characterSpacing: 60 }),
    ]}),
    new Paragraph({ ...sp(0, 120),
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: INDIGO, space: 6 } },
      children: [new TextRun({ text: 'CONTENT  PACK', size: 20, font: 'Calibri', color: MUTED, characterSpacing: 40 })],
    }),
    new Paragraph({ ...sp(160, 60), children: [
      new TextRun({ text: safe(research.chosen_topic || 'Generated Content'), size: 48, bold: true, font: 'Calibri', color: SLATE }),
    ]}),
  );

  const metaLine = [
    input.platform ? `Platform: ${input.platform}` : null,
    input.language ? `Language: ${input.language}` : null,
    input.tone     ? `Tone: ${input.tone}` : null,
    meta.total_duration_ms ? `Generated in ${(meta.total_duration_ms / 1000).toFixed(1)}s` : null,
  ].filter(Boolean).join('   ·   ');

  if (metaLine) children.push(body(metaLine, { color: MUTED }));
  if (research.chosen_hook) {
    children.push(new Paragraph({ ...sp(160, 0), children: [] }));
    children.push(quoteBlock(research.chosen_hook, AMBER, AMBERBG));
  }
  children.push(pb());

  // S1 — Research
  children.push(...sectionHeading(1, 'Research & Strategy', INDIGO));

  if (research.chosen_topic) {
    children.push(
      fieldLabel('Chosen Topic', INDIGO),
      new Paragraph({ ...sp(40, 100), children: [
        new TextRun({ text: safe(research.chosen_topic), size: 36, bold: true, font: 'Calibri', color: SLATE }),
      ]}),
    );
  }
  if (research.chosen_hook) { children.push(fieldLabel('Opening Hook', AMBER), quoteBlock(research.chosen_hook, AMBER, AMBERBG)); }
  if (research.chosen_hook_trigger) { children.push(fieldLabel('Psychological Trigger', AMBER), tagLine([research.chosen_hook_trigger], AMBER, AMBERBG)); }
  if (research.chosen_topic_reasoning)     { children.push(fieldLabel('Why This Topic Wins'), body(research.chosen_topic_reasoning)); }
  if (research.target_audience_description){ children.push(fieldLabel('Target Audience'), body(research.target_audience_description)); }
  if (research.competitor_gap)             { children.push(fieldLabel('Competitor Gap'), body(research.competitor_gap)); }
  if (research.chosen_hook_deep_analysis)  { children.push(fieldLabel('Hook Psychology', AMBER), body(research.chosen_hook_deep_analysis)); }
  if (research.thumbnail_concept)          { children.push(fieldLabel('Thumbnail Concept'), body(research.thumbnail_concept)); }

  if (research.best_upload_time) {
    const t = research.best_upload_time;
    children.push(fieldLabel('Best Upload Window', EMERALD),
      highlightBox(`${t.day || ''} at ${t.time || ''} — ${t.reasoning || ''}`, EMERBG, '065F46'));
  }

  if (Array.isArray(research.trending_angles) && research.trending_angles.length > 0) {
    children.push(divider(), fieldLabel('Trending Angles', INDIGO));
    research.trending_angles.forEach((a, i) => {
      children.push(...numberedItem(i + 1, a.topic,
        [a.why_now, a.urgency_level ? `Urgency: ${a.urgency_level}` : ''].filter(Boolean).join('  ·  '),
        INDIGO));
    });
  }

  if (Array.isArray(research.hook_options) && research.hook_options.length > 0) {
    children.push(divider(), fieldLabel('All Hook Options', AMBER));
    research.hook_options.forEach(h => {
      if (h.psychological_trigger) children.push(tagLine([h.psychological_trigger], AMBER, AMBERBG));
      children.push(quoteBlock(h.hook_text, AMBER, AMBERBG));
      if (h.trigger_explanation) children.push(body(h.trigger_explanation, { color: MUTED }));
      children.push(new Paragraph({ ...sp(40, 0), children: [] }));
    });
  }

  children.push(pb());

  // S2 — Script
  children.push(...sectionHeading(2, 'Script & Content', ROSE));

  const statTags2 = [
    creator.word_count        ? `${creator.word_count} words`     : null,
    creator.estimated_duration ? creator.estimated_duration        : null,
    creator.scenes?.length    ? `${creator.scenes.length} scenes` : null,
  ].filter(Boolean);
  if (statTags2.length) { children.push(tagLine(statTags2, ROSE, ROSEBG), new Paragraph({ ...sp(80, 0), children: [] })); }

  if (creator.full_script) {
    children.push(fieldLabel('Full Script', ROSE));
    creator.full_script.split('\n').forEach(line => {
      if (line.trim()) children.push(body(line));
      else children.push(new Paragraph({ ...sp(40, 0), children: [] }));
    });
  }
  if (creator.shorts_script) {
    children.push(divider(), fieldLabel('Shorts / Reels Script (60s)', ROSE), quoteBlock(creator.shorts_script, ROSE, ROSEBG));
  }
  if (Array.isArray(creator.cta_options) && creator.cta_options.length > 0) {
    children.push(divider(), fieldLabel('CTA Options', ROSE));
    creator.cta_options.forEach((c, i) => {
      children.push(...numberedItem(i + 1, `"${c.cta_text}"`,
        [c.placement, c.goal].filter(Boolean).join('  ·  '), ROSE));
    });
  }
  if (creator.hook_breakdown) {
    const hb = creator.hook_breakdown;
    children.push(divider(), fieldLabel('Hook Psychology Breakdown', AMBER));
    if (hb.psychological_mechanism) { children.push(fieldLabel('Mechanism'), body(hb.psychological_mechanism)); }
    if (hb.what_viewer_is_thinking)  { children.push(fieldLabel("Viewer's Internal Monologue"), quoteBlock(hb.what_viewer_is_thinking, AMBER, AMBERBG)); }
    if (hb.why_first_3_seconds)      { children.push(fieldLabel('Why First 3 Seconds'), body(hb.why_first_3_seconds)); }
  }
  children.push(pb());

  // S3 — Scenes
  if (Array.isArray(creator.scenes) && creator.scenes.length > 0) {
    children.push(...sectionHeading(3, 'Scene Breakdown', INDIGO));
    creator.scenes.forEach(s => children.push(...sceneTable(s)));
    children.push(pb());
  }

  // S4 — YouTube SEO
  children.push(...sectionHeading(4, 'YouTube SEO', EMERALD));

  if (yt.recommended_title) {
    children.push(
      fieldLabel('Recommended Title ⭐', EMERALD),
      new Paragraph({
        ...sp(60, 100),
        shading: { type: ShadingType.CLEAR, fill: EMERBG },
        border:  { left: { style: BorderStyle.THICK, size: 20, color: EMERALD, space: 10 } },
        children: [new TextRun({ text: safe(yt.recommended_title), size: 28, bold: true, font: 'Calibri', color: SLATE })],
      }),
    );
  }

  if (Array.isArray(yt.title_options) && yt.title_options.length > 0) {
    children.push(fieldLabel('All Title Options', EMERALD));
    yt.title_options.forEach((t, i) => {
      children.push(...numberedItem(i + 1, t.title,
        [`${t.character_count || t.title?.length || 0} chars`, t.ctr_prediction ? `CTR: ${t.ctr_prediction}` : null].filter(Boolean).join('  ·  '),
        EMERALD));
    });
  }

  if (yt.description) { children.push(divider(), fieldLabel('YouTube Description', EMERALD), body(yt.description)); }

  if (Array.isArray(yt.tags) && yt.tags.length > 0) {
    children.push(divider(), fieldLabel(`SEO Tags (${yt.tags.length})`, EMERALD));
    for (let i = 0; i < yt.tags.length; i += 6) {
      children.push(tagLine(yt.tags.slice(i, i + 6), EMERALD, EMERBG));
    }
  }

  if (yt.primary_keyword) { children.push(fieldLabel('Primary Keyword', EMERALD), tagLine([yt.primary_keyword], WHITE, EMERALD)); }
  if (Array.isArray(yt.secondary_keywords) && yt.secondary_keywords.length > 0) {
    children.push(fieldLabel('Secondary Keywords'), tagLine(yt.secondary_keywords, EMERALD, EMERBG));
  }

  if (bl.seo_title) {
    children.push(divider(), fieldLabel('Blog SEO Title', EMERALD), body(bl.seo_title, { bold: true }));
    if (bl.meta_description) { children.push(fieldLabel('Meta Description'), body(bl.meta_description)); }
    if (bl.url_slug)          { children.push(fieldLabel('URL Slug'), body(`/${bl.url_slug}`, { color: EMERALD })); }
    if (Array.isArray(bl.suggested_h2_headers) && bl.suggested_h2_headers.length) {
      children.push(fieldLabel('Suggested H2 Headers'));
      bl.suggested_h2_headers.forEach((h, i) => children.push(body(`${i + 1}.  ${h}`)));
    }
  }
  children.push(pb());

  // S5 — Social
  children.push(...sectionHeading(5, 'Social Media Assets', ROSE));

  if (ig.caption) {
    children.push(
      new Paragraph({ ...sp(80, 40), shading: { type: ShadingType.CLEAR, fill: PINKBG },
        children: [new TextRun({ text: 'INSTAGRAM', size: 16, bold: true, font: 'Calibri', color: PINK, characterSpacing: 20 })],
      }),
      fieldLabel('Caption'), body(ig.caption),
    );
    if (ig.reel_cover_text)  { children.push(fieldLabel('Reel Cover Text'),  tagLine([ig.reel_cover_text], PINK, PINKBG)); }
    if (ig.story_slide_text) { children.push(fieldLabel('Story Slide Text'), body(ig.story_slide_text)); }
    if (ig.save_cta)         { children.push(fieldLabel('Save CTA'),         body(ig.save_cta)); }
    if (Array.isArray(ig.hashtags) && ig.hashtags.length > 0) {
      children.push(fieldLabel(`Hashtags (${ig.hashtags.length})`));
      const hTags = ig.hashtags.map(h => h.startsWith('#') ? h : `#${h}`);
      for (let i = 0; i < hTags.length; i += 5) children.push(tagLine(hTags.slice(i, i + 5), PINK, PINKBG));
    }
  }

  if (tt.caption) {
    children.push(
      divider(),
      new Paragraph({ ...sp(80, 40), shading: { type: ShadingType.CLEAR, fill: INDIGOBG },
        children: [new TextRun({ text: 'TIKTOK', size: 16, bold: true, font: 'Calibri', color: INDIGO, characterSpacing: 20 })],
      }),
      fieldLabel('Caption'), body(tt.caption),
    );
    if (tt.first_frame_text)       { children.push(fieldLabel('First Frame Text'),        highlightBox(tt.first_frame_text, INDIGOBG, '3730A3')); }
    if (tt.trending_sound_category){ children.push(fieldLabel('Trending Sound Category'), body(tt.trending_sound_category)); }
    if (tt.duet_stitch_suggestion) { children.push(fieldLabel('Duet / Stitch Suggestion'), body(tt.duet_stitch_suggestion)); }
    if (Array.isArray(tt.hashtags) && tt.hashtags.length > 0) {
      children.push(fieldLabel('Hashtags'), tagLine(tt.hashtags, INDIGO, INDIGOBG));
    }
  }

  if (ps.primary_post_day) {
    children.push(divider(), fieldLabel('Posting Schedule', EMERALD),
      highlightBox(`${ps.primary_post_day} at ${ps.primary_post_time || 'TBD'} — ${ps.reasoning || ''}`, EMERBG, '065F46'));
  }

  if (Array.isArray(publisher.cross_platform_repurpose) && publisher.cross_platform_repurpose.length > 0) {
    children.push(divider(), fieldLabel('Cross-Platform Repurpose'));
    publisher.cross_platform_repurpose.forEach((r, i) => {
      children.push(...numberedItem(i + 1, `${r.platform} — ${r.format}`, r.specific_angle || '', MUTED));
    });
  }
  children.push(pb());

  // S6 — 7-Day Plan
  if (Array.isArray(publisher.seven_day_content_plan) && publisher.seven_day_content_plan.length > 0) {
    children.push(...sectionHeading(6, '7-Day Content Sprint', AMBER));
    const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    publisher.seven_day_content_plan.forEach((item, i) => {
      children.push(...dayCardGroup(item, DAYS[i] || `Day ${item.day}`, i));
    });
  }

  // closing
  children.push(
    new Paragraph({ ...sp(400, 40), children: [] }),
    new Paragraph({ ...sp(0, 0), children: [
      new TextRun({
        text: `Generated by Studio AI  ·  ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        size: 16, font: 'Calibri', color: MUTED,
      }),
    ]}),
  );

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Calibri', size: 20, color: SLATE } } },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 32, bold: true, font: 'Calibri', color: INDIGO },
          paragraph: { spacing: { before: 480, after: 160 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, font: 'Calibri', color: SLATE },
          paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 900, right: 1000, bottom: 900, left: 1000 },
        },
      },
      children: children.filter(Boolean),
    }],
  });

  return Packer.toBuffer(doc);
}