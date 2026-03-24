import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, convertToModelMessages } from 'ai';
import { z } from 'zod';

export const runtime = 'edge';
export const maxDuration = 60;

// Resilience for API keys (Matched with generate/route.ts)
const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_DRIVE_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// نظام الـ Neural Cache لتذكر الموديل المستقر وتجنب المحاولات الفاشلة المكررة
let currentStableModel: string | null = null;
let blacklistedModels = new Set<string>();

const googleProvider = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
});

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, preferredAI, autoFallback } = await req.json();

    if (!GEMINI_API_KEY && preferredAI !== 'groq') {
      return new Response(JSON.stringify({
        error: 'Neural Key Missing',
        diagnostics: 'مفتاح Gemini غير متوفر في إعدادات السيرفر.'
      }), { status: 500 });
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), { status: 400 });
    }

    const systemPrompt = `أنت "المهندس العصبي" (Neural Architect) في نظام NexusAI. بيئة بناء سيادية.
مهمتك مساعدة المستخدم في كتابة وتعديل الأكواد البرمجية. يجب عليك الرد باللغة العربية بأسلوب احترافي جداً وتقني.
عندما يطلب منك المستخدم كتابة سكربت أو بناء واجهة أو تعديل ملفات معينة، يجب عليك استدعاء الأداة \`update_workspace_files\` وتمرير مسارات الملفات ومحتواها. 
إذا كان السؤال نظرياً أو لا يتطلب كتابة أكواد فعلية في بيئة العمل، فقط أجب نصياً.
تذكر دائماً أنك تمتلك القدرة على تعديل بيئة عمل المستخدم (Workspace) بشكل مباشر والتغييرات ستنعكس لحظياً أمامه.`;

    const tools = {
      update_workspace_files: tool({
        description: 'استخدم هذه الأداة لإنشاء أو تعديل أي ملف برمجي في بيئة عمل المستخدم.',
        inputSchema: z.object({
          files: z.array(z.object({
            path: z.string(),
            content: z.string(),
            language: z.string()
          })),
          explanation: z.string()
        }),
        execute: async (args) => ({ success: true, filesUpdated: args.files.length })
      })
    };

    // قائمة الموديلات المقترحة للـ Gemini - تم استخدام الأولوية الأكثر استقراراً لـ v1beta
    const geminiModels = [
      'gemini-2.5-flash-latest',
      'gemini-2.5-flash',
      'gemini-2.5-flash',
      'gemini-1.5-pro'
    ];

    async function getResult(modelToUse: any) {
      // Normalize messages
      const normalizedMessages = messages.map((m: any) => ({
        ...m,
        parts: m.parts || [{ type: 'text', text: m.content || m.text || '' }]
      }));

      return streamText({
        model: modelToUse,
        messages: await convertToModelMessages(normalizedMessages),
        system: systemPrompt,
        tools,
      });
    }

    // التنفيذ باستخدام Neural Resilience
    if (preferredAI === 'groq') {
      const result = await getResult(groq('llama-3.3-70b-versatile'));
      return result.toUIMessageStreamResponse();
    }

    // بناء قائمة المحاولات: نبدأ بالموديل الذي نجح آخر مرة، ثم الباقي (باستثناء القائمة السوداء)
    const candidates = [
      ...(currentStableModel && !blacklistedModels.has(currentStableModel) ? [currentStableModel] : []),
      ...geminiModels.filter(m => m !== currentStableModel && !blacklistedModels.has(m))
    ];

    // محاولة تشغيل Gemini مع نظام تعافي تلقائي
    let lastError = null;
    for (const modelId of candidates) {
      try {
        console.log(`Neural Architect: Pre-flight check for ${modelId}`);

        // فحص استباقي لوجود الموديل قبل بدء الستريم
        // تصحيح: إزالة models/ من الاسم قبل وضعه في رابط الفحص لتجنب التكرار
        const cleanModelId = modelId.replace('models/', '');
        const checkUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelId}?key=${GEMINI_API_KEY}`;
        const checkRes = await fetch(checkUrl);

        if (!checkRes.ok) {
          const errorData = await checkRes.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'not found');
        }

        const result = await getResult(googleProvider(modelId));

        // إذا وصلنا لهنا، الموديل موجود ومستعد
        currentStableModel = modelId;
        return result.toUIMessageStreamResponse();
      } catch (error: any) {
        lastError = error;
        const isModelAvailabilityError = error.message?.toLowerCase().includes('not found') ||
          error.message?.toLowerCase().includes('not supported') ||
          error.message?.toLowerCase().includes('method not allowed');
        const isQuotaError = error.message?.includes('quota') || error.status === 429;

        if (isModelAvailabilityError) {
          console.warn(`Neural Architect: ${modelId} is unavailable. Blacklisting and trying next...`);
          blacklistedModels.add(modelId);
          if (currentStableModel === modelId) currentStableModel = null;
          continue;
        }

        if (isQuotaError && autoFallback) {
          console.warn('Neural Architect: Gemini quota hit, auto-falling back to Groq');
          const fallbackResult = await getResult(groq('llama-3.3-70b-versatile'));
          return fallbackResult.toUIMessageStreamResponse();
        }

        throw error;
      }
    }

    // إذا وصلنا لهنا، فكل محاولات Gemini فشلت
    if (autoFallback) {
      console.warn('Neural Architect: All Gemini models failed, final fallback to Groq');
      const finalResult = await getResult(groq('llama-3.3-70b-versatile'));
      return finalResult.toUIMessageStreamResponse();
    }

    throw lastError || new Error('All AI engines are currently unavailable');

  } catch (error: any) {
    console.error('Agent API Error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      diagnostics: 'اضطراب في الشبكة العصبية. يرجى مراجعة مفاتيح الربط.'
    }), { status: 500 });
  }
}
