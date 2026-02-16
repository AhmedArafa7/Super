import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import Groq from 'groq-sdk';

/**
 * تهيئة Genkit ليكون محركاً مرناً يدعم Gemini و Groq معاً.
 */
export const ai = genkit({
  plugins: [googleAI()],
});

// تعريف موديل Groq كبديل فائق السرعة
ai.defineModel(
  {
    name: 'groq/llama-3.3-70b-versatile',
    label: 'Groq Llama 3.3 70B (Neural Engine)',
  },
  async (input) => {
    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      throw new Error("GROQ_API_KEY_MISSING");
    }

    const groq = new Groq({ apiKey });

    // تحويل الأدوار من Genkit (model) إلى Groq (assistant)
    const messages = input.messages.map((m) => ({
      role: (m.role === 'model' ? 'assistant' : m.role) as 'system' | 'user' | 'assistant',
      content: m.content.map((c) => c.text || '').join(''),
    }));

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
    });

    return {
      message: {
        role: 'model',
        content: [{ text: completion.choices[0].message.content || '' }],
      },
    };
  }
);
