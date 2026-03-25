import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'edge';

/**
 * [STABILITY_ANCHOR: NEURAL_ARCHITECT_API_V4.0]
 * المهندس العصبي - النسخة الاحترافية الكاملة باستخدام AI SDK.
 * يستخدم generateText لضمان الاستقرار في بيئة Edge وتفادي مشاكل الـ Streaming.
 */

const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const google = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
});

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

const AGENT_SYSTEM_PROMPT = `أنت "المهندس العصبي" (Neural Architect) في نظام NexusAI. بيئة بناء سيادية متطورة.
مهمتك الأساسية هي بناء وتعديل الأكواد البرمجية والملفات في بيئة عمل المستخدم.

قانون الرد الصارم:
يجب أن يكون ردك دائماً بصيغة JSON نظيفة تحتوي على الحقول التالية:
{
  "explanation": "شرح عربي تقني لما قمت به",
  "files": [
    {"path": "مسار/الملف", "content": "محتوى الملف", "language": "اللغة"}
  ]
}

إذا كان الطلب استفساراً فقط، اترك مصفوفة الملفات فارغة.
لا تضع أي نصوص خارج الـ JSON.`;

export async function POST(req: Request) {
  try {
    const { messages, preferredAI, autoFallback, imageDataUri, linkedRepo, repoTree } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), { status: 400 });
    }

    let result;
    let engine = 'NexusAI';

    const provider = preferredAI === 'groq' ? groq : google;
    const modelName = preferredAI === 'groq' 
      ? 'llama-3.3-70b-versatile' 
      : 'gemini-2.5-flash';

    const lastMessage = messages[messages.length - 1];
    const previousMessages = messages.slice(0, -1).map(m => ({ 
      role: m.role === 'assistant' ? 'assistant' : 'user' as any, 
      content: m.content 
    }));

    // تشكيل الرسائل مع دعم الصورة للمهمة الأخيرة
    const processedMessages = [
      ...previousMessages,
      {
        role: 'user' as any,
        content: imageDataUri 
          ? [
              { type: 'text', text: lastMessage.content || "حلل هذه الصورة برمجياً" },
              { 
                type: 'image', 
                image: new Uint8Array(atob(imageDataUri.split(',')[1]).split('').map(c => c.charCodeAt(0))),
                mimeType: imageDataUri.split(';')[0].split(':')[1]
              }
            ]
          : lastMessage.content
      }
    ];

    // سياق المستودع المرتبط (إن وجد)
    const repoContext = linkedRepo 
      ? `\n\n[CONTEXT: GITHUB REPOSITORY LINKED]
Repo: "${linkedRepo.full_name}"
Description: ${linkedRepo.description || "No description provided"}
Default Branch: ${linkedRepo.default_branch}
Project Structure (Files): ${Array.isArray(repoTree) ? repoTree.join(', ') : 'Loading...'}
You are now "inside" this repository. Use this structure to evaluate the project or answer questions about it.`
      : '\n\n[CONTEXT: NO REPOSITORY LINKED]\nAdvise the user to use the GitHub Engine if they want you to work on their remote projects.';

    const systemPrompt = `[STRICT_RESPONSE_FORMAT: JSON_ONLY]
[NEURAL_IDENTITY: THE_ARCHITECT]
You are the "Neural Architect", a high-end AI developer orchestrator.
${repoContext}

[ACTION_PROTOCOL]
1. If the user provides a screenshot, analyze it deeply. If it shows code, a UI, or the NexusAI interface itself, provide specific feedback based on what you see combined with the [CONTEXT] above.
2. If the user asks about their "linked project", refer specifically to its files and structure provided in the context.
3. [DEEP_CODE_ACCESS]: If you need to analyze the actual source code within a file (e.g. for debugging, refactoring, or evaluation), include a "requestedFiles" array in your JSON response with the EXACT paths to the files you want to read. The system will provide their content in the next turn.
4. You must return only a valid JSON object.
5. Your primary task is to build and modify code and files in the user's environment.
6. Your response must always be a clean JSON object with the following fields:
   - explanation: your reasoning or response in Arabic.
   - files: an array of [NEW], [MODIFY], or [DELETE] operations (only if you are making changes).
   - requestedFiles: (Optional) Array of file paths you want to read to perform a deeper analysis.
   - engine: "The Architect".
7. If the request is only an inquiry, leave the 'files' array empty.
8. Do not include any text outside the JSON.`;

    try {
      result = await generateText({
        model: provider(modelName),
        system: systemPrompt,
        messages: processedMessages,
        temperature: 0.3,
      });
      engine = preferredAI === 'groq' ? 'Groq' : 'Gemini';
    } catch (err: any) {
      console.warn('Primary model failed, checking fallback:', err.message);
      
      if (autoFallback && preferredAI !== 'groq' && process.env.GROQ_API_KEY) {
        result = await generateText({
          model: groq('llama-3.3-70b-versatile'),
          system: systemPrompt,
          messages: processedMessages,
        });
        engine = 'Groq (Auto-Fallback)';
      } else {
        throw err;
      }
    }

    // تنظيف وتحليل الرد
    const rawText = result.text;
    let explanation = rawText;
    let files: any[] = [];

    try {
      const cleanJson = rawText.replace(/^```json\n?|^```\n?|\n?```$/gm, '').trim();
      const parsed = JSON.parse(cleanJson);
      explanation = parsed.explanation || parsed.text || rawText;
      files = Array.isArray(parsed.files) ? parsed.files : [];
    } catch {
      // إذا لم يلتزم بالـ JSON، نعامله كـ متن عادي
    }

    return new Response(JSON.stringify({ 
      success: true, 
      explanation, 
      files, 
      engine 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[Neural Architect API Error]', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Neural Architect construction failed',
      diagnostics: err.stack
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
