import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const runtime = 'edge';

const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_DRIVE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

/**
 * [STABILITY_ANCHOR: LIGHTWEIGHT_NEURAL_ENGINE_V1.0]
 * محرك عصبي خفيف الوزن مصمم للعمل على الـ Edge بدون تبعيات ثقيلة.
 * يستخدم الـ fetch المباشر لـ Gemini و Groq SDK لإصلاح أخطاء البناء.
 */

async function callGemini(model: string, prompt: string, history: any[] = [], imageDataUri?: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY_MISSING");

  const execute = async (targetModel: string) => {
    const url = `https://generativelanguage.googleapis.com/v1/models/${targetModel}:generateContent?key=${GEMINI_API_KEY}`;
    const contents = history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));
    const userParts: any[] = [{ text: prompt }];
    if (imageDataUri) {
      const [mimeType, base64Data] = imageDataUri.split(';base64,');
      userParts.push({ inline_data: { mime_type: mimeType.replace('data:', ''), data: base64Data } });
    }
    contents.push({ role: 'user', parts: userParts });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    const data = await res.json();
    if (data.error) throw data.error;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  };

  try {
    return await execute(model);
  } catch (err: any) {
    // [STABILITY] Fallback to 2.0-flash if 1.5 is missing or restricted
    if (err.message?.includes('not found') && model === 'gemini-2.5-flash') {
      console.warn("Gemini 2.5 Flash not found, falling back to 2.0 Flash.");
      return await execute('gemini-2.0-flash');
    }
    throw err;
  }
}

async function callGroq(model: string, prompt: string, history: any[] = []) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY_MISSING");
  const groq = new Groq({ apiKey: GROQ_API_KEY });

  const messages = history.map(h => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.content
  }));
  messages.push({ role: 'user', content: prompt });

  const completion = await groq.chat.completions.create({
    model,
    messages: messages as any,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, imageDataUri, isAutoMode, manualModel, history } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: true, message: "مطلوب رسالة." }, { status: 400 });
    }

    let modelToUse = isAutoMode ? 'gemini-2.5-flash' : (manualModel || 'gemini-2.5-flash');
    // تنظيف اسم الموديل من بادئة genkit إذا وجدت
    modelToUse = modelToUse.replace('googleai/', '').replace('groq/', '');

    // تصحيح مسميات Gemini
    if (modelToUse.includes('gemini')) {
      if (modelToUse.includes('1.5-flash')) modelToUse = 'gemini-2.5-flash';
      else if (modelToUse.includes('1.5-pro')) modelToUse = 'gemini-1.5-pro';
      else if (modelToUse === 'flash-latest') modelToUse = 'gemini-2.5-flash';
    }

    let responseText = "";
    let engineName = "NexusAI";
    let optimizedText = null;

    // محاكاة تحسين الـ Prompt إذا كان الوضع التلقائي مفعل
    let promptToUse = message;
    if (isAutoMode) {
      try {
        const optimizationPrompt = `أنت مُحسن أوامر لنظام NexusAI. حول طلب المستخدم التالي إلى أمر دقيق بالعربية الفصحى وبدون مقدمات:\n\n${message}`;
        optimizedText = await callGemini('gemini-2.5-flash', optimizationPrompt);
        if (optimizedText) promptToUse = optimizedText;
      } catch (e) {
        console.warn("Optimization failed, using original prompt.");
      }
    }

    try {
      if (modelToUse.includes('llama') || modelToUse.includes('mixtral') || modelToUse.includes('gemma')) {
        responseText = await callGroq(modelToUse, promptToUse, history);
        engineName = "Groq Engine";
      } else {
        // [STABILITY] محاولة استخدام Gemini مع Fallback داخلي لنسخة 2.0
        const geminiModel = modelToUse.includes('gemini') ? modelToUse : 'gemini-2.5-flash';
        responseText = await callGemini(geminiModel, promptToUse, history, imageDataUri);
        engineName = geminiModel.includes('pro') ? "Gemini Pro" : "Gemini Flash";
      }
    } catch (primaryErr: any) {
      console.error("Primary AI Engine Failed, attempting Global Fallback:", primaryErr.message);

      // [NEURAL_RESILIENCE] التبديل لـ Groq إذا فشل Gemini (بسبب الكوتة أو غيره)
      if (GROQ_API_KEY && !modelToUse.includes('llama')) {
        try {
          responseText = await callGroq('llama-3.3-70b-versatile', promptToUse, history);
          engineName = "Nexus Resilience (Groq)";
        } catch (groqErr: any) {
          throw new Error(`تعذر الاتصال بجميع المحركات: ${primaryErr.message}`);
        }
      } else {
        throw primaryErr;
      }
    }

    return NextResponse.json({
      success: true,
      response: responseText || "تمت المعالجة عصبياً.",
      engine: engineName,
      optimizedText,
      selectedModel: modelToUse as string
    });

  } catch (err: any) {
    console.error("Lightweight Neural API Failure:", err);
    return NextResponse.json({
      success: false,
      error: true,
      message: `حدث اضطراب في الاتصال العصبى: ${err.message || 'Unknown Error'}`,
      diagnostics: {
        error: err.message,
        env: {
          hasGemini: !!GEMINI_API_KEY,
          hasGroq: !!GROQ_API_KEY,
          runtime: 'edge'
        }
      }
    }, { status: 500 });
  }
}
