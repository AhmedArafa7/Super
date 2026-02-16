'use server';
/**
 * @fileOverview نظام توليد الردود الذكي - يدعم التبديل التلقائي بين الموديلات.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatGenerateResponseInputSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
});
export type AIChatGenerateResponseInput = z.infer<typeof AIChatGenerateResponseInputSchema>;

export async function aiChatGenerateResponse(input: AIChatGenerateResponseInput) {
  return aiChatGenerateResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiChatGenerateResponsePrompt',
  input: {schema: AIChatGenerateResponseInputSchema},
  prompt: `أنت المساعد الذكي لنظام NexusAI. 
أجب بلغة تقنية، مهنية، ومختصرة باللغة العربية.

سياق الدردشة السابق:
{{#each history}}
  {{role}}: {{{content}}}
{{/each}}

المستخدم: {{{message}}}

الرد: `,
});

const aiChatGenerateResponseFlow = ai.defineFlow(
  {
    name: 'aiChatGenerateResponseFlow',
    inputSchema: AIChatGenerateResponseInputSchema,
  },
  async input => {
    // محاولة استخدام Groq أولاً إذا كان المفتاح موجوداً، وإلا فالعودة لـ Gemini
    const hasGroq = !!(process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY);
    const modelToUse = hasGroq ? 'groq/llama-3.3-70b-versatile' : 'googleai/gemini-1.5-flash';
    
    try {
      const response = await ai.generate({
        model: modelToUse,
        prompt: prompt(input),
      });
      
      return {
        response: response.text || "عذراً، لم أتمكن من معالجة الطلب حالياً."
      };
    } catch (err) {
      return {
        response: "حدث خطأ في الاتصال بالعقدة الذكية. يرجى مراجعة مفاتيح الـ API في ملف .env"
      };
    }
  }
);
