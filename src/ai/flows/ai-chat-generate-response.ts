
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

export async function aiChatGenerateResponse(input: z.infer<typeof AIChatGenerateResponseInputSchema>) {
  return aiChatGenerateResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiChatGenerateResponsePrompt',
  input: {schema: AIChatGenerateResponseInputSchema},
  prompt: `أنت المساعد الذكي لنظام NexusAI. 
أجب بلغة تقنية احترافية ومختصرة باللغة العربية.

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
    // التأكد من أن الرسالة ليست فارغة لتجنب ردود "لم تكتب شيئاً"
    if (!input.message || input.message.trim() === "") {
      return {
        response: "يبدو أنك لم تكتب نصاً في رسالتك. كيف يمكنني مساعدتك تقنياً اليوم؟",
        engine: "System"
      };
    }

    const hasGroq = !!(process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY);
    const hasGemini = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY);
    
    // تحديد الموديل النشط بناءً على المفاتيح المتوفرة
    const modelToUse = hasGroq ? 'groq/llama-3.3-70b-versatile' : 'googleai/gemini-1.5-flash';
    const engineName = hasGroq ? 'Groq Llama 3.3' : 'Google Gemini 1.5';

    if (!hasGroq && !hasGemini) {
      return {
        response: "عذراً، لم يتم العثور على أي مفاتيح API (Groq أو Gemini). يرجى إضافة المفاتيح في ملف .env لتنشيط المحرك العصبي.",
        engine: "None"
      };
    }
    
    try {
      // تصحيح الاستدعاء: استخدام البرومبت المعرف مسبقاً مع الموديل المختار مباشرة
      const { text } = await prompt(input, {
        model: modelToUse
      });
      
      return {
        response: text || "عذراً، لم أتمكن من صياغة رد حالياً.",
        engine: engineName
      };
    } catch (err) {
      console.error("Neural Sync Error:", err);
      return {
        response: "حدث خطأ أثناء الاتصال بالمحرك العصبي. قد يكون ذلك بسبب نفاذ حدود الاستخدام (Rate Limit).",
        engine: engineName
      };
    }
  }
);
