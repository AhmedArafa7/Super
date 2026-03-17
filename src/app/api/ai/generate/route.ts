import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const runtime = 'edge';

const PROJECT_ID = "studio-3522991053-84d29";

const optimizePrompt = ai.definePrompt({
  name: 'optimizePromptAPI',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: z.object({ message: z.string() }) },
  prompt: `أنت مُحسن أوامر (Prompt Optimizer) لنظام NexusAI.
مهمتك: تحويل طلب المستخدم إلى أمر دقيق للذكاء الاصطناعي.
القواعد الصارمة:
1. إذا كانت الرسالة مجرد تحية، أعدها كما هي.
2. لا تضف أي شرح أو مقدمات مثل "سأقوم بتحسين رسالتك".
3. المخرجات هي النص المحسن فقط بالعربية.

رسالة المستخدم: {{{message}}}
النص المحسن:`,
});

const responsePrompt = ai.definePrompt({
  name: 'aiChatGenerateResponsePromptAPI',
  model: 'googleai/gemini-1.5-flash',
  input: {
    schema: z.object({
      message: z.string(),
      imageDataUri: z.string().optional(),
      history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).optional()
    })
  },
  prompt: `أنت مساعد NexusAI المتقدم. أجب بالعربية الفصحى وبأسلوب مستقبلي.

{{#if imageDataUri}}لقد أرفق المستخدم صورة: {{media url=imageDataUri}}{{/if}}

سياق الدردشة:
{{#each history}}
  {{role}}: {{{content}}}
{{/each}}

الرسالة: {{{message}}}
الرد الحكيم:`,
});

function checkNeuralEnvironment() {
  return {
    hasGoogleKey: !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_DRIVE_API_KEY),
    hasGroqKey: !!(process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY),
    runtime: typeof (globalThis as any).EdgeRuntime !== 'undefined' ? 'edge' : 'nodejs',
    nodeVersion: process.version,
    envKeys: Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('API')).map(k => k.replace(/./g, (c, i) => i < 3 ? c : '*'))
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, imageDataUri, isAutoMode, manualModel, history } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: true, message: "Message is required." }, { status: 400 });
    }

    let modelToUse = isAutoMode ? 'googleai/gemini-1.5-flash' : (manualModel || 'googleai/gemini-1.5-flash');
    if (modelToUse.includes('flash-latest')) modelToUse = 'googleai/gemini-1.5-flash';

    let finalPrompt = message;
    let optimizedText = null;

    if (isAutoMode) {
      try {
        const { text: optimized } = await optimizePrompt({ message });
        if (optimized && optimized.trim() !== message.trim()) {
          finalPrompt = optimized;
          optimizedText = optimized;
        }
      } catch (e) {
        console.warn("Prompt optimization failed.");
      }
    }

    const { text: responseText } = await responsePrompt({
      message: finalPrompt,
      imageDataUri,
      history: history?.filter((h: any) => !!h.content)
    }, { model: modelToUse as any });

    let engineName = "NexusAI";
    if (modelToUse.includes('gemini-1.5-pro')) engineName = "Gemini Pro";
    else if (modelToUse.includes('llama-3.3')) engineName = "Llama 3.3 70B";
    else if (modelToUse.includes('groq/')) engineName = "Groq Engine";

    return NextResponse.json({
      success: true,
      response: responseText || "تمت المعالجة عصبياً.",
      engine: engineName,
      optimizedText,
      selectedModel: modelToUse
    });

  } catch (err: any) {
    console.error("Critical Neural API Failure:", err);
    const errorMsg = err.message || "Unknown error";
    const envState = checkNeuralEnvironment();

    return NextResponse.json({
      success: false,
      error: true,
      message: `حدث اضطراب في الاتصال العصبى: ${errorMsg.substring(0, 100)}`,
      diagnostics: {
        error: errorMsg,
        stack: err.stack?.substring(0, 200),
        envState
      }
    }, { status: 500 });
  }
}
