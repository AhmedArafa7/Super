
'use server';
/**
 * @fileOverview نظام توليد الردود الذكي - يدعم تحسين المطالبات واختيار الموديلات الذكي.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatGenerateResponseInputSchema = z.object({
  message: z.string(),
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

const optimizerPrompt = ai.definePrompt({
  name: 'optimizePrompt',
  input: {schema: z.object({ message: z.string() })},
  prompt: `أنت خبير في هندسة المطالبات (Prompt Engineering). 
مهمتك هي تحسين الرسالة التالية الموجهة لمساعد ذكي لتكون أكثر وضوحاً ودقة تقنية.
حافظ على جوهر طلب المستخدم ولكن اجعله بصيغة احترافية.
الرسالة: {{{message}}}
المطالبة المحسنة (بالعربية فقط):`,
});

const routerPrompt = ai.definePrompt({
  name: 'routePrompt',
  input: {schema: z.object({ message: z.string() })},
  prompt: `بناءً على الرسالة التالية، اختر أنسب محرك للرد:
- 'googleai/gemini-1.5-flash' للطلبات الإبداعية، العامة، أو التي تتطلب تحليل صور/وسائط.
- 'groq/llama-3.3-70b-versatile' للطلبات المنطقية، التقنية البحتة، أو البرمجية التي تتطلب سرعة فائقة.

الرسالة: {{{message}}}
اسم المحرك المختار فقط:`,
});

const responsePrompt = ai.definePrompt({
  name: 'aiChatGenerateResponsePrompt',
  input: {schema: z.object({ 
    message: z.string(),
    history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).optional()
  })},
  prompt: `أنت المساعد الذكي الرسمي لنظام NexusAI.
أجب على الرسالة التالية باحترافية عالية باللغة العربية الفصحى.

سياق الدردشة:
{{#each history}}
  {{role}}: {{{content}}}
{{/each}}

المستخدم: {{{message}}}
الرد:`,
});

const aiChatGenerateResponseFlow = ai.defineFlow(
  {
    name: 'aiChatGenerateResponseFlow',
    inputSchema: AIChatGenerateResponseInputSchema,
  },
  async input => {
    if (!input.message?.trim()) {
      return { response: "يرجى كتابة رسالة.", engine: "System" };
    }

    // 1. تحسين المطالبة (Prompt Optimization) باستخدام Groq دائماً لسرعته
    const { text: optimizedText } = await optimizerPrompt({ message: input.message }, {
      model: 'groq/llama-3.3-70b-versatile'
    });

    const finalPrompt = optimizedText || input.message;

    // 2. تحديد الموديل
    let modelToUse = input.manualModel || 'googleai/gemini-1.5-flash';
    
    if (input.isAutoMode) {
      const { text: routedModel } = await routerPrompt({ message: finalPrompt }, {
        model: 'groq/llama-3.3-70b-versatile'
      });
      modelToUse = routedModel?.trim() || 'googleai/gemini-1.5-flash';
    }

    try {
      const { text: responseText } = await responsePrompt({ 
        message: finalPrompt, 
        history: input.history 
      }, {
        model: modelToUse as any
      });
      
      return {
        response: responseText || "عذراً، فشل توليد الرد.",
        engine: modelToUse,
        optimizedText: finalPrompt,
        selectedModel: modelToUse
      };
    } catch (err) {
      console.error("Neural Sync Error:", err);
      return {
        response: "حدث خطأ عصبي. يرجى المحاولة لاحقاً.",
        engine: "Error"
      };
    }
  }
);
