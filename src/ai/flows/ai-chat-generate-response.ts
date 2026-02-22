
'use server';
/**
 * @fileOverview [STABILITY_ANCHOR: NEURAL_ENGINE_V6.9]
 * المحرك العصبي المطور - تم تحسين معالجة أخطاء الصلاحيات والحصص (API Enablement).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VAULT_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

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
    
    // تشخيص خطأ تفعيل الـ API
    if (err.message?.includes('Generative Language API') || err.message?.includes('403')) {
      return { 
        success: false, 
        error: true, 
        message: "يجب تفعيل 'Generative Language API' في Google Cloud Console لهذا المشروع لكي يعمل الذكاء الاصطناعي. يرجى مراجعة الأدمن." 
      };
    }

    // تشخيص خطأ الحصص (Quota)
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return { 
        success: false, 
        error: true, 
        message: "لقد تجاوزت حد الاستهلاك المسموح به حالياً. يرجى المحاولة بعد دقيقة واحدة." 
      };
    }

    return { 
      success: false, 
      error: true, 
      message: "حدث اضطراب في النخاع العصبي. يرجى التأكد من اتصالك بالشبكة السيادية." 
    };
  }
}

const responsePrompt = ai.definePrompt({
  name: 'aiChatGenerateResponsePrompt',
  model: 'googleai/gemini-1.5-flash', // الموديل الافتراضي
  input: {schema: z.object({ 
    message: z.string(),
    imageDataUri: z.string().optional(),
    history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).optional()
  })},
  prompt: `أنت مساعد NexusAI المتقدم. أجب بالعربية الفصحى وبأسلوب مستقبلي.
لدينا خزنة Nexus Vault للملفات: ${VAULT_URL}.

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
