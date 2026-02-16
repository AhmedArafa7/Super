
import {genkit} from 'genkit';
import Groq from 'groq-sdk';

// Initialize Genkit instance
export const ai = genkit({
  model: 'groq/llama-3.3-70b-versatile',
});

// Define the Groq model adapter within Genkit
// This allows us to use standard Genkit features (flows, prompts) with Groq's high-speed API
ai.defineModel(
  {
    name: 'groq/llama-3.3-70b-versatile',
    label: 'Groq Llama 3.3 70B',
  },
  async (input) => {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY,
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
          content: [{ text: "عذراً، حدث خطأ في الاتصال بالعقدة الذكية (Groq). يرجى التأكد من إعداد المفتاح GROQ_API_KEY بشكل صحيح." }],
        },
      };
    }
  }
);
