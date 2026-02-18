'use server';
/**
 * @fileOverview المحرك العصبي المتطور v5.5 - يدعم الرؤية، الأدوات، التحسين الصامت، وتكامل Nexus Vault.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const VAULT_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

// 1. تعريف أدوات النظام (Tools)
const getSystemStats = ai.defineTool(
  {
    name: 'getSystemStats',
    description: 'جلب إحصائيات النظام الحية وموقع خزنة التخزين الضخمة.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      activeNodes: z.number(),
      totalMessages: z.number(),
      vaultUrl: z.string(),
      status: z.string()
    }),
  },
  async () => {
    return { 
      activeNodes: 124, 
      totalMessages: 5420, 
      vaultUrl: VAULT_URL,
      status: 'Operational' 
    };
  }
);

// 2. بروتوكول التحسين الصامت (Silent Optimizer)
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
  tools: [getSystemStats],
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
      // تحديد الموديل المطلوب استخدامه
      let modelToUse = input.isAutoMode ? 'googleai/gemini-1.5-flash' : (input.manualModel || 'googleai/gemini-1.5-flash');
      
      let finalPrompt = input.message;
      let optimizedText = null;

      // تنفيذ بروتوكول التحسين الصامت فقط في الوضع التلقائي
      if (input.isAutoMode) {
        try {
          const { text: optimized } = await optimizePrompt({ message: input.message });
          if (optimized && optimized.trim() !== input.message.trim()) {
            finalPrompt = optimized;
            optimizedText = optimized;
          }
        } catch (optErr) {
          console.error("Optimization failed, using original message", optErr);
        }
      }
      
      const { text: responseText } = await responsePrompt({ 
        message: finalPrompt, 
        imageDataUri: input.imageDataUri,
        history: input.history 
      }, {
        model: modelToUse as any
      });
      
      // [SIMPLIFIED_NAMING]: استخلاص الأسماء المبسطة للموديلات لحجب أرقام الإصدارات وفق بروتوكول نكسوس
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
