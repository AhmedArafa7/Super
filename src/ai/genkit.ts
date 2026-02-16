import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import Groq from 'groq-sdk';

/**
 * تهيئة Genkit ليكون محركاً مرناً يدعم Gemini و Groq معاً.
 * سيقوم النظام بالتبديل تلقائياً للمحرك المتاح بناءً على مفاتيح الـ API المتوفرة.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash', // الموديل الافتراضي في حال توفر مفتاح جوجل
});

// تعريف موديل Groq كبديل قوي في حال رغب المستخدم باستخدامه
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
          role: 'model',
          content: [{ text: "عذراً، لم يتم العثور على مفتاح البرمجة (GROQ_API_KEY). يرجى التأكد من إضافة السطر التالي في ملف .env: \nGROQ_API_KEY=your_key_here" }],
        },
      };
    }

    const groq = new Groq({ apiKey });

    // تحويل الأدوار للتوافق مع Groq (Genkit يستخدم model، بينما Groq يتوقع assistant)
    const messages = input.messages.map((m) => ({
      role: (m.role === 'model' ? 'assistant' : m.role) as 'system' | 'user' | 'assistant',
      content: m.content.map((c) => c.text || '').join(''),
    }));

    try {
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
    } catch (error: any) {
      return {
        message: {
          role: 'model',
          content: [{ text: "عذراً، حدث خطأ أثناء الاتصال بـ Groq. تأكد من صحة المفتاح." }],
        },
      };
    }
  }
);
