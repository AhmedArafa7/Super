
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import Groq from 'groq-sdk';

/**
 * تهيئة Genkit ليكون محركاً مرناً يدعم Gemini و Groq معاً.
 * تم توسيع القائمة لتشمل كافة الموديلات المتاحة في كلا الخدمتين للوصول لأقصى الإمكانات.
 */
export const ai = genkit({
  plugins: [googleAI()],
});

// تعريف وظيفة مشتركة لمعالجة طلبات Groq
const createGroqModelHandler = (modelName: string) => async (input: any) => {
  const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY_MISSING: يرجى إعداد مفتاح Groq في المتغيرات البيئية.");
  }

  const groq = new Groq({ apiKey });

  // تحويل الأدوار من Genkit (model) إلى Groq (assistant)
  const messages = input.messages.map((m: any) => ({
    role: (m.role === 'model' ? 'assistant' : m.role) as 'system' | 'user' | 'assistant',
    content: m.content.map((c: any) => c.text || '').join(''),
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
  { id: 'llama-3.2-11b-vision-preview', label: 'Groq Llama 3.2 Vision (Experimental)' },
  { id: 'llama-3.2-1b-preview', label: 'Groq Llama 3.2 1B (Micro)' },
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
