
'use server';
/**
 * @fileOverview [STABILITY_ANCHOR: NEURAL_ENGINE_V7.7]
 * المحرك العصبي المطور - تم تحسين تشخيص الأخطاء لدعم المفتاح الجديد وتوضيح خطوات التفعيل.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PROJECT_ID = "studio-3522991053-84d29";

const optimizePrompt = ai.definePrompt({
  name: 'optimizePrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: z.object({ message: z.string() })},
  prompt: `أنت مُحسن أوامر (Prompt Optimizer) لنظام NexusAI.
مهمتك: تحويل طلب المستخدم إلى أمر دقيق للذكاء الاصطناعي.
القواعد الصارمة:
1. إذا كانت الرسالة مجرد تحية، أعدها كما هي.
2. لا تضف أي شرح أو مقدمات مثل "سأقوم بتحسين رسالتك".
3. المخرجات هي النص المحسن فقط بالعربية.

رسالة المستخدم: {{{message}}}
النص المحسن:`,
});

const AIChatGenerateResponseInputSchema = z.object({
  message: z.string(),
  imageDataUri: z.string().optional(),
  isAutoMode: z.boolean().default(true),
  manualModel: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
});

// تتبع حالة البيئة (Telemetry)
function checkNeuralEnvironment() {
  return {
    hasGoogleKey: !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_DRIVE_API_KEY),
    hasGroqKey: !!(process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY),
    runtime: typeof (globalThis as any).EdgeRuntime !== 'undefined' ? 'edge' : 'nodejs',
    nodeVersion: process.version,
    envKeys: Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('API')).map(k => k.replace(/./g, (c, i) => i < 3 ? c : '*'))
  };
}

export async function aiChatGenerateResponse(input: z.infer<typeof AIChatGenerateResponseInputSchema>) {
  try {
    const result = await aiChatGenerateResponseFlow(input);
    return { success: true, ...result };
  } catch (err: any) {
    console.error("Critical Neural Failure:", err);
    
    const errorMsg = err.message || "";
    
    // تشخيص دقيق لخطأ الهوية والـ API
    if (errorMsg.includes('Generative Language API') || errorMsg.includes('403') || errorMsg.includes('permission') || errorMsg.includes('API_KEY_INVALID')) {
      return { 
        success: false, 
        error: true, 
        message: `خطأ في المزامنة (403): يبدو أن النظام يحتاج لإعادة تحميل الإعدادات أو أن المفتاح الجديد لم يتفعل بعد.
الخطوات للحل:
1. تأكد من أنك قمت بنسخ المفتاح بالكامل بدون مسافات.
2. انتظر دقيقة واحدة حتى تعمم جوجل المفتاح في خوادمها.
3. إذا استمر الخطأ، اذهب هنا: https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID} وتأكد أن المفتاح فعال.` 
      };
    }

    if (errorMsg.includes('Failed to fetch')) {
      return {
        success: false,
        error: true,
        message: "خطأ في الاتصال (Failed to fetch): يبدو أن هناك جدار حماية يمنع الاتصال بخوادم جوجل، أو أن المفتاح الجديد لم يتم قراءته بعد. يرجى تجربة تحديث الصفحة وإعادة المحاولة."
      };
    }

    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
      return { 
        success: false, 
        error: true, 
        message: "لقد تجاوزت حد الاستهلاك المسموح به حالياً. يرجى المحاولة بعد دقيقة واحدة." 
      };
    }

    const envState = checkNeuralEnvironment();
    return { 
      success: false, 
      error: true, 
      message: `حدث اضطراب في الاتصال العصبى: ${errorMsg.substring(0, 100)}`,
      diagnostics: {
        error: errorMsg,
        stack: err.stack?.substring(0, 200),
        envState
      }
    };
  }
}

const responsePrompt = ai.definePrompt({
  name: 'aiChatGenerateResponsePrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: z.object({ 
    message: z.string(),
    imageDataUri: z.string().optional(),
    history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).optional()
  })},
  prompt: `أنت مساعد NexusAI المتقدم. أجب بالعربية الفصحى وبأسلوب مستقبلي.

{{#if imageDataUri}}لقد أرفق المستخدم صورة: {{media url=imageDataUri}}{{/if}}

سياق الدردشة:
{{#each history}}
  {{role}}: {{{content}}}
{{/each}}

الرسالة: {{{message}}}
الرد الحكيم:`,
});

const aiChatGenerateResponseFlow = ai.defineFlow(
  {
    name: 'aiChatGenerateResponseFlow',
    inputSchema: AIChatGenerateResponseInputSchema,
  },
  async input => {
    try {
      let modelToUse = input.isAutoMode ? 'googleai/gemini-1.5-flash' : (input.manualModel || 'googleai/gemini-1.5-flash');
      
      // تصحيح الموديلات القديمة أو غير الصالحة
      if (modelToUse.includes('flash-latest')) modelToUse = 'googleai/gemini-1.5-flash';
    let finalPrompt = input.message;
    let optimizedText = null;

    if (input.isAutoMode) {
      try {
        const { text: optimized } = await optimizePrompt({ message: input.message });
        if (optimized && optimized.trim() !== input.message.trim()) {
          finalPrompt = optimized;
          optimizedText = optimized;
        }
      } catch (e) {
        console.warn("Prompt optimization failed, falling back to original message.");
      }
    }
    
    const { text: responseText } = await responsePrompt({ 
      message: finalPrompt, 
      imageDataUri: input.imageDataUri,
      history: input.history?.filter(h => !!h.content) 
    }, { model: modelToUse as any });
    
    let engineName = "NexusAI";
    if (modelToUse.includes('gemini-1.5-pro')) engineName = "Gemini Pro";
    else if (modelToUse.includes('llama-3.3')) engineName = "Llama 3.3 70B";
    else if (modelToUse.includes('groq/')) engineName = "Groq Engine";

      return {
        response: responseText || "تمت المعالجة عصبياً.",
        engine: engineName,
        optimizedText: optimizedText,
        selectedModel: modelToUse
      };
    } catch (innerErr: any) {
      console.error("Neural Flow Error:", innerErr);
      throw new Error(innerErr.message || "فشل محرك المعالجة الداخلية.");
    }
  }
);
