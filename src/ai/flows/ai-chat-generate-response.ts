
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
  prompt: `أنت محرك تحويل المطالبات الصامت. 
مهمتك:
1. إذا كانت الرسالة عبارة عن تحية (مثل: سلام، مرحبا، السلام عليكم) أو دردشة عابرة، أعد الرسالة كما هي تماماً دون تغيير.
2. إذا كانت الرسالة طلباً تقنياً أو سؤالاً، قم بإعادة صياغتها لتكون أكثر دقة ووضوحاً واحترافية.
3. ممنوع منعاً باتاً إضافة أي شرح أو مقدمات مثل "سأقوم بتحسين رسالتك".
4. أخرج النص المحسن فقط.

الرسالة الأصلية: {{{message}}}
النص الناتج:`,
});

const routerPrompt = ai.definePrompt({
  name: 'routePrompt',
  input: {schema: z.object({ message: z.string() })},
  prompt: `بناءً على الرسالة التالية، اختر أنسب محرك للرد:
- 'googleai/gemini-1.5-flash' للطلبات الإبداعية، العامة، التحيات، أو التي تتطلب تحليل صور/وسائط.
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
  prompt: `أنت مساعد NexusAI الذكي. أنت ودود، محترف، ومباشر.
أجب على الرسالة التالية باللغة العربية الفصحى. 
إذا كانت الرسالة تحية، رد بتحية أجمل منها وكن مستعداً للمساعدة.
إذا كانت طلباً تقنياً، قدم حلاً دقيقاً ومختصراً.

سياق الدردشة السابق (استخدمه للفهم فقط):
{{#each history}}
  {{role}}: {{{content}}}
{{/each}}

رسالة المستخدم الحالية: {{{message}}}
الرد الحكيم:`,
});

const aiChatGenerateResponseFlow = ai.defineFlow(
  {
    name: 'aiChatGenerateResponseFlow',
    inputSchema: AIChatGenerateResponseInputSchema,
  },
  async input => {
    if (!input.message?.trim()) {
      return { response: "يرجى كتابة رسالة للبدء.", engine: "System" };
    }

    try {
      // 1. تحسين المطالبة (بدون ثرثرة)
      const { text: optimizedText } = await optimizerPrompt({ message: input.message }, {
        model: 'groq/llama-3.3-70b-versatile'
      });

      const finalPrompt = optimizedText?.trim() || input.message;

      // 2. تحديد الموديل
      let modelToUse = input.manualModel || 'googleai/gemini-1.5-flash';
      
      if (input.isAutoMode) {
        const { text: routedModel } = await routerPrompt({ message: finalPrompt }, {
          model: 'groq/llama-3.3-70b-versatile'
        });
        modelToUse = routedModel?.trim().toLowerCase().includes('llama') 
          ? 'groq/llama-3.3-70b-versatile' 
          : 'googleai/gemini-1.5-flash';
      }

      // 3. توليد الرد النهائي
      const { text: responseText } = await responsePrompt({ 
        message: finalPrompt, 
        history: input.history 
      }, {
        model: modelToUse as any
      });
      
      return {
        response: responseText || "عذراً، لم أستطع معالجة الرد حالياً.",
        engine: modelToUse,
        optimizedText: finalPrompt !== input.message ? finalPrompt : undefined,
        selectedModel: modelToUse
      };
    } catch (err) {
      console.error("Neural Sync Error:", err);
      return {
        response: "نعتذر، حدث اضطراب في الاتصال بالمحرك العصبي. يرجى المحاولة بعد لحظات.",
        engine: "Error"
      };
    }
  }
);
