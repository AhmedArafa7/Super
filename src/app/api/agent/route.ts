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
    const { messages, preferredAI, autoFallback } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), { status: 400 });
    }

    let result;
    let engine = 'NexusAI';

    const provider = preferredAI === 'groq' ? groq : google;
    const modelName = preferredAI === 'groq' 
      ? 'llama-3.3-70b-versatile' 
      : 'gemini-1.5-flash';

    try {
      result = await generateText({
        model: provider(modelName),
        system: AGENT_SYSTEM_PROMPT,
        messages: messages.map(m => ({ 
          role: m.role === 'assistant' ? 'assistant' : 'user', 
          content: m.content 
        })),
        temperature: 0.3,
      });
      engine = preferredAI === 'groq' ? 'Groq' : 'Gemini';
    } catch (err: any) {
      console.warn('Primary model failed, checking fallback:', err.message);
      
      if (autoFallback && preferredAI !== 'groq' && process.env.GROQ_API_KEY) {
        result = await generateText({
          model: groq('llama-3.3-70b-versatile'),
          system: AGENT_SYSTEM_PROMPT,
          messages: messages.map(m => ({ 
            role: m.role === 'assistant' ? 'assistant' : 'user', 
            content: m.content 
          })),
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
