import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// ─── Client ───────────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Safety Settings ──────────────────────────────────────────────────────────
// BLOCK_ONLY_HIGH so content-strategy advice (e.g. "controversial hook") isn't blocked
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ─── Temperature Map ──────────────────────────────────────────────────────────
export const TEMPERATURES = {
  research:     0.72,   // focused trend analysis + angle selection
  creator:      0.88,   // creative freedom for script writing
  publisher:    0.62,   // precision required for SEO metadata
  hookUpgrade:  0.95,   // maximum creative variation for hook rewrites
  titleBattle:  0.85,   // varied title experiments with strategic thinking
  trendSpy:     0.70,   // factual trend detection, moderate creativity
  commentReply: 0.90,   // natural, human-sounding replies
  localise:     0.78,   // accurate translation with cultural nuance
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

PLATFORM INTELLIGENCE: Every recommendation must be tied to how that specific platform's
  algorithm, viewer behaviour, or format actually works — not generic advice.

COMPLETENESS: Never truncate a script, caption, or description mid-way.
  If a script should be 800 words, write 800 words. If a description is 220 words, write 220 words.
  Never write "continue script here" or leave any field partial.

SCRIPT AUTHENTICITY: Scripts must be word-for-word performable. Write exactly how a human
  would speak on camera or in voiceover. Include natural pauses, emphasis cues, conversational
  connectors. No robotic structure.

REASONING DISCIPLINE: Every strategic recommendation (upload time, hook choice, title) must
  come with a specific reason rooted in algorithm mechanics or viewer psychology. Not opinion.

═══════════════════════════════════════════════════════════
FORBIDDEN PHRASES — Never appear in any output:
═══════════════════════════════════════════════════════════

AI TELLS (instant quality fail):
"As an AI", "I cannot", "I'm unable to", "Certainly!", "Absolutely!", "Of course!",
"Great question!", "I'd be happy to", "It's important to note", "Please note that",
"I hope this helps", "Let me know if you need", "Feel free to", "This is just a suggestion",
"As mentioned above", "In conclusion", "In summary", "To summarise"

FILLER PHRASES:
"In today's digital age", "In the ever-evolving world of", "In this day and age",
"Leverage synergies", "Game-changer" (unless in script dialogue), "Revolutionary",
"Cutting-edge", "State-of-the-art", "Best practices"

PLACEHOLDER STRINGS (never leave these in output):
"[Topic]", "[Your niche]", "[Insert here]", "[Add your]", "[Creator name]",
"[Channel name]", "[Product name]", "(add link)", "(insert statistic)"

GENERIC HOOK OPENERS (these kill CTR):
"In this video, I'm going to", "Welcome back to my channel", "Hey guys, welcome back",
"Today we're going to talk about", "So today I wanted to", "Hi everyone"

═══════════════════════════════════════════════════════════
JSON FORMAT RULES — Critical for parsing:
═══════════════════════════════════════════════════════════

- Your ENTIRE response must be valid JSON
- Start with { and end with } — nothing before, nothing after
- Zero markdown: no \`\`\`json, no \`\`\`, no asterisks, no headers outside string values
- No trailing commas in arrays or objects
- All string values must have escaped quotes where needed: use \\" inside strings
- Use null (not "null", not "") for optional fields with no value
- Arrays must never be empty when the prompt asks for a minimum number of items
- Numbers must be actual numbers, not strings: 1200 not "1200"

═══════════════════════════════════════════════════════════
LANGUAGE HANDLING — Regional authenticity is non-negotiable:
═══════════════════════════════════════════════════════════

HINDI: Write in natural Hinglish (55-65% Hindi, 35-45% English). Use Indian number system
  (₹, lakhs, crores). Reference Indian platforms: PhonePe, Swiggy, Zepto, Meesho, Groww.
  Reference Indian cultural markers: Diwali, cricket, IPL, board exams, JEE, UPSC when relevant.
  Devanagari script unless creator requests Roman transliteration.

TAMIL: Write in conversational Tamil with natural Tamil-English code-switching.
  Use Tamil cultural references, kollywood when relevant, Chennai vs rest-of-TN dynamics.

TELUGU: Write in Telugu with Telugu-English mixing natural to Telugu YouTube culture.
  Reference Hyderabad, Telugu cinema, regional festivals naturally.

KANNADA: Write in Kannada with Kannada-English mixing natural to Bangalore creator culture.
  Reference Bengaluru startup culture, regional events, Kannada cinema when relevant.

MARATHI: Write in Marathi with Marathi-English mixing.
  Reference Mumbai, Pune, regional festivals, Marathi cultural identity.

ALL OTHER LANGUAGES: Write in that language natively with cultural authenticity.

ENGLISH DEFAULT: Use clear international English. Avoid heavy Americanisms unless
  the creator's audience is explicitly US-based.
`.trim();

// ─── Core Call Function ───────────────────────────────────────────────────────
export async function callGemini({ prompt, agentType = 'research', maxTokens = 2000 }) {
  const startMs = Date.now();

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: MASTER_SYSTEM_PROMPT,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature:      TEMPERATURES[agentType] ?? 0.75,
      maxOutputTokens:  maxTokens,
      responseMimeType: 'application/json',
      topP:             0.92,
      topK:             40,
    },
  });

  const result   = await model.generateContent(prompt);
  const response = result.response;

  if (!response) throw new Error('Gemini returned no response object');

  // Check for safety block or empty candidates
  const candidate = response.candidates?.[0];
  if (!candidate) throw new Error('Gemini returned zero candidates — possible safety block');

  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Gemini blocked by safety filter — review prompt content');
  }
  if (candidate.finishReason === 'RECITATION') {
    throw new Error('Gemini blocked for recitation — rephrase the prompt');
  }

  let raw = response.text();
  if (!raw || raw.trim() === '') throw new Error('Gemini returned empty text');

  // Strip any accidental markdown fences Gemini occasionally wraps around JSON
  raw = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Validate it looks like JSON before parsing
  if (!raw.startsWith('{') && !raw.startsWith('[')) {
    throw new Error(`Gemini response is not JSON. First 120 chars: ${raw.slice(0, 120)}`);
  }

  const parsed = JSON.parse(raw);
  const durationMs = Date.now() - startMs;

  return { data: parsed, durationMs };
}

// ─── Retry Wrapper ────────────────────────────────────────────────────────────
export async function callGeminiWithRetry({ prompt, agentType = 'research', maxTokens = 2000 }) {
  try {
    return await callGemini({ prompt, agentType, maxTokens });
  } catch (firstError) {
    // Wait 1.5s then retry with an enforcement prefix that re-asserts JSON rules
    await new Promise(resolve => setTimeout(resolve, 1500));

    const strictPrefix = `CRITICAL REMINDER: You MUST respond with ONLY valid JSON.
No text before {. No text after }. No markdown fences. No explanations.
Your entire response = one valid JSON object, nothing else.

Original task:\n\n`;

    try {
      return await callGemini({
        prompt:    strictPrefix + prompt,
        agentType,
        maxTokens: Math.min(maxTokens + 500, 8192), // allow slightly more tokens on retry
      });
    } catch (retryError) {
      // Surface the retry error but tag it so callers know both attempts failed
      const combined = new Error(
        `Gemini failed after 2 attempts.\nAttempt 1: ${firstError.message}\nAttempt 2: ${retryError.message}`
      );
      combined.code = 'GEMINI_DOUBLE_FAIL';
      throw combined;
    }
  }
}