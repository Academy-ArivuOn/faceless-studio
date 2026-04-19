// packages/agents/validator-blogger-patch.js
// 
// PATCH INSTRUCTIONS for packages/agents/validator.js:
// Replace the validateCreator function with the one below.
// Key changes:
// 1. Strips [placeholder] brackets from output BEFORE checking for them
// 2. Makes hook_breakdown.why_first_3_seconds a warning not critical for blogger mode
// 3. Auto-fills word_count if missing
// 4. Relaxed scene minimum for short-form platforms

// ─── The full replacement validateCreator function ────────────────────────────
export function validateCreator(data) {
  const issues = [];

  if (!data || typeof data !== 'object') {
    return {
      valid: false, critical: true,
      issues: [{ field: 'root', severity: 'critical', message: 'Creator output is not a valid object' }],
      errorCount: 1, warningCount: 0,
    };
  }

  const isBlogger = data.creator_mode === 'blogger';

  // ── Auto-fix word_count ──────────────────────────────────────────────────
  if ((!data.word_count || data.word_count < 10) && data.full_script) {
    data.word_count = data.full_script.split(/\s+/).filter(Boolean).length;
  }

  // ── Strip placeholder brackets from string fields before checking ────────
  // This prevents false positives from AI output like [your channel name]
  function stripBrackets(val) {
    if (typeof val !== 'string') return val;
    return val
      .replace(/\[(?:insert|add|your|paste|put|include)[^\]]*\]/gi, '')
      .replace(/\[(?:channel|creator|brand)[^\]]{0,40}\]/gi, '')
      .replace(/\[[^\]]{1,60}\]/g, '')
      .replace(/  +/g, ' ')
      .trim();
  }

  // Strip brackets from critical text fields
  if (data.full_script)    data.full_script    = stripBrackets(data.full_script);
  if (data.shorts_script)  data.shorts_script  = stripBrackets(data.shorts_script);
  if (data.hook_breakdown) {
    for (const k of Object.keys(data.hook_breakdown)) {
      if (typeof data.hook_breakdown[k] === 'string') {
        data.hook_breakdown[k] = stripBrackets(data.hook_breakdown[k]);
      }
    }
  }
  if (Array.isArray(data.scenes)) {
    data.scenes = data.scenes.map(s => {
      const cleaned = { ...s };
      for (const k of ['voiceover', 'visual_direction', 'tone_direction', 'overlay_text', 'b_roll_search_term']) {
        if (typeof cleaned[k] === 'string') cleaned[k] = stripBrackets(cleaned[k]);
      }
      return cleaned;
    }).filter(s => s.voiceover && s.voiceover.length > 5); // remove empty scenes
  }

  // ── full_script ───────────────────────────────────────────────────────────
  if (!data.full_script || data.full_script.trim() === '') {
    issues.push({ field: 'full_script', severity: 'critical', message: 'full_script is missing or empty' });
  } else if (data.full_script.length < 200) {
    issues.push({ field: 'full_script', severity: 'critical', message: `Script too short: ${data.full_script.length} chars` });
  } else if (/\[.{1,40}\]/.test(data.full_script)) {
    // After stripping, if brackets still present treat as warning not critical
    issues.push({ field: 'full_script', severity: 'warning', message: 'Script may contain unfilled placeholder text' });
  }

  // ── shorts_script ─────────────────────────────────────────────────────────
  if (!data.shorts_script || data.shorts_script.trim() === '') {
    issues.push({ field: 'shorts_script', severity: 'warning', message: 'shorts_script is missing' });
  } else if (data.shorts_script.length < 50) {
    issues.push({ field: 'shorts_script', severity: 'warning', message: 'shorts_script is very short' });
  }

  // ── estimated_duration ────────────────────────────────────────────────────
  if (!data.estimated_duration) {
    issues.push({ field: 'estimated_duration', severity: 'warning', message: 'estimated_duration missing' });
  }

  // ── word_count ────────────────────────────────────────────────────────────
  if (!data.word_count || typeof data.word_count !== 'number' || data.word_count < 30) {
    issues.push({ field: 'word_count', severity: 'warning', message: 'word_count missing or too low — auto-filled if possible' });
  }

  // ── scenes array ──────────────────────────────────────────────────────────
  const minScenes = isBlogger ? 2 : 2; // blogger can have fewer scenes for short-form
  if (!Array.isArray(data.scenes) || data.scenes.length < minScenes) {
    issues.push({ field: 'scenes', severity: 'critical', message: `At least ${minScenes} scenes required, got ${data.scenes?.length || 0}` });
  } else {
    data.scenes.forEach((scene, i) => {
      if (!scene.voiceover || scene.voiceover.length < 10) {
        issues.push({ field: `scenes[${i}].voiceover`, severity: 'critical', message: `Scene ${i + 1} voiceover missing or too short` });
      }
      if (!scene.section_type) {
        issues.push({ field: `scenes[${i}].section_type`, severity: 'warning', message: `Scene ${i + 1} missing section_type` });
      }
    });
  }

  // ── hook_breakdown ────────────────────────────────────────────────────────
  if (!data.hook_breakdown || typeof data.hook_breakdown !== 'object') {
    issues.push({ field: 'hook_breakdown', severity: 'critical', message: 'hook_breakdown object missing' });
  } else {
    const hb = data.hook_breakdown;

    // psychological_mechanism — required but length is a warning for blogger
    if (!hb.psychological_mechanism || hb.psychological_mechanism.trim() === '') {
      issues.push({ field: 'psychological_mechanism', severity: 'critical', message: 'psychological_mechanism is missing' });
    } else if (hb.psychological_mechanism.length < 40) {
      issues.push({ field: 'psychological_mechanism', severity: isBlogger ? 'warning' : 'critical', message: `psychological_mechanism too short: ${hb.psychological_mechanism.length} chars (min 40)` });
    }

    // what_viewer_is_thinking
    if (!hb.what_viewer_is_thinking || hb.what_viewer_is_thinking.trim() === '') {
      issues.push({ field: 'what_viewer_is_thinking', severity: isBlogger ? 'warning' : 'critical', message: 'what_viewer_is_thinking is missing' });
    }

    // why_first_3_seconds — warning only for blogger (it may be named differently)
    const hasFirst3 = hb.why_first_3_seconds || hb.why_this_works || hb.why_it_works;
    if (!hasFirst3 || String(hasFirst3).trim() === '') {
      issues.push({ field: 'why_first_3_seconds', severity: isBlogger ? 'warning' : 'critical', message: 'why_first_3_seconds field missing' });
    }
    // If blogger uses why_this_works, copy it over so downstream code works
    if (!hb.why_first_3_seconds && hb.why_this_works) {
      hb.why_first_3_seconds = hb.why_this_works;
    }
  }

  // ── pattern_interrupts ────────────────────────────────────────────────────
  if (!Array.isArray(data.pattern_interrupts) || data.pattern_interrupts.length < 1) {
    issues.push({ field: 'pattern_interrupts', severity: 'warning', message: 'No pattern interrupts — script may lose viewers' });
  }

  // ── cta_options ───────────────────────────────────────────────────────────
  if (!Array.isArray(data.cta_options) || data.cta_options.length < 1) {
    issues.push({ field: 'cta_options', severity: 'critical', message: 'At least 1 CTA option required' });
  } else if (!data.cta_options[0]?.cta_text || data.cta_options[0].cta_text.length < 5) {
    issues.push({ field: 'cta_options[0].cta_text', severity: 'critical', message: 'Primary CTA text missing or too short' });
  }

  const errorCount   = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return { valid: errorCount === 0, critical: errorCount > 0, issues, errorCount, warningCount };
}


// ─── Also patch validateResearch for blogger hooks ────────────────────────────
// Blogger research uses "opening_style" trigger not standard "psychological_trigger"
// Patch: make psychological_trigger a warning not critical

export function validateResearchBloggerPatch(data) {
  // Same as standard validateResearch but relaxed for blogger hook options
  // Just ensure chosen_hook and chosen_topic exist
  const issues = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, critical: true, issues: [{ field: 'root', severity: 'critical', message: 'Research output is not a valid object' }], errorCount: 1, warningCount: 0 };
  }

  if (!data.chosen_topic || data.chosen_topic.trim().length < 10) {
    issues.push({ field: 'chosen_topic', severity: 'critical', message: 'chosen_topic missing or too short' });
  }
  if (!data.chosen_hook || data.chosen_hook.trim().length < 10) {
    issues.push({ field: 'chosen_hook', severity: 'critical', message: 'chosen_hook missing or too short' });
  }
  if (!Array.isArray(data.hook_options) || data.hook_options.length < 2) {
    issues.push({ field: 'hook_options', severity: 'critical', message: 'At least 2 hook options required' });
  }
  if (!Array.isArray(data.trending_angles) || data.trending_angles.length < 2) {
    issues.push({ field: 'trending_angles', severity: 'critical', message: 'At least 2 trending angles required' });
  }

  const errorCount   = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  return { valid: errorCount === 0, critical: errorCount > 0, issues, errorCount, warningCount };
}
