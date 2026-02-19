
'use server';
/**
 * @fileOverview [STABILITY_ANCHOR: NEURAL_ENGINE_V5.5]
 * المحرك العصبي المطور - يدعم الشفافية السيادية والتصنيفات الجديدة.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const VAULT_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

const optimizePrompt = ai.definePrompt({
  name: 'optimizePrompt',
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
  return aiChatGenerateResponseFlow(input);
}

const responsePrompt = ai.definePrompt({
  name: 'aiChatGenerateResponsePrompt',
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
    try {
      let modelToUse = input.isAutoMode ? 'googleai/gemini-1.5-flash' : (input.manualModel || 'googleai/gemini-1.5-flash');
      let finalPrompt = input.message;
      let optimizedText = null;

      if (input.isAutoMode) {
        const { text: optimized } = await optimizePrompt({ message: input.message });
        if (optimized && optimized.trim() !== input.message.trim()) {
          finalPrompt = optimized;
          optimizedText = optimized;
        }
      }
      
      const { text: responseText } = await responsePrompt({ 
        message: finalPrompt, 
        imageDataUri: input.imageDataUri,
        history: input.history 
      }, { model: modelToUse as any });
      
      // [STABILITY_ANCHOR: SOVEREIGN_NAMING_CONVENTION]
      let engineName = "NexusAI";
      if (modelToUse.includes('gemini-1.5-pro')) engineName = "Gemini Pro";
      else if (modelToUse.includes('llama-3.3')) engineName = "Llama 3.3 70B";

      return {
        response: responseText || "تمت المعالجة عصبياً.",
        engine: engineName,
        optimizedText: optimizedText,
        selectedModel: modelToUse
      };
    } catch (err) {
      throw new Error("حدث اضطراب في المزامنة العصبية: " + (err as Error).message);
    }
  }
);
