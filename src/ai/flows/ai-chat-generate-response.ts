
'use server';
/**
 * @fileOverview المحرك العصبي المتطور v5.0 - يدعم الرؤية، الأدوات، والوسائط المتعددة.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// 1. تعريف الأدوات (Tools) - تسمح للـ AI بالتفاعل مع النظام
const getSystemStats = ai.defineTool(
  {
    name: 'getSystemStats',
    description: 'جلب إحصائيات النظام الحية (عدد المستخدمين، الرسائل).',
    inputSchema: z.object({}),
    outputSchema: z.object({
      activeNodes: z.number(),
      totalMessages: z.number(),
      status: z.string()
    }),
  },
  async () => {
    // محاكاة جلب البيانات من Firestore
    return { activeNodes: 124, totalMessages: 5420, status: 'Operational' };
  }
);

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
أجب على الرسالة باللغة العربية الفصحى.

{{#if imageDataUri}}
لقد قام المستخدم بإرفاق صورة للتحليل: {{media url=imageDataUri}}
قم بوصف ما تراه بدقة تقنية عالية.
{{/if}}

سياق الدردشة السابق:
{{#each history}}
  {{role}}: {{{content}}}
{{/each}}

رسالة المستخدم: {{{message}}}
الرد الحكيم:`,
});

const aiChatGenerateResponseFlow = ai.defineFlow(
  {
    name: 'aiChatGenerateResponseFlow',
    inputSchema: AIChatGenerateResponseInputSchema,
  },
  async input => {
    try {
      // اختيار الموديل (Gemini يدعم الرؤية والأدوات بشكل أفضل)
      const modelToUse = 'googleai/gemini-1.5-flash';
      
      const { text: responseText, media } = await responsePrompt({ 
        message: input.message, 
        imageDataUri: input.imageDataUri,
        history: input.history 
      }, {
        model: modelToUse as any
      });
      
      return {
        response: responseText || "تمت المعالجة عصبياً.",
        engine: modelToUse,
        selectedModel: modelToUse
      };
    } catch (err) {
      console.error("Neural Execution Error:", err);
      return {
        response: "حدث اضطراب في المزامنة العصبية. يرجى إعادة المحاولة.",
        engine: "Error"
      };
    }
  }
);
