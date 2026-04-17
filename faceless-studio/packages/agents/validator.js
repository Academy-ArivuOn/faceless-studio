// ─── AI Tell-tale Phrases ─────────────────────────────────────────────────────
// These phrases indicate the model defaulted to generic output — reject them.
export const AI_TELLS = [
  'as an ai',
  "i'm unable to",
  'i cannot provide',
  'certainly!',
  'absolutely!',
  'great question',
  "i'd be happy to",
  'it is important to note',
  'please note that',
  'i hope this helps',
  'feel free to',
  'let me know if you need',
  'in conclusion',
  'in summary',
  'to summarise',
  'in today\'s digital age',
  'in the ever-evolving',
  'leverage synergies',
  'game-changer',
  'revolutionary approach',
  'state-of-the-art',
  '[topic]',
  '[your niche]',
  '[insert',
  '[add your',
  '[creator name]',
  '[channel name]',
  '(add link)',
  '(insert statistic)',
  '(your name)',
  'welcome back to my channel',
  'hey guys, welcome back',
  'in this video, i\'m going to',
  'today we\'re going to talk about',
  'so today i wanted to',
];

// ─── Minimum Lengths (characters) ─────────────────────────────────────────────
export const MIN_LENGTHS = {
  // Research fields
  chosen_topic:              25,
  chosen_topic_reasoning:    80,
  target_audience_description: 60,
  competitor_gap:            50,
  chosen_hook:               30,
  chosen_hook_deep_analysis: 150,
  hook_text:                 30,
  trigger_explanation:       50,

  // Creator fields
  full_script:               500,   // short-form minimum; long-form checked separately
  shorts_script:             100,
  voiceover:                 20,
  psychological_mechanism:   70,
  what_viewer_is_thinking:   40,

  // Publisher fields
  description:               400,   // YouTube description
  caption:                   250,   // Instagram caption
  meta_description:          60,
  seo_title:                 30,
  reasoning:                 40,
};

// ─── Field Check ──────────────────────────────────────────────────────────────
export function checkField(value, fieldName) {
  const issues = [];
  const strVal = (value == null) ? '' : String(value);

  // Check for missing/empty
  if (!value || strVal.trim() === '') {
    issues.push({
      field:    fieldName,
      severity: 'critical',
      message:  `Field "${fieldName}" is missing or empty`,
    });
    return issues;
  }

  // Check minimum length
  const minLen = MIN_LENGTHS[fieldName];
  if (minLen && strVal.length < minLen) {
    issues.push({
      field:    fieldName,
      severity: 'critical',
      message:  `Field "${fieldName}" is too short: ${strVal.length} chars (minimum ${minLen})`,
    });
  }

  // Check for AI tell-tale phrases
  const lower = strVal.toLowerCase();
  for (const tell of AI_TELLS) {
    if (lower.includes(tell)) {
      issues.push({
        field:    fieldName,
        severity: 'warning',
        message:  `Field "${fieldName}" contains AI filler phrase: "${tell}"`,
      });
      break; // one warning per field is enough
    }
  }

  // Check for unfilled bracket placeholders
  // Soft fields (description/caption): warning only — route strips brackets before validate.
  // All other fields: critical — a script or title with [insert X] is unusable.
  const SOFT_FIELDS = new Set(['description', 'caption', 'meta_description', 'seo_title']);
  if (/\[.{1,40}\]/.test(strVal) || /\(.{1,40}here\)/i.test(strVal)) {
    issues.push({
      field:    fieldName,
      severity: SOFT_FIELDS.has(fieldName) ? 'warning' : 'critical',
      message:  `Field "${fieldName}" contains unfilled placeholder brackets`,
    });
  }

  return issues;
}

// ─── Research Validator ───────────────────────────────────────────────────────
export function validateResearch(data) {
  const issues = [];

  if (!data || typeof data !== 'object') {
    return {
      valid:        false,
      critical:     true,
      issues:       [{ field: 'root', severity: 'critical', message: 'Research output is not a valid object' }],
      errorCount:   1,
      warningCount: 0,
    };
  }

  // Top-level string fields
  issues.push(...checkField(data.chosen_topic,               'chosen_topic'));
  issues.push(...checkField(data.chosen_topic_reasoning,     'chosen_topic_reasoning'));
  issues.push(...checkField(data.target_audience_description,'target_audience_description'));
  issues.push(...checkField(data.competitor_gap,             'competitor_gap'));
  issues.push(...checkField(data.chosen_hook,                'chosen_hook'));
  issues.push(...checkField(data.chosen_hook_trigger,        'chosen_hook_trigger'));
  issues.push(...checkField(data.chosen_hook_deep_analysis,  'chosen_hook_deep_analysis'));

  // trending_angles array
  if (!Array.isArray(data.trending_angles) || data.trending_angles.length < 2) {
    issues.push({ field: 'trending_angles', severity: 'critical', message: 'At least 2 trending angles required' });
  } else {
    data.trending_angles.forEach((angle, i) => {
      if (!angle.topic || angle.topic.length < 15) {
        issues.push({ field: `trending_angles[${i}].topic`, severity: 'critical', message: `Angle ${i + 1} topic too short or missing` });
      }
      if (!angle.why_now) {
        issues.push({ field: `trending_angles[${i}].why_now`, severity: 'warning', message: `Angle ${i + 1} missing why_now` });
      }
    });
  }

  // hook_options array
  if (!Array.isArray(data.hook_options) || data.hook_options.length < 2) {
    issues.push({ field: 'hook_options', severity: 'critical', message: 'At least 2 hook options required' });
  } else {
    data.hook_options.forEach((hook, i) => {
      issues.push(...checkField(hook.hook_text,            `hook_options[${i}].hook_text`));
      issues.push(...checkField(hook.trigger_explanation,  `hook_options[${i}].trigger_explanation`));
      if (!hook.psychological_trigger) {
        issues.push({ field: `hook_options[${i}].psychological_trigger`, severity: 'warning', message: `Hook ${i + 1} missing psychological_trigger` });
      }
    });
  }

  // Validate chosen_hook matches one of the hook_options
  if (
    data.chosen_hook &&
    Array.isArray(data.hook_options) &&
    !data.hook_options.some(h => h.hook_text === data.chosen_hook)
  ) {
    issues.push({
      field:    'chosen_hook',
      severity: 'warning',
      message:  'chosen_hook does not exactly match any hook_options[].hook_text',
    });
  }

  // best_upload_time object
  if (!data.best_upload_time?.day || !data.best_upload_time?.time) {
    issues.push({ field: 'best_upload_time', severity: 'warning', message: 'best_upload_time missing day or time' });
  }

  if (!data.thumbnail_concept || data.thumbnail_concept.length < 30) {
    issues.push({ field: 'thumbnail_concept', severity: 'warning', message: 'thumbnail_concept is missing or too brief' });
  }

  const errorCount   = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return { valid: errorCount === 0, critical: errorCount > 0, issues, errorCount, warningCount };
}

// ─── Creator Validator ────────────────────────────────────────────────────────
export function validateCreator(data) {
  const issues = [];

  if (!data || typeof data !== 'object') {
    return {
      valid:        false,
      critical:     true,
      issues:       [{ field: 'root', severity: 'critical', message: 'Creator output is not a valid object' }],
      errorCount:   1,
      warningCount: 0,
    };
  }

  // full_script — most critical field
  issues.push(...checkField(data.full_script, 'full_script'));
  if (data.full_script && data.full_script.length < 500) {
    issues.push({ field: 'full_script', severity: 'critical', message: `Script is too short: ${data.full_script.length} chars` });
  }

  issues.push(...checkField(data.shorts_script,             'shorts_script'));
  issues.push(...checkField(data.estimated_duration,        'estimated_duration'));

  // word_count must be a positive number
  if (!data.word_count || typeof data.word_count !== 'number' || data.word_count < 50) {
    issues.push({ field: 'word_count', severity: 'warning', message: 'word_count missing or too low' });
  }

  // scenes array
  if (!Array.isArray(data.scenes) || data.scenes.length < 2) {
    issues.push({ field: 'scenes', severity: 'critical', message: 'At least 2 scenes required' });
  } else {
    data.scenes.forEach((scene, i) => {
      if (!scene.voiceover || scene.voiceover.length < 15) {
        issues.push({ field: `scenes[${i}].voiceover`, severity: 'critical', message: `Scene ${i + 1} voiceover missing or too short` });
      }
      if (!scene.section_type) {
        issues.push({ field: `scenes[${i}].section_type`, severity: 'warning', message: `Scene ${i + 1} missing section_type` });
      }
    });
  }

  // hook_breakdown object
  if (!data.hook_breakdown || typeof data.hook_breakdown !== 'object') {
    issues.push({ field: 'hook_breakdown', severity: 'critical', message: 'hook_breakdown object missing' });
  } else {
    issues.push(...checkField(data.hook_breakdown.psychological_mechanism, 'psychological_mechanism'));
    issues.push(...checkField(data.hook_breakdown.what_viewer_is_thinking,  'what_viewer_is_thinking'));
    issues.push(...checkField(data.hook_breakdown.why_first_3_seconds,      'why_first_3_seconds'));
  }

  // pattern_interrupts
  if (!Array.isArray(data.pattern_interrupts) || data.pattern_interrupts.length < 1) {
    issues.push({ field: 'pattern_interrupts', severity: 'warning', message: 'No pattern interrupts found — script may lose viewers' });
  }

  // cta_options
  if (!Array.isArray(data.cta_options) || data.cta_options.length < 1) {
    issues.push({ field: 'cta_options', severity: 'critical', message: 'At least 1 CTA option required' });
  } else {
    if (!data.cta_options[0]?.cta_text || data.cta_options[0].cta_text.length < 10) {
      issues.push({ field: 'cta_options[0].cta_text', severity: 'critical', message: 'Primary CTA text missing or too short' });
    }
  }

  const errorCount   = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return { valid: errorCount === 0, critical: errorCount > 0, issues, errorCount, warningCount };
}

// ─── Publisher Validator ──────────────────────────────────────────────────────
export function validatePublisher(data) {
  const issues = [];

  if (!data || typeof data !== 'object') {
    return {
      valid:        false,
      critical:     true,
      issues:       [{ field: 'root', severity: 'critical', message: 'Publisher output is not a valid object' }],
      errorCount:   1,
      warningCount: 0,
    };
  }

  // YouTube section
  if (!data.youtube || typeof data.youtube !== 'object') {
    issues.push({ field: 'youtube', severity: 'critical', message: 'YouTube section missing' });
  } else {
    const yt = data.youtube;
    if (!Array.isArray(yt.title_options) || yt.title_options.length < 2) {
      issues.push({ field: 'youtube.title_options', severity: 'critical', message: 'At least 2 YouTube title options required' });
    } else {
      yt.title_options.forEach((t, i) => {
        if (!t.title || t.title.length < 20) {
          issues.push({ field: `youtube.title_options[${i}].title`, severity: 'critical', message: `Title option ${i + 1} missing or too short` });
        }
        if (t.title && t.title.length > 100) {
          issues.push({ field: `youtube.title_options[${i}].title`, severity: 'warning', message: `Title option ${i + 1} is over 100 chars — may be truncated` });
        }
      });
    }
    issues.push(...checkField(yt.recommended_title, 'recommended_title'));
    issues.push(...checkField(yt.description,        'description'));

    if (!Array.isArray(yt.tags) || yt.tags.length < 8) {
      issues.push({ field: 'youtube.tags', severity: 'warning', message: 'Fewer than 8 YouTube tags — aim for 12' });
    }
    if (!yt.primary_keyword) {
      issues.push({ field: 'youtube.primary_keyword', severity: 'warning', message: 'Primary keyword missing' });
    }
  }

  // Instagram section
  if (!data.instagram || typeof data.instagram !== 'object') {
    issues.push({ field: 'instagram', severity: 'critical', message: 'Instagram section missing' });
  } else {
    issues.push(...checkField(data.instagram.caption, 'caption'));
    if (!Array.isArray(data.instagram.hashtags) || data.instagram.hashtags.length < 10) {
      issues.push({ field: 'instagram.hashtags', severity: 'warning', message: 'Fewer than 10 Instagram hashtags' });
    }
  }

  // TikTok section
  if (!data.tiktok || typeof data.tiktok !== 'object') {
    issues.push({ field: 'tiktok', severity: 'warning', message: 'TikTok section missing' });
  } else {
    if (!data.tiktok.caption || data.tiktok.caption.length < 10) {
      issues.push({ field: 'tiktok.caption', severity: 'warning', message: 'TikTok caption missing or too short' });
    }
    if (data.tiktok.caption && data.tiktok.caption.length > 150) {
      issues.push({ field: 'tiktok.caption', severity: 'warning', message: 'TikTok caption over 100 chars — may be truncated' });
    }
  }

  // Blog section
  if (!data.blog || typeof data.blog !== 'object') {
    issues.push({ field: 'blog', severity: 'warning', message: 'Blog SEO section missing' });
  } else {
    issues.push(...checkField(data.blog.seo_title,        'seo_title'));
    issues.push(...checkField(data.blog.meta_description, 'meta_description'));
    if (data.blog.meta_description && data.blog.meta_description.length > 160) {
      issues.push({ field: 'blog.meta_description', severity: 'warning', message: 'Meta description over 155 chars — may be cut off in search' });
    }
  }

  // 7-day plan
  if (!Array.isArray(data.seven_day_content_plan) || data.seven_day_content_plan.length < 5) {
    issues.push({ field: 'seven_day_content_plan', severity: 'critical', message: 'Seven-day plan must have at least 5 days' });
  }

  // Posting schedule
  if (!data.posting_schedule?.primary_post_day) {
    issues.push({ field: 'posting_schedule', severity: 'warning', message: 'Posting schedule missing primary day' });
  }

  const errorCount   = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return { valid: errorCount === 0, critical: errorCount > 0, issues, errorCount, warningCount };
}

// ─── Sanitise ─────────────────────────────────────────────────────────────────
// Strip any accidentally leaked tokens, keys, or sensitive strings from output
export function sanitise(data) {
  const dangerous = [
    /AIza[0-9A-Za-z\-_]{35}/g,            // Google API keys
    /sk-[a-zA-Z0-9]{20,}/g,               // OpenAI keys
    /eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]*/g, // JWT tokens
    /service_role/gi,
    /anon\s+key/gi,
  ];

  const walk = (node) => {
    if (typeof node === 'string') {
      let cleaned = node;
      for (const pattern of dangerous) {
        cleaned = cleaned.replace(pattern, '[REDACTED]');
      }
      return cleaned;
    }
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(node)) out[k] = walk(v);
      return out;
    }
    return node;
  };

  return walk(data);
}