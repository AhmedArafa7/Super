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
    // Try to get the API key from multiple possible environment variables
    const apiKey = process.env.GROQ_API_KEY || 
                   process.env.NEXT_PUBLIC_GROQ_API_KEY || 
                   process.env.GROK_API_KEY; // Handling common typo

    if (!apiKey) {
      return {
        message: {
          role: 'model',
          content: [{ text: "عذراً، لم يتم العثور على مفتاح البرمجة (GROQ_API_KEY). يرجى التأكد من إضافة السطر التالي في ملف .env: \nGROQ_API_KEY=your_key_here" }],
        },
      };
    }

    const groq = new Groq({
      apiKey: apiKey,
    });

    // Transform messages for Groq compatibility
    // Genkit uses 'model', Groq uses 'assistant'
    const messages = input.messages.map((m) => ({
      role: (m.role === 'model' ? 'assistant' : m.role) as 'system' | 'user' | 'assistant',
      content: m.content.map((c) => c.text || '').join(''),
    }));

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      });

      // Return result in Genkit expected format (using 'model' role)
      return {
        message: {
          role: 'model',
          content: [{ text: completion.choices[0].message.content || '' }],
        },
      };
    } catch (error: any) {
      console.error('Groq AI Error:', error);
      return {
        message: {
          role: 'model',
          content: [{ text: "عذراً، حدث خطأ أثناء الاتصال بالمحرك العصبي (Groq). يرجى التأكد من أن المفتاح صحيح وله صلاحية الوصول للموديل المطلوب." }],
        },
      };
    }
  }
);
