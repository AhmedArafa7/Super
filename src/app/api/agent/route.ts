import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

/**
 * [STABILITY_ANCHOR: NEURAL_ARCHITECT_API_V5.0_STREAMING]
 * المهندس العصبي - مع دعم الـ Streaming الحقيقي.
 * تم الترقية من generateText → streamText لإلغاء التجميد أثناء المعالجة.
 * البروتوكول: يبث النص كـ text/event-stream، والعميل يجمعه ثم يحلل JSON.
 */

const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const google = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY });
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

const AGENT_SYSTEM_PROMPT = `[STRICT_RESPONSE_FORMAT: JSON_ONLY]
[NEURAL_IDENTITY: THE_ARCHITECT]
You are the "Neural Architect", a high-end AI developer orchestrator.

[ACTION_PROTOCOL]
1. PRE-ANALYSIS: Before answering, scan the "Project Structure (Files)" to identify the MOST RELEVANT files.
   - Changing site name: Look for "package.json", "index.html", "layout.tsx", "metadata" files.
   - Changing colors: Look for "globals.css", "tailwind.config.js", theme files.
2. If a screenshot is provided, analyze it deeply for UI/UX context.
3. [DEEP_CODE_ACCESS - STRICT RULES]:
   - If you need a file NOT in [CORE_PROJECT_FILES_CONTENT], add its EXACT path to "requestedFiles".
   - ⚠️ CRITICAL: Use the EXACT path from the "Project Structure (Files)" list ONLY.
4. If you have enough info in [CORE_PROJECT_FILES_CONTENT], proceed with the "files" array.
5. Your response must ALWAYS be a clean JSON object with:
   - "explanation": Your reasoning in Arabic.
   - "files": Array of [NEW], [MODIFY], or [DELETE] operations.
   - "requestedFiles": Array of VERIFIED file paths to read (if you need more context).
   - "engine": "The Architect".
6. Do NOT include any text outside the JSON. Start directly with {`;

export async function POST(req: Request) {
  try {
    const {
      messages, preferredAI, autoFallback, imageDataUri,
      linkedRepo, repoTree, coreFileContents
    } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const previousMessages = messages.slice(0, -1);

    // تشكيل الرسائل مع دعم الصورة للمهمة الأخيرة
    const processedMessages = [
      ...previousMessages,
      {
        role: 'user' as const,
        content: imageDataUri
          ? [
              { type: 'text' as const, text: lastMessage.content || "حلل هذه الصورة برمجياً" },
              {
                type: 'image' as const,
                image: new Uint8Array(atob(imageDataUri.split(',')[1]).split('').map((c: string) => c.charCodeAt(0))),
                mimeType: imageDataUri.split(';')[0].split(':')[1]
              }
            ]
          : lastMessage.content
      }
    ];

    // سياق المستودع المرتبط
    const repoContext = linkedRepo
      ? `\n\n[CONTEXT: GITHUB REPOSITORY LINKED]
Repo: "${linkedRepo.full_name}"
Description: ${linkedRepo.description || "No description provided"}
Default Branch: ${linkedRepo.default_branch}
Project Structure (Files): ${Array.isArray(repoTree) ? repoTree.join(', ') : 'Loading...'}`
      : '\n\n[CONTEXT: NO REPOSITORY LINKED]\nAdvise the user to link a GitHub repo via the GitHub Engine if they want file-level operations.';

    const coreFilesPrompt = coreFileContents && Object.keys(coreFileContents).length > 0
      ? `\n\n[CORE_PROJECT_FILES_CONTENT]\nYou have immediate access to these critical files:\n${Object.entries(coreFileContents).map(([p, c]) => `--- FILE: ${p} ---\n${c}`).join('\n\n')}`
      : "";

    const systemPrompt = AGENT_SYSTEM_PROMPT + repoContext + coreFilesPrompt;

    // ─── محاولة Streaming مع نظام Fallback ────────────────────────────────
    async function buildStream(modelProvider: any) {
      return streamText({
        model: modelProvider,
        system: systemPrompt,
        messages: processedMessages,
        temperature: 0.3,
      });
    }

    let streamResult;
    try {
      const modelId = preferredAI === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-2.5-flash';
      const provider = preferredAI === 'groq' ? groq(modelId) : google(modelId);
      streamResult = await buildStream(provider);
    } catch (primaryErr: any) {
      console.warn('[Neural Architect] Primary model failed, falling back to Groq:', primaryErr.message);

      if (autoFallback && preferredAI !== 'groq' && process.env.GROQ_API_KEY) {
        streamResult = await buildStream(groq('llama-3.3-70b-versatile'));
      } else {
        throw primaryErr;
      }
    }

    // إرسال الـ Stream مباشرةً كـ text/event-stream
    return streamResult.toTextStreamResponse();

  } catch (err: any) {
    console.error('[Neural Architect API Error]', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Neural Architect construction failed',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
