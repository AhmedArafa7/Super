'use server';
/**
 * @fileOverview [STABILITY_ANCHOR: NEURAL_ENGINE_V7.5]
 * المحرك العصبي المطور - تم تحسين رسائل الخطأ لتشمل خطوات الحل البرمجي.
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

export async function aiChatGenerateResponse(input: z.infer<typeof AIChatGenerateResponseInputSchema>) {
  try {
    const result = await aiChatGenerateResponseFlow(input);
    return { success: true, ...result };
  } catch (err: any) {
    console.error("Critical Neural Failure:", err);
    
    const errorMsg = err.message || "";
    
    // تشخيص دقيق لخطأ المفتاح والـ API
    if (errorMsg.includes('Generative Language API') || errorMsg.includes('403') || errorMsg.includes('permission')) {
      return { 
        success: false, 
        error: true, 
        message: `خطأ في الهوية (403): الـ API مفعل ولكن المفتاح المستخدم لا يتبع لهذا المشروع.
الخطوات للحل:
1. اذهب لتبويب Credentials في هذا الرابط: https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}
2. اضغط Create Credentials ثم API Key.
3. انسخ المفتاح الجديد وضعه في ملف .env` 
      };
    }

    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
      return { 
        success: false, 
        error: true, 
        message: "لقد تجاوزت حد الاستهلاك المسموح به حالياً. يرجى المحاولة بعد دقيقة واحدة." 
      };
    }

    return { 
      success: false, 
      error: true, 
      message: "حدث اضطراب في الاتصال بالنخاع العصبي. تأكد من صحة الـ API Key الجديد في ملف الإعدادات." 
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
    let modelToUse = input.isAutoMode ? 'googleai/gemini-1.5-flash' : (input.manualModel || 'googleai/gemini-1.5-flash');
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
  }
);