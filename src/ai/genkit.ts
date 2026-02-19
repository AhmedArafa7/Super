
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import Groq from 'groq-sdk';

/**
 * تهيئة Genkit ليكون محركاً مرناً يدعم Gemini و Groq معاً.
 * تم تحسين تمرير المفاتيح لضمان استقرار الربط العصبي ومنع الانهيار عند التحميل.
 */
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || "MISSING_KEY";

export const ai = genkit({
  plugins: [
    googleAI({ apiKey })
  ],
});

// تعريف وظيفة مشتركة لمعالجة طلبات Groq
const createGroqModelHandler = (modelName: string) => async (input: any) => {
  const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

  if (!groqKey) {
    throw new Error("GROQ_API_KEY_MISSING: يرجى إعداد مفتاح Groq في المتغيرات البيئية.");
  }

  const groq = new Groq({ apiKey: groqKey });

  // تحويل الأدوار من Genkit (model) إلى Groq (assistant)
  const messages = input.messages.map((m: any) => ({
    role: (m.role === 'model' ? 'assistant' : m.role) as 'system' | 'user' | 'assistant',
    content: Array.isArray(m.content) 
      ? m.content.map((c: any) => c.text || '').join('')
      : (m.content || ''),
  }));

  const completion = await groq.chat.completions.create({
    model: modelName,
    messages,
    temperature: 0.7,
  });

  return {
    message: {
      role: 'model',
      content: [{ text: completion.choices[0].message.content || '' }],
    },
  };
};

// تسجيل ترسانة موديلات Groq المتكاملة
const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Groq Llama 3.3 70B' },
  { id: 'llama-3.1-8b-instant', label: 'Groq Llama 3.1 8B' },
  { id: 'mixtral-8x7b-32768', label: 'Groq Mixtral 8x7B' },
  { id: 'gemma2-9b-it', label: 'Groq Gemma 2 9B' },
];

GROQ_MODELS.forEach(m => {
  ai.defineModel(
    {
      name: `groq/${m.id}`,
      label: m.label,
    },
    createGroqModelHandler(m.id)
  );
});
