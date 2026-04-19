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

    if (format === 'docx') {
      const docxBuffer = await generateDocx(result);
      return new Response(docxBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="studio-ai-content-${Date.now()}.docx"`,
        },
      });
    }

    if (format === 'pdf') {
      const pdfBuffer = await generatePdf(result);
      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="studio-ai-content-${Date.now()}.pdf"`,
        },
      });
    }

  } catch (err) {
    console.error('[export]', err.message);
    return Response.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}

// ── DOCX Generator ─────────────────────────────────────────────────────────────
async function generateDocx(result) {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, BorderStyle, ShadingType, WidthType,
    Table, TableRow, TableCell, LevelFormat, PageBreak,
  } = await import('docx');

  const { research = {}, creator = {}, publisher = {}, input = {}, meta = {} } = result;
  const yt = publisher.youtube || {};
  const ig = publisher.instagram || {};
  const tt = publisher.tiktok || {};
  const bl = publisher.blog || {};
  const ps = publisher.posting_schedule || {};

  const GOLD = '917A27';
  const DARK = '0A0A0A';
  const GRAY = '5C5C5C';
  const LIGHT = 'F5F5F5';

  const safe = (s) => (s || '').replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '');

  function heading1(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 120 },
      children: [new TextRun({ text: safe(text), bold: true, size: 28, font: 'Arial', color: DARK })],
    });
  }

  function heading2(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80 },
      children: [new TextRun({ text: safe(text), bold: true, size: 22, font: 'Arial', color: '333333' })],
    });
  }

  function body(text, options = {}) {
    return new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text: safe(text), size: 22, font: 'Arial', color: GRAY, ...options })],
    });
  }

  function label(text) {
    return new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [new TextRun({ text: safe(text.toUpperCase()), size: 18, font: 'Arial', color: '999999', bold: true })],
    });
  }

  function quote(text) {
    return new Paragraph({
      spacing: { before: 80, after: 80 },
      indent: { left: 720 },
      border: { left: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 1 } },
      children: [new TextRun({ text: safe(text), size: 22, font: 'Arial', color: GRAY, italics: true })],
    });
  }

  function divider() {
    return new Paragraph({
      spacing: { before: 200, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E8E8E8', space: 1 } },
      children: [],
    });
  }

  function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
  }

  function chip(text) {
    return new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text: `  ${safe(text)}  `, size: 18, font: 'Arial', color: DARK,
        shading: { type: ShadingType.CLEAR, fill: 'F0F0F0' } })],
    });
  }

  const children = [];

  // ── COVER ─────────────────────────────────────────────────────────────────
  children.push(
    new Paragraph({ spacing: { before: 720, after: 120 }, children: [
      new TextRun({ text: 'Studio AI', size: 48, bold: true, font: 'Arial', color: DARK })
    ]}),
    new Paragraph({ spacing: { before: 0, after: 80 }, children: [
      new TextRun({ text: 'Content Generation Report', size: 28, font: 'Arial', color: GRAY })
    ]}),
    new Paragraph({ spacing: { before: 0, after: 40 }, children: [
      new TextRun({ text: safe(research.chosen_topic || 'Generated Content'), size: 24, font: 'Arial', color: '888888', italics: true })
    ]}),
  );

  if (input.platform) children.push(body(`Platform: ${input.platform} · Language: ${input.language || 'English'} · Tone: ${input.tone || 'Educational'}`));
  if (meta.total_duration_ms) children.push(body(`Generated in ${(meta.total_duration_ms / 1000).toFixed(1)}s`));

  children.push(divider(), pageBreak());

  // ── SECTION 1: RESEARCH ───────────────────────────────────────────────────
  children.push(heading1('1. Research & Strategy'));

  if (research.chosen_topic) {
    children.push(label('Chosen Topic'), heading2(research.chosen_topic));
  }

  if (research.chosen_hook) {
    children.push(label('Opening Hook'), quote(research.chosen_hook));
  }

  if (research.chosen_hook_trigger) {
    children.push(label('Psychological Trigger'), chip(research.chosen_hook_trigger));
  }

  if (research.chosen_topic_reasoning) {
    children.push(label('Why This Topic Wins'), body(research.chosen_topic_reasoning));
  }

  if (research.target_audience_description) {
    children.push(label('Target Audience'), body(research.target_audience_description));
  }

  if (research.competitor_gap) {
    children.push(label('Competitor Gap'), body(research.competitor_gap));
  }

  if (research.chosen_hook_deep_analysis) {
    children.push(label('Hook Psychology'), body(research.chosen_hook_deep_analysis));
  }

  if (Array.isArray(research.trending_angles) && research.trending_angles.length > 0) {
    children.push(label('All Trending Angles Considered'));
    research.trending_angles.forEach((angle, i) => {
      children.push(
        body(`${i + 1}. ${angle.topic}`, { bold: true }),
        body(`Why now: ${angle.why_now || ''}`),
        body(`Urgency: ${angle.urgency_level || ''}`),
        new Paragraph({ spacing: { after: 60 }, children: [] }),
      );
    });
  }

  if (Array.isArray(research.hook_options) && research.hook_options.length > 0) {
    children.push(label('All Hook Options'));
    research.hook_options.forEach((h, i) => {
      children.push(
        body(`${i + 1}. [${h.psychological_trigger}]`, { bold: true }),
        quote(h.hook_text),
        body(h.trigger_explanation || ''),
        new Paragraph({ spacing: { after: 60 }, children: [] }),
      );
    });
  }

  if (research.best_upload_time) {
    children.push(label('Best Upload Time'),
      body(`${research.best_upload_time.day || ''} at ${research.best_upload_time.time || ''} — ${research.best_upload_time.reasoning || ''}`));
  }

  if (research.thumbnail_concept) {
    children.push(label('Thumbnail Concept'), body(research.thumbnail_concept));
  }

  children.push(divider(), pageBreak());

  // ── SECTION 2: SCRIPT ──────────────────────────────────────────────────────
  children.push(heading1('2. Script & Content'));

  if (creator.full_script) {
    children.push(label('Full Script'));
    const lines = creator.full_script.split('\n');
    lines.forEach(line => {
      if (line.trim()) children.push(body(line));
      else children.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
    });
  }

  if (creator.word_count) children.push(label('Stats'), body(`${creator.word_count} words · ${creator.estimated_duration || ''} · ${creator.scenes?.length || 0} scenes`));

  if (creator.shorts_script) {
    children.push(divider(), label('Shorts / Reels Version (60s)'), body(creator.shorts_script));
  }

  if (Array.isArray(creator.cta_options) && creator.cta_options.length > 0) {
    children.push(label('CTA Options'));
    creator.cta_options.forEach((cta, i) => {
      children.push(
        body(`${i + 1}. "${cta.cta_text}"`, { bold: true }),
        body(`Placement: ${cta.placement || ''} · Goal: ${cta.goal || ''}`),
        body(cta.why_it_works || ''),
        new Paragraph({ spacing: { after: 60 }, children: [] }),
      );
    });
  }

  if (creator.hook_breakdown) {
    children.push(label('Hook Psychology Breakdown'));
    const hb = creator.hook_breakdown;
    if (hb.psychological_mechanism) children.push(body(`Mechanism: ${hb.psychological_mechanism}`));
    if (hb.what_viewer_is_thinking) children.push(body(`Viewer's thought: "${hb.what_viewer_is_thinking}"`));
    if (hb.why_first_3_seconds) children.push(body(`First 3 seconds: ${hb.why_first_3_seconds}`));
  }

  children.push(divider(), pageBreak());

  // ── SECTION 3: SCENES ─────────────────────────────────────────────────────
  if (Array.isArray(creator.scenes) && creator.scenes.length > 0) {
    children.push(heading1('3. Scene Breakdown'));
    creator.scenes.forEach(s => {
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [
            new TextRun({ text: `Scene ${s.scene_number} — ${s.section_type}`, bold: true, size: 22, font: 'Arial', color: DARK }),
            new TextRun({ text: `  ${s.timestamp_start} → ${s.timestamp_end}`, size: 18, font: 'Arial', color: '999999' }),
          ],
        }),
        body(`Voiceover: ${s.voiceover || ''}`),
      );
      if (s.visual_direction) children.push(body(`Visual: ${s.visual_direction}`));
      if (s.b_roll_search_term) children.push(body(`B-Roll: ${s.b_roll_search_term}`));
      if (s.tone_direction) children.push(body(`Tone: ${s.tone_direction}`));
      if (s.overlay_text) children.push(body(`Overlay: ${s.overlay_text}`));
      children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
    });
    children.push(divider(), pageBreak());
  }

  // ── SECTION 4: YOUTUBE SEO ────────────────────────────────────────────────
  children.push(heading1('4. YouTube SEO'));

  if (yt.recommended_title) {
    children.push(label('Recommended Title'), heading2(yt.recommended_title));
  }

  if (Array.isArray(yt.title_options) && yt.title_options.length > 0) {
    children.push(label('All Title Options'));
    yt.title_options.forEach((t, i) => {
      children.push(
        body(`${i + 1}. ${t.title}`, { bold: true }),
        body(`${t.character_count || t.title?.length || 0} chars · CTR: ${t.ctr_prediction || ''} · ${t.primary_strategy || ''}`),
        body(t.reasoning || ''),
        new Paragraph({ spacing: { after: 60 }, children: [] }),
      );
    });
  }

  if (yt.description) {
    children.push(label('YouTube Description'), body(yt.description));
  }

  if (Array.isArray(yt.tags) && yt.tags.length > 0) {
    children.push(label(`SEO Tags (${yt.tags.length})`));
    children.push(body(yt.tags.join(', ')));
  }

  if (yt.primary_keyword) {
    children.push(label('Primary Keyword'), chip(yt.primary_keyword));
  }

  if (Array.isArray(yt.secondary_keywords) && yt.secondary_keywords.length > 0) {
    children.push(label('Secondary Keywords'), body(yt.secondary_keywords.join(', ')));
  }

  if (bl.seo_title) {
    children.push(divider(), label('Blog SEO Title'), body(bl.seo_title));
    if (bl.meta_description) children.push(label('Meta Description'), body(bl.meta_description));
    if (bl.url_slug) children.push(label('URL Slug'), body(bl.url_slug));
    if (Array.isArray(bl.suggested_h2_headers)) children.push(label('Suggested H2 Headers'), body(bl.suggested_h2_headers.join(' · ')));
  }

  children.push(divider(), pageBreak());

  // ── SECTION 5: SOCIAL ─────────────────────────────────────────────────────
  children.push(heading1('5. Social Media Assets'));

  if (ig.caption) {
    children.push(label('Instagram Caption'), body(ig.caption));
    if (ig.reel_cover_text) children.push(label('Reel Cover Text'), chip(ig.reel_cover_text));
    if (ig.story_slide_text) children.push(label('Story Text'), body(ig.story_slide_text));
    if (Array.isArray(ig.hashtags)) children.push(label(`Instagram Hashtags (${ig.hashtags.length})`), body(ig.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')));
  }

  if (tt.caption) {
    children.push(divider(), label('TikTok Caption'), body(tt.caption));
    if (tt.first_frame_text) children.push(label('First Frame Text'), chip(tt.first_frame_text));
    if (Array.isArray(tt.hashtags)) children.push(label('TikTok Hashtags'), body(tt.hashtags.join(' ')));
  }

  if (ps.primary_post_day) {
    children.push(divider(), label('Posting Schedule'),
      body(`${ps.primary_post_day} at ${ps.primary_post_time || 'TBD'}`),
      body(ps.reasoning || ''));
  }

  if (Array.isArray(publisher.cross_platform_repurpose) && publisher.cross_platform_repurpose.length > 0) {
    children.push(label('Cross-Platform Repurpose Plan'));
    publisher.cross_platform_repurpose.forEach(r => {
      children.push(body(`${r.platform} — ${r.format}: ${r.specific_angle || ''}`));
    });
  }

  children.push(divider(), pageBreak());

  // ── SECTION 6: 7-DAY PLAN ─────────────────────────────────────────────────
  if (Array.isArray(publisher.seven_day_content_plan) && publisher.seven_day_content_plan.length > 0) {
    children.push(heading1('6. 7-Day Content Sprint'));
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    publisher.seven_day_content_plan.forEach((item, i) => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({ text: `Day ${item.day} — ${DAYS[i] || ''}`, bold: true, size: 22, font: 'Arial', color: DARK }),
          ],
        }),
        body(`[${item.content_type}] ${item.topic_angle}`),
        body(`Platform: ${item.platform} · Source: ${item.repurpose_from || 'Original'}`),
        new Paragraph({ spacing: { after: 60 }, children: [] }),
      );
    });
    children.push(divider());
  }

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  children.push(
    new Paragraph({ spacing: { before: 240, after: 60 }, children: [
      new TextRun({ text: 'Generated by Studio AI', size: 18, font: 'Arial', color: '999999' })
    ]}),
    new Paragraph({ spacing: { after: 0 }, children: [
      new TextRun({ text: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }), size: 18, font: 'Arial', color: 'CCCCCC' })
    ]}),
  );

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22 } },
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 32, bold: true, font: 'Arial', color: DARK },
          paragraph: { spacing: { before: 480, after: 160 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, font: 'Arial', color: '222222' },
          paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    }],
  });

  return Packer.toBuffer(doc);
}

// ── PDF Generator ──────────────────────────────────────────────────────────────
async function generatePdf(result) {
  const { default: PDFDocument } = await import('pdfkit');
  
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 60, size: 'A4', info: { Title: 'Studio AI Content Report', Author: 'Studio AI' } });

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { research = {}, creator = {}, publisher = {}, input = {}, meta = {} } = result;
    const yt = publisher.youtube || {};
    const ig = publisher.instagram || {};
    const tt = publisher.tiktok || {};
    const bl = publisher.blog || {};
    const ps = publisher.posting_schedule || {};

    const W = doc.page.width - 120;
    const GOLD = '#917A27';
    const DARK = '#0A0A0A';
    const GRAY = '#5C5C5C';
    const MUTED = '#8C8C8C';

    const safe = (s) => (s || '').toString().replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '');

    function addPage() {
      doc.addPage();
    }

    function sectionTitle(text, num) {
      doc.fontSize(18).fillColor(DARK).font('Helvetica-Bold').text(`${num}. ${safe(text)}`, { continued: false });
      doc.moveDown(0.3);
      doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor('#E8E8E8').lineWidth(0.5).stroke();
      doc.moveDown(0.6);
    }

    function fieldLabel(text) {
      doc.moveDown(0.4);
      doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold').text(safe(text.toUpperCase()), { characterSpacing: 1 });
      doc.moveDown(0.2);
    }

    function bodyText(text, opts = {}) {
      if (!text) return;
      doc.fontSize(10).fillColor(GRAY).font('Helvetica').text(safe(text), { lineGap: 3, ...opts });
      doc.moveDown(0.2);
    }

    function quoteText(text) {
      if (!text) return;
      const y = doc.y;
      doc.moveTo(60, y).lineTo(60, y + 40).strokeColor(GOLD).lineWidth(2).stroke();
      doc.fontSize(11).fillColor(GRAY).font('Helvetica-Oblique').text(safe(`"${text}"`), 72, y, { width: W - 12 });
      doc.moveDown(0.5);
    }

    function checkSpace(needed = 80) {
      if (doc.y > doc.page.height - needed - 60) addPage();
    }

    // ── Cover ─────────────────────────────────────────────────────────────────
    doc.fontSize(32).fillColor(DARK).font('Helvetica-Bold').text('Studio AI', 60, 120);
    doc.fontSize(14).fillColor(GRAY).font('Helvetica').text('Content Generation Report', 60, doc.y + 8);
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor(MUTED).font('Helvetica-Oblique').text(safe(research.chosen_topic || 'Generated Content'));
    doc.moveDown(1);
    doc.fontSize(9).fillColor('#BCBCBC').font('Helvetica')
      .text(`${safe(input.platform || '')} · ${safe(input.language || 'English')} · ${safe(input.tone || 'Educational')}`);
    if (meta.total_duration_ms) doc.text(`Generated in ${(meta.total_duration_ms / 1000).toFixed(1)}s`);

    doc.moveTo(60, doc.y + 20).lineTo(doc.page.width - 60, doc.y + 20).strokeColor('#E8E8E8').lineWidth(0.5).stroke();

    addPage();

    // ── 1. Research ────────────────────────────────────────────────────────────
    sectionTitle('Research & Strategy', 1);

    if (research.chosen_topic) {
      fieldLabel('Chosen Topic');
      doc.fontSize(14).fillColor(DARK).font('Helvetica-Bold').text(safe(research.chosen_topic));
      doc.moveDown(0.4);
    }

    if (research.chosen_hook) {
      fieldLabel('Opening Hook');
      quoteText(research.chosen_hook);
    }

    if (research.chosen_hook_trigger) {
      fieldLabel('Psychological Trigger');
      doc.fontSize(9).fillColor(DARK).font('Helvetica-Bold')
        .text(safe(research.chosen_hook_trigger), { background: '#F0F0F0' });
      doc.moveDown(0.3);
    }

    if (research.chosen_topic_reasoning) { fieldLabel('Why This Topic Wins'); bodyText(research.chosen_topic_reasoning); }
    if (research.target_audience_description) { fieldLabel('Target Audience'); bodyText(research.target_audience_description); }
    if (research.competitor_gap) { fieldLabel('Competitor Gap'); bodyText(research.competitor_gap); }
    if (research.chosen_hook_deep_analysis) { fieldLabel('Hook Psychology'); bodyText(research.chosen_hook_deep_analysis); }

    if (Array.isArray(research.trending_angles) && research.trending_angles.length > 0) {
      checkSpace(120);
      fieldLabel('All Trending Angles');
      research.trending_angles.forEach((a, i) => {
        checkSpace(60);
        doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text(`${i + 1}. ${safe(a.topic)}`);
        bodyText(`Why now: ${a.why_now || ''}`);
        doc.moveDown(0.2);
      });
    }

    if (Array.isArray(research.hook_options) && research.hook_options.length > 0) {
      checkSpace(120);
      fieldLabel('All Hook Options');
      research.hook_options.forEach((h, i) => {
        checkSpace(80);
        doc.fontSize(9).fillColor(MUTED).font('Helvetica-Bold').text(`[${safe(h.psychological_trigger)}]`);
        quoteText(h.hook_text);
        bodyText(h.trigger_explanation || '');
      });
    }

    if (research.best_upload_time) {
      fieldLabel('Best Upload Time');
      bodyText(`${research.best_upload_time.day || ''} at ${research.best_upload_time.time || ''} — ${research.best_upload_time.reasoning || ''}`);
    }

    if (research.thumbnail_concept) { fieldLabel('Thumbnail Concept'); bodyText(research.thumbnail_concept); }

    addPage();

    // ── 2. Script ──────────────────────────────────────────────────────────────
    sectionTitle('Script & Content', 2);

    if (creator.word_count) {
      bodyText(`${creator.word_count} words · ${creator.estimated_duration || ''} · ${creator.scenes?.length || 0} scenes`);
    }

    if (creator.full_script) {
      fieldLabel('Full Script');
      const lines = creator.full_script.split('\n');
      lines.forEach(line => {
        checkSpace(30);
        if (line.trim()) bodyText(line);
        else doc.moveDown(0.3);
      });
    }

    if (creator.shorts_script) {
      checkSpace(100);
      fieldLabel('Shorts / Reels Version (60s)');
      bodyText(creator.shorts_script);
    }

    if (Array.isArray(creator.cta_options) && creator.cta_options.length > 0) {
      checkSpace(80);
      fieldLabel('CTA Options');
      creator.cta_options.forEach((cta, i) => {
        doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text(`${i + 1}. "${safe(cta.cta_text)}"`);
        bodyText(`${cta.placement || ''} · ${cta.goal || ''}`);
        doc.moveDown(0.2);
      });
    }

    if (creator.hook_breakdown) {
      checkSpace(100);
      fieldLabel('Hook Psychology');
      const hb = creator.hook_breakdown;
      if (hb.psychological_mechanism) bodyText(`Mechanism: ${hb.psychological_mechanism}`);
      if (hb.what_viewer_is_thinking) bodyText(`Viewer's thought: "${hb.what_viewer_is_thinking}"`);
      if (hb.why_first_3_seconds) bodyText(`First 3 seconds: ${hb.why_first_3_seconds}`);
    }

    addPage();

    // ── 3. Scenes ──────────────────────────────────────────────────────────────
    if (Array.isArray(creator.scenes) && creator.scenes.length > 0) {
      sectionTitle('Scene Breakdown', 3);
      creator.scenes.forEach(s => {
        checkSpace(80);
        doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold')
          .text(`Scene ${s.scene_number} — ${safe(s.section_type)}   `, { continued: true });
        doc.fontSize(9).fillColor(MUTED).font('Helvetica').text(`${s.timestamp_start} → ${s.timestamp_end}`);
        bodyText(`Voiceover: ${s.voiceover || ''}`);
        if (s.visual_direction) bodyText(`Visual: ${s.visual_direction}`);
        if (s.b_roll_search_term) bodyText(`B-Roll: ${s.b_roll_search_term}`);
        if (s.tone_direction) bodyText(`Tone: ${s.tone_direction}`);
        if (s.overlay_text) bodyText(`Overlay: ${s.overlay_text}`);
        doc.moveDown(0.4);
      });
      addPage();
    }

    // ── 4. YouTube SEO ─────────────────────────────────────────────────────────
    sectionTitle('YouTube SEO', 4);

    if (yt.recommended_title) {
      fieldLabel('Recommended Title');
      doc.fontSize(13).fillColor(DARK).font('Helvetica-Bold').text(safe(yt.recommended_title));
      doc.moveDown(0.5);
    }

    if (Array.isArray(yt.title_options)) {
      fieldLabel('All Title Options');
      yt.title_options.forEach((t, i) => {
        checkSpace(50);
        doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text(`${i + 1}. ${safe(t.title)}`);
        doc.fontSize(9).fillColor(MUTED).font('Helvetica').text(`${t.character_count || t.title?.length || 0} chars · CTR: ${t.ctr_prediction || ''}`);
        if (t.reasoning) bodyText(t.reasoning);
        doc.moveDown(0.2);
      });
    }

    if (yt.description) { checkSpace(100); fieldLabel('YouTube Description'); bodyText(yt.description); }

    if (Array.isArray(yt.tags) && yt.tags.length > 0) {
      fieldLabel(`SEO Tags (${yt.tags.length})`);
      bodyText(yt.tags.join(' · '));
    }

    if (yt.primary_keyword) {
      fieldLabel('Primary Keyword');
      doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text(safe(yt.primary_keyword));
      doc.moveDown(0.2);
    }

    if (Array.isArray(yt.secondary_keywords)) { fieldLabel('Secondary Keywords'); bodyText(yt.secondary_keywords.join(', ')); }

    if (bl.seo_title) {
      checkSpace(80);
      fieldLabel('Blog SEO Title');
      bodyText(bl.seo_title);
      if (bl.meta_description) { fieldLabel('Meta Description'); bodyText(bl.meta_description); }
      if (bl.url_slug) { fieldLabel('URL Slug'); bodyText(bl.url_slug); }
    }

    addPage();

    // ── 5. Social ──────────────────────────────────────────────────────────────
    sectionTitle('Social Media Assets', 5);

    if (ig.caption) {
      fieldLabel('Instagram Caption');
      bodyText(ig.caption);
      if (ig.reel_cover_text) { fieldLabel('Reel Cover Text'); bodyText(ig.reel_cover_text); }
      if (ig.story_slide_text) { fieldLabel('Story Text'); bodyText(ig.story_slide_text); }
      if (Array.isArray(ig.hashtags)) {
        fieldLabel(`Instagram Hashtags (${ig.hashtags.length})`);
        bodyText(ig.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' '));
      }
    }

    if (tt.caption) {
      checkSpace(100);
      fieldLabel('TikTok Caption');
      bodyText(tt.caption);
      if (tt.first_frame_text) { fieldLabel('First Frame Text'); bodyText(tt.first_frame_text); }
      if (Array.isArray(tt.hashtags)) { fieldLabel('TikTok Hashtags'); bodyText(tt.hashtags.join(' ')); }
    }

    if (ps.primary_post_day) {
      checkSpace(80);
      fieldLabel('Posting Schedule');
      bodyText(`${ps.primary_post_day} at ${ps.primary_post_time || 'TBD'}`);
      bodyText(ps.reasoning || '');
    }

    if (Array.isArray(publisher.cross_platform_repurpose)) {
      checkSpace(60);
      fieldLabel('Cross-Platform Repurpose');
      publisher.cross_platform_repurpose.forEach(r => {
        bodyText(`${r.platform} — ${r.format}: ${r.specific_angle || ''}`);
      });
    }

    addPage();

    // ── 6. 7-Day Plan ─────────────────────────────────────────────────────────
    if (Array.isArray(publisher.seven_day_content_plan) && publisher.seven_day_content_plan.length > 0) {
      sectionTitle('7-Day Content Sprint', 6);
      const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      publisher.seven_day_content_plan.forEach((item, i) => {
        checkSpace(60);
        doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold')
          .text(`Day ${item.day} — ${DAYS[i] || ''}`);
        doc.fontSize(9).fillColor(MUTED).font('Helvetica')
          .text(`[${safe(item.content_type)}] ${safe(item.topic_angle)}`);
        bodyText(`Platform: ${item.platform || ''} · Source: ${item.repurpose_from || 'Original'}`);
        doc.moveDown(0.3);
      });
    }

    // ── Footer ─────────────────────────────────────────────────────────────────
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#CCCCCC').font('Helvetica')
        .text(`Studio AI · ${new Date().toLocaleDateString('en-IN')} · Page ${i + 1} of ${pageCount}`,
          60, doc.page.height - 40, { align: 'center', width: W });
    }

    doc.end();
  });
}
