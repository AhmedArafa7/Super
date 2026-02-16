
'use server';
/**
 * @fileOverview نظام توليد الردود الذكي - يدعم التبديل التلقائي بين الموديلات مع تحسين دعم اللغة العربية.
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
يجب أن تكون إجابتك باللغة العربية الفصحى حصراً وبأسلوب تقني احترافي.

قواعد صارمة:
1. لا تستخدم لغات غريبة (مثل التشيكية أو البولندية) في منتصف الجمل العربية.
2. إذا اضطررت لاستخدام مصطلحات تقنية، استخدم المصطلح الإنجليزي المعروف بين قوسين بجانب الترجمة العربية.
3. تأكد من أن بنية الجملة العربية سليمة تماماً ولا تتأثر بالكلمات الإنجليزية المدمجة.
4. ابدأ ردك دائماً بالعربية لضمان ضبط اتجاه القراءة من اليمين إلى اليسار.

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
    if (!input.message || input.message.trim() === "") {
      return {
        response: "يبدو أنك لم تكتب نصاً في رسالتك. كيف يمكنني مساعدتك تقنياً اليوم؟",
        engine: "System"
      };
    }

    const hasGroq = !!(process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY);
    
    const modelToUse = hasGroq ? 'groq/llama-3.3-70b-versatile' : 'googleai/gemini-1.5-flash';
    const engineName = hasGroq ? 'Groq Llama 3.3' : 'Google Gemini 1.5';

    try {
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
        response: "حدث خطأ أثناء الاتصال بالمحرك العصبي. يرجى المحاولة مرة أخرى.",
        engine: engineName
      };
    }
  }
);
