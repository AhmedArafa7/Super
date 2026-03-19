
'use server';
/**
 * @fileOverview [STABILITY_ANCHOR: AGENT_AI_ENGINE_V2.5]
 * محرك المهندس العصبي - معالجة الأوامر البرمجية وتوليد الملفات.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AgentCodeInputSchema = z.object({
  instruction: z.string().describe('الأمر البرمجي من المستخدم'),
  currentFiles: z.array(z.object({
    path: z.string(),
    content: z.string()
  })).optional(),
});

const AgentCodeOutputSchema = z.object({
  explanation: z.string().describe('شرح لما قام به الوكيل'),
  steps: z.array(z.string()).describe('خطوات التنفيذ العصبية'),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    language: z.string()
  })).describe('الملفات البرمجية الناتجة أو المعدلة'),
});

export async function processAgentTask(input: z.infer<typeof AgentCodeInputSchema>) {
  try {
    const result = await agentCodeFlow(input);
    return { success: true, ...result };
  } catch (err: any) {
    console.error("Agent Engine Failure:", err);
    return { 
      success: false, 
      error: true, 
      message: err.message || "فشل المهندس العصبي في معالجة المهمة.",
      explanation: "حدث خطأ أثناء محاولة بناء العقد البرمجية.",
      steps: ["توقف مفاجئ في النخاع"],
      files: []
    };
  }
}

const agentPrompt = ai.definePrompt({
  name: 'agentCodePrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AgentCodeInputSchema },
  output: { schema: AgentCodeOutputSchema },
  prompt: `أنت "المهندس العصبي" (Neural Architect) في نظام NexusAI. 
مهمتك هي مساعدة المستخدم في بناء تطبيقات وبرامج متكاملة.

المطلوب:
1. تحليل أمر المستخدم: {{{instruction}}}
2. إذا كان هناك ملفات حالية، قم بتعديلها أو الإضافة عليها.
3. قدم كوداً برمجياً نظيفاً واحترافياً.
4. اشرح الخطوات التي اتخذتها في حقل steps بشكل تقني.
5. في حقل explanation، اشرح التغييرات التي أجريتها ولماذا.

يجب أن تكون المخرجات بتنسيق JSON دقيق.`,
});

const agentCodeFlow = ai.defineFlow(
  {
    name: 'agentCodeFlow',
    inputSchema: AgentCodeInputSchema,
    outputSchema: AgentCodeOutputSchema,
  },
  async (input) => {
    const { output } = await agentPrompt(input);
    if (!output) throw new Error("فشل المهندس العصبي في معالجة المهمة.");
    return output;
  }
);
