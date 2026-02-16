import {genkit} from 'genkit';
import Groq from 'groq-sdk';

// Initialize Genkit instance with Groq as the primary engine
export const ai = genkit({
  model: 'groq/llama-3.3-70b-versatile',
});

// Define the Groq model adapter within Genkit
// This allows us to use llama-3.3-70b-versatile (The strongest model for Arabic and Logic)
ai.defineModel(
  {
    name: 'groq/llama-3.3-70b-versatile',
    label: 'Groq Llama 3.3 70B (Neural Engine)',
  },
  async (input) => {
    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      return {
        message: {
          role: 'assistant',
          content: [{ text: "عذراً، لم يتم العثور على مفتاح البرمجة (GROQ_API_KEY). يرجى التأكد من إضافة المفتاح في إعدادات Vercel (Environment Variables) ليعمل الذكاء الاصطناعي." }],
        },
      };
    }

    const groq = new Groq({
      apiKey: apiKey,
    });

    const messages = input.messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content.map((c) => c.text || '').join(''),
    }));

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      });

      return {
        message: {
          role: 'assistant',
          content: [{ text: completion.choices[0].message.content || '' }],
        },
      };
    } catch (error: any) {
      console.error('Groq AI Error:', error);
      return {
        message: {
          role: 'assistant',
          content: [{ text: "عذراً، حدث خطأ في الاتصال بالعقدة العصبية (Groq). يرجى التأكد من استهلاك الحصة المتاحة أو صحة المفتاح." }],
        },
      };
    }
  }
);