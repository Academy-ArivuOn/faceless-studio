import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// ─── Client ───────────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Safety Settings ──────────────────────────────────────────────────────────
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ─── Temperature Map ──────────────────────────────────────────────────────────
export const TEMPERATURES = {
  research:     0.72,
  creator:      0.85,   // slightly lower than 0.88 — reduces hallucination on long outputs
  publisher:    0.62,
  hookUpgrade:  0.95,
  titleBattle:  0.85,
  trendSpy:     0.70,
  commentReply: 0.90,
  localise:     0.78,
};

// ─── Max token ceilings per agent ─────────────────────────────────────────────
// Gemini 1.5 Flash supports up to 8192 output tokens.
// Creator needs the most — full script + scenes + metadata easily hits 5000-7000 tokens.
export const MAX_TOKENS = {
  research:  2000,
  creator:   7500,   // ← was 3500, that caused the truncation. 7500 gives ample headroom.
  publisher: 3000,
  default:   2000,
};

// ─── Master System Prompt ─────────────────────────────────────────────────────
export const MASTER_SYSTEM_PROMPT = `
You are a world-class content strategist with 15 years of experience building viral channels
from zero across YouTube, Instagram Reels, TikTok, Podcasts, and Blogs. You have personally
grown channels past 1 million subscribers, managed $2M+ in brand deals, deeply studied platform
algorithms, and helped hundreds of creators — faceless channels, personal brands, educators,
coaches, agencies, and podcasters — build sustainable content businesses.

Your outputs go DIRECTLY to creators without any editing. Every word must be production-ready.

═══════════════════════════════════════════════════════════
THINKING FRAMEWORK — Execute this mentally before every output:
═══════════════════════════════════════════════════════════

1. LOSS AVERSION CHECK
   Ask: What does the viewer risk LOSING by scrolling past? Frame the content around that loss.
   Example: Not "How to save money" → "The 3 ways you're bleeding money every month without realising"

2. INFORMATION GAP CHECK
   Ask: What question am I opening in the viewer's mind that demands an answer?
   The gap must be specific and urgent. Vague gaps get skipped.

3. PATTERN INTERRUPT CHECK
   Ask: In a feed of 50 similar videos, what makes THIS one stop the scroll in 0.5 seconds?
   Could be: unexpected angle, counterintuitive claim, shocking number, visual contrast.

4. IDENTITY TRIGGER CHECK
   Ask: What belief, identity, or self-image does this viewer hold that this content validates,
   challenges, or evolves? Connect to that identity in the hook.

═══════════════════════════════════════════════════════════
OUTPUT QUALITY RULES — Non-negotiable:
═══════════════════════════════════════════════════════════

SPECIFICITY: Always use concrete numbers over vague language.
  BAD: "Many viewers drop off early"
  GOOD: "43% of viewers leave before the 30-second mark if there's no second hook"

COMPLETENESS: Never truncate a script, caption, or description mid-way.
  If a script should be 800 words, write every word. Never write "continue here" or leave fields partial.
  JSON MUST be syntactically complete — every string closed, every object closed, every array closed.

SCRIPT AUTHENTICITY: Scripts must be word-for-word performable. Write exactly how a human
  would speak. Include natural rhythm and conversational connectors. No robotic structure.

═══════════════════════════════════════════════════════════
FORBIDDEN PHRASES — Never appear in any output:
═══════════════════════════════════════════════════════════

"As an AI", "I cannot", "I'm unable to", "Certainly!", "Absolutely!", "Of course!",
"Great question!", "I'd be happy to", "It's important to note", "Please note that",
"I hope this helps", "Feel free to", "In conclusion", "In summary", "To summarise",
"In today's digital age", "In the ever-evolving world of", "Game-changer",
"[Topic]", "[Your niche]", "[Insert here]", "[Add your]", "[Creator name]",
"[Channel name]", "(add link)", "(insert statistic)",
"In this video, I'm going to", "Welcome back to my channel", "Hey guys, welcome back",
"Today we're going to talk about", "So today I wanted to"

═══════════════════════════════════════════════════════════
JSON FORMAT RULES — Critical for parsing:
═══════════════════════════════════════════════════════════

- Your ENTIRE response must be valid, syntactically complete JSON
- Start with { and end with } — nothing before, nothing after
- Zero markdown: no \`\`\`json, no \`\`\`, no asterisks
- No trailing commas in arrays or objects
- All string values: use \\" for quotes inside strings
- Use null for optional fields with no value
- Numbers must be actual numbers: 1200 not "1200"
- MOST IMPORTANT: Complete every string before closing. Never cut off mid-sentence.
  If you are running low on space, end the current string cleanly and close all JSON structures.

═══════════════════════════════════════════════════════════
LANGUAGE HANDLING:
═══════════════════════════════════════════════════════════

HINDI: Natural Hinglish (55-65% Hindi, 35-45% English). Indian number system (₹, lakhs, crores).
TAMIL: Conversational Tamil with natural Tamil-English code-switching.
TELUGU: Telugu with Telugu-English mixing natural to Telugu YouTube culture.
KANNADA: Kannada with Kannada-English mixing natural to Bangalore creator culture.
MARATHI: Marathi with Marathi-English mixing.
ENGLISH: Clear international English. Avoid heavy regional slang unless audience is specified.
`.trim();

// ─── JSON Repair ──────────────────────────────────────────────────────────────
// When Gemini hits the token limit mid-output, it cuts the JSON off.
// This function attempts to recover a valid JSON object from a truncated string.
export function repairTruncatedJSON(raw) {
  let s = raw.trim();

  // Track parser state
  let inString  = false;
  let escape    = false;
  let braceDepth   = 0;
  let bracketDepth = 0;

  // Track the last position that was syntactically "safe" to cut at
  // (i.e. outside a string, after a complete value, before a trailing comma)
  let lastSafePos = 0;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (escape)              { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true;  continue; }

    if (ch === '"') {
      inString = !inString;
      // Just closed a string — this is a safe cut point
      if (!inString) lastSafePos = i + 1;
      continue;
    }

    if (inString) continue;

    // Outside strings — track structural depth
    if      (ch === '{') { braceDepth++;   }
    else if (ch === '}') { braceDepth--;   if (braceDepth === 0 && bracketDepth === 0) lastSafePos = i + 1; }
    else if (ch === '[') { bracketDepth++; }
    else if (ch === ']') { bracketDepth--; if (bracketDepth === 0) lastSafePos = i + 1; }
    else if ((ch === ',' || ch === ':') && !inString) {
      // After comma or colon outside strings — not a safe cut point
    } else if (ch !== ' ' && ch !== '\n' && ch !== '\r' && ch !== '\t') {
      // In the middle of an unquoted value (number, true, false, null)
    }
  }

  // If truncation happened inside a string, cut back to last safe position
  if (inString) {
    s = s.slice(0, lastSafePos).trimEnd();
  }

  // Remove any trailing comma before we close structures
  s = s.trimEnd().replace(/,\s*$/, '');

  // Close any open arrays, then open objects (reverse of opening order)
  if (bracketDepth > 0) s += ']'.repeat(Math.max(0, bracketDepth));
  if (braceDepth   > 0) s += '}'.repeat(Math.max(0, braceDepth));

  return s;
}

// ─── Core Call Function ───────────────────────────────────────────────────────
export async function callGemini({ prompt, agentType = 'research', maxTokens }) {
  const startMs = Date.now();
  const tokens  = maxTokens ?? MAX_TOKENS[agentType] ?? MAX_TOKENS.default;

  const model = genAI.getGenerativeModel({
    model: 'models/gemini-flash-lite-latest',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature:      TEMPERATURES[agentType] ?? 0.75,
      maxOutputTokens:  tokens,
      responseMimeType: 'application/json',
      topP:             0.92,
      topK:             40,
    },
  });

  const result    = await model.generateContent(prompt);
  const response  = result.response;

  if (!response) throw new Error('Gemini returned no response object');

  const candidate = response.candidates?.[0];
  if (!candidate) throw new Error('Gemini returned zero candidates — possible safety block');

  const finishReason = candidate.finishReason;

  if (finishReason === 'SAFETY')     throw new Error('Gemini blocked by safety filter — review prompt content');
  if (finishReason === 'RECITATION') throw new Error('Gemini blocked for recitation — rephrase the prompt');

  let raw = response.text();
  if (!raw || raw.trim() === '') throw new Error('Gemini returned empty text');

  // Strip markdown fences
  raw = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!raw.startsWith('{') && !raw.startsWith('[')) {
    throw new Error(`Gemini response is not JSON. First 120 chars: ${raw.slice(0, 120)}`);
  }

  // ── Attempt 1: Direct parse ────────────────────────────────────────────────
  try {
    const parsed = JSON.parse(raw);
    return { data: parsed, durationMs: Date.now() - startMs, repaired: false };
  } catch (parseError) {
    // Only attempt repair if this looks like a truncation (not a structural JSON error)
    const isTruncation = (
      finishReason === 'MAX_TOKENS' ||
      parseError.message.includes('Unterminated string') ||
      parseError.message.includes('Unexpected end') ||
      parseError.message.includes('Unexpected non-whitespace')
    );

    if (!isTruncation) {
      throw new Error(`Gemini JSON parse error: ${parseError.message}`);
    }

    console.warn(`[gemini:${agentType}] Output truncated (finishReason: ${finishReason}). Attempting JSON repair...`);

    // ── Attempt 2: Repair and parse ──────────────────────────────────────────
    try {
      const repaired = repairTruncatedJSON(raw);
      const parsed   = JSON.parse(repaired);
      console.warn(`[gemini:${agentType}] JSON repair succeeded. Recovered ${Object.keys(parsed).length} top-level keys.`);
      return { data: parsed, durationMs: Date.now() - startMs, repaired: true };
    } catch (repairError) {
      // Repair also failed — surface the original truncation error with context
      throw new Error(
        `Gemini output truncated and repair failed. ` +
        `finishReason: ${finishReason}, tokens: ${tokens}. ` +
        `Original: ${parseError.message}`
      );
    }
  }
}

// ─── Retry Wrapper ────────────────────────────────────────────────────────────
// Attempt 1: normal call (uses callGemini which already tries JSON repair internally)
// Attempt 2: only fires if attempt 1 throws. Uses max tokens + stricter prompt.
export async function callGeminiWithRetry({ prompt, agentType = 'research', maxTokens }) {
  const tokens = maxTokens ?? MAX_TOKENS[agentType] ?? MAX_TOKENS.default;

  try {
    return await callGemini({ prompt, agentType, maxTokens: tokens });
  } catch (firstError) {
    console.warn(`[gemini:${agentType}] Attempt 1 failed: ${firstError.message}. Retrying in 1.5s...`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For truncation errors, use absolute max tokens on retry
    const isTruncation = (
      firstError.message.includes('truncated') ||
      firstError.message.includes('Unterminated string') ||
      firstError.message.includes('Unexpected end') ||
      firstError.message.includes('MAX_TOKENS')
    );

    const retryTokens = isTruncation
      ? 8192                                    // absolute ceiling for truncation retries
      : Math.min(tokens + 1000, 8192);          // modest bump for other errors

    const strictPrefix = isTruncation
      ? `CRITICAL: Your previous response was cut off mid-JSON because it was too long.
This time you MUST complete the JSON within ${retryTokens} tokens.
Rules:
1. Complete every string value — never leave a string open.
2. End ALL arrays and objects properly.
3. If running low on space, shorten string values but keep the structure complete.
4. The final character of your response MUST be }.

Original task:\n\n`
      : `CRITICAL REMINDER: Respond with ONLY valid JSON. No markdown, no explanations.
Start with { and end with }. Your entire response must be parseable JSON.

Original task:\n\n`;

    try {
      return await callGemini({
        prompt:    strictPrefix + prompt,
        agentType,
        maxTokens: retryTokens,
      });
    } catch (retryError) {
      const combined = new Error(
        `Gemini failed after 2 attempts.\nAttempt 1: ${firstError.message}\nAttempt 2: ${retryError.message}`
      );
      combined.code = 'GEMINI_DOUBLE_FAIL';
      throw combined;
    }
  }
}