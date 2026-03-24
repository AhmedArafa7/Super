import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, convertToModelMessages } from 'ai';
import { z } from 'zod';

export const runtime = 'edge';
export const maxDuration = 60;

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, preferredAI, autoFallback } = await req.json();

    const systemPrompt = `أنت "المهندس العصبي" (Neural Architect) في نظام NexusAI. بيئة بناء سيادية.
مهمتك مساعدة المستخدم في كتابة وتعديل الأكواد البرمجية. يجب عليك الرد باللغة العربية بأسلوب احترافي جداً وتقني.
عندما يطلب منك المستخدم كتابة سكربت أو بناء واجهة أو تعديل ملفات معينة، يجب عليك استدعاء الأداة \`update_workspace_files\` وتمرير مسارات الملفات ومحتواها. 
إذا كان السؤال نظرياً أو لا يتطلب كتابة أكواد فعلية في بيئة العمل، فقط أجب نصياً.
تذكر دائماً أنك تمتلك القدرة على تعديل بيئة عمل المستخدم (Workspace) بشكل مباشر والتغييرات ستنعكس لحظياً أمامه.`;

    const tools = {
      update_workspace_files: tool({
        description: 'استخدم هذه الأداة لإنشاء أو تعديل أي ملف برمجي في بيئة عمل المستخدم.',
        inputSchema: z.object({
          files: z.array(z.object({
            path: z.string(),
            content: z.string(),
            language: z.string()
          })),
          explanation: z.string()
        }),
        execute: async (args) => ({ success: true, filesUpdated: args.files.length })
      })
    };

    // تحديد الموديل بناءً على رغبة المستخدم
    const model = preferredAI === 'groq' 
      ? groq('llama-3.3-70b-versatile') 
      : google('gemini-1.5-flash');

    try {
      const result = streamText({
        model,
        messages: await convertToModelMessages(messages),
        system: systemPrompt,
        tools,
      });

      return result.toUIMessageStreamResponse();
    } catch (error: any) {
      // إذا كان الخطأ بسبب الحصة (Quota)
      const isQuotaError = error.message?.includes('quota') || error.status === 429;
      
      if (isQuotaError && preferredAI === 'gemini' && autoFallback) {
        console.warn('Gemini quota hit, auto-falling back to Groq');
        const fallbackResult = streamText({
          model: groq('llama-3.3-70b-versatile'),
          messages: await convertToModelMessages(messages),
          system: systemPrompt,
          tools,
        });
        return fallbackResult.toUIMessageStreamResponse();
      }

      if (isQuotaError) {
        return new Response(JSON.stringify({ 
          error: 'QUOTA_EXHAUSTED', 
          provider: preferredAI 
        }), { status: 429 });
      }

      throw error;
    }
  } catch (error: any) {
    console.error('Agent API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
