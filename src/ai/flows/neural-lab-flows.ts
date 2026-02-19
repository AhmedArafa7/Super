'use server';
/**
 * @fileOverview [STABILITY_ANCHOR: LAB_NEURAL_FLOWS]
 * محرك المختبر العصبي - معالجة وتحسين الأوامر التقنية.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const LabOptimizeInputSchema = z.object({
  prompt: z.string().describe('الأمر المراد تحسينه'),
});

const LabOptimizeOutputSchema = z.object({
  optimizedPrompt: z.string().describe('الأمر بعد التحسين العصبي'),
  analysis: z.string().describe('تحليل موجز للتعديلات'),
});

export async function labOptimizePrompt(input: z.infer<typeof LabOptimizeInputSchema>) {
  return labOptimizeFlow(input);
}

const labPrompt = ai.definePrompt({
  name: 'labPrompt',
  input: { schema: LabOptimizeInputSchema },
  output: { schema: LabOptimizeOutputSchema },
  prompt: `أنت خبير في هندسة الأوامر (Prompt Engineering) لنظام NexusAI.
مهمتك: تحويل أمر المستخدم البسيط إلى أمر تقني معقد واحترافي يدعم البروتوكولات السيادية.

الأمر الأصلي: {{{prompt}}}

المطلوب:
1. تحسين اللغة لتكون تقنية ومستقبلية.
2. إضافة معايير الدقة والمزامنة.
3. تقديم تحليل بسيط لما تمت إضافته.`,
});

const labOptimizeFlow = ai.defineFlow(
  {
    name: 'labOptimizeFlow',
    inputSchema: LabOptimizeInputSchema,
    outputSchema: LabOptimizeOutputSchema,
  },
  async (input) => {
    const { output } = await labPrompt(input);
    if (!output) throw new Error("فشل في مزامنة المحاكي العصبى.");
    return output;
  }
);
