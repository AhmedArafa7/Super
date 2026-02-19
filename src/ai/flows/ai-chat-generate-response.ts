
'use server';
/**
 * @fileOverview [STABILITY_ANCHOR: NEURAL_ENGINE_V5.5]
 * المحرك العصبي المتطور - يدعم الرؤية، الأدوات، التحسين الصامت، وتكامل Nexus Vault.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const VAULT_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

// [STABILITY_ANCHOR: SILENT_OPTIMIZER_LOGIC]
// هذا القطاع مسؤول عن تحسين الطلبات تقنياً دون إضافة مقدمات شرح.
const optimizePrompt = ai.definePrompt({
  name: 'optimizePrompt',
  input: {schema: z.object({ message: z.string() })},
  prompt: `أنت مُحسن أوامر (Prompt Optimizer) محترف لنظام NexusAI. 
مهمتك: تحويل طلب المستخدم التقني إلى أمر مفصل ودقيق للذكاء الاصطناعي لضمان أفضل إجابة.

القواعد الصارمة:
1. إذا كانت الرسالة مجرد تحية (مثل: سلام، أهلا، مرحباً)، أعدها كما هي تماماً دون أي تغيير.
2. إذا كان هناك سؤال أو طلب تقني، قم بإعادة صياغته بأسلوب هندسة الأوامر (Prompt Engineering).
3. ممنوع تماماً إضافة أي شرح أو مقدمات مثل "سأقوم بتحسين رسالتك".
4. المخرجات يجب أن تكون النص المحسن فقط باللغة العربية.

رسالة المستخدم الأصلية: {{{message}}}
النص المحسن:`,
});

const AIChatGenerateResponseInputSchema = z.object({
  message: z.string(),
  imageDataUri: z.string().optional().describe('صورة اختيارية للتحليل (Base64)'),
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
  prompt: `أنت مساعد NexusAI المتقدم (نخاع النظام). أنت تمتلك قدرات بصرية وتحليلية فائقة.
أجب على الرسالة باللغة العربية الفصح الفصحى وبأسلوب مستقبلي احترافي.

معلومات النظام: لدينا خزنة تخزين مركزية (Nexus Vault) للملفات الكبيرة على الرابط: ${VAULT_URL}.

{{#if imageDataUri}}
لقد قام المستخدم بإرفاق صورة للتحليل: {{media url=imageDataUri}}
قم بوصف ما تراه بدقة تقنية عالية أو حلل الكود البرمجي الموجود بداخلها.
{{/if}}

سياق الدردشة السابق:
{{#each history}}
  {{role}}: {{{content}}}
{{/each}}

رسالة المستخدم (أو الأمر المحسن): {{{message}}}
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
        try {
          const { text: optimized } = await optimizePrompt({ message: input.message });
          if (optimized && optimized.trim() !== input.message.trim()) {
            finalPrompt = optimized;
            optimizedText = optimized;
          }
        } catch (optErr) {
          console.error("Neural Optimization Drop:", optErr);
        }
      }
      
      const { text: responseText } = await responsePrompt({ 
        message: finalPrompt, 
        imageDataUri: input.imageDataUri,
        history: input.history 
      }, {
        model: modelToUse as any
      });
      
      // [STABILITY_ANCHOR: SOVEREIGN_NAMING_CONVENTION]
      // الالتزام الصارم بالأسماء المبسطة وحجب أرقام الإصدارات التقنية.
      let engineName = "Neural Engine";
      if (modelToUse.includes('gemini-1.5-pro')) engineName = "Gemini Pro";
      else if (modelToUse.includes('gemini-2.0') || modelToUse.includes('thinking')) engineName = "Gemini Thinking";
      else if (modelToUse.includes('gemini-1.5-flash')) engineName = "Gemini Flash";
      else if (modelToUse.includes('llama-3.3')) engineName = "Llama 3.3 70B";
      else if (modelToUse.includes('groq')) engineName = "Groq Node";
      else engineName = "Nexus Engine";

      return {
        response: responseText || "تمت المعالجة عصبياً.",
        engine: engineName,
        optimizedText: optimizedText,
        selectedModel: modelToUse
      };
    } catch (err) {
      console.error("Neural Execution Error:", err);
      throw new Error("حدث اضطراب في المزامنة العصبية: " + (err as Error).message);
    }
  }
);
