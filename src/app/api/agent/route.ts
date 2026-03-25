import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const runtime = 'edge';
export const maxDuration = 60;

/**
 * [STABILITY_ANCHOR: NEURAL_ARCHITECT_API_V1.0]
 * محرك المهندس العصبي - يعيد JSON بدلاً من Stream لتجنب مشاكل الـ SDK.
 * مطابق لنمط /api/ai/generate الذي ثبت استقراره في هذه البيئة.
 */

const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

const AGENT_SYSTEM_PROMPT = `أنت "المهندس العصبي" (Neural Architect) في نظام NexusAI. بيئة بناء سيادية متطورة.
مهمتك الأساسية هي بناء وتعديل الأكواد البرمجية والملفات في بيئة عمل المستخدم.

قوانين صارمة:
1. عند طلب إنشاء أو تعديل أي كود، قم بإرجاع الملفات في حقل JSON المخصص لذلك.
2. أرجع ردك في الشكل التالي دائماً:
   - حقل "explanation": شرح مختصر بالعربية لما قمت به.
   - حقل "files": مصفوفة من الملفات ({path, content, language}) إذا كان الطلب برمجياً.
3. إذا كان الطلب محادثة فقط (وليس برمجة)، أعد "files" كمصفوفة فارغة.
4. تذكر: أنت تمتلك القدرة على تغيير بيئة العمل (Workspace) لحظياً، وهذا هو دورك المحوري.`;

// قائمة الموديلات مع آلية الـ Fallback التلقائي
const GEMINI_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash',
];

let stableModel: string | null = null;
const blacklist = new Set<string>();

async function callGemini(model: string, messages: any[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: AGENT_SYSTEM_PROMPT }] },
      generationConfig: { responseMimeType: 'application/json' }
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Gemini API Error');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
}

async function callGroq(messages: any[]): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY_MISSING');
  const groq = new Groq({ apiKey: GROQ_API_KEY });

  const groqMessages = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
  ];

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: groqMessages as any,
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  return completion.choices[0]?.message?.content || '{}';
}

function parseAgentResponse(raw: string): { explanation: string; files: any[] } {
  try {
    // قد يأتي الرد محاطاً بـ markdown code fences
    const clean = raw.replace(/^```json\n?|^```\n?|\n?```$/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      explanation: parsed.explanation || parsed.text || raw,
      files: Array.isArray(parsed.files) ? parsed.files : [],
    };
  } catch {
    // إذا فشل الـ parse، نعامل الاستجابة كنص عادي (محادثة فقط)
    return { explanation: raw, files: [] };
  }
}

export async function POST(req: Request) {
  try {
    const { messages, preferredAI, autoFallback } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    let rawResponse = '';
    let engine = 'NexusAI';

    // تفضيل Groq إذا طلب المستخدم صراحةً
    if (preferredAI === 'groq') {
      rawResponse = await callGroq(messages);
      engine = 'Groq Llama 3.3';
    } else if (!GEMINI_API_KEY) {
      // لا يوجد مفتاح Gemini، تحويل مباشر لـ Groq
      rawResponse = await callGroq(messages);
      engine = 'Groq Llama 3.3';
    } else {
      // بناء قائمة المرشحين مع تقديم الموديل المستقر الأخير
      const candidates = [
        ...(stableModel && !blacklist.has(stableModel) ? [stableModel] : []),
        ...GEMINI_MODELS.filter(m => m !== stableModel && !blacklist.has(m)),
      ];

      let lastError: any = null;

      for (const modelId of candidates) {
        try {
          rawResponse = await callGemini(modelId, messages);
          stableModel = modelId;
          engine = `Gemini (${modelId})`;
          break;
        } catch (err: any) {
          lastError = err;
          const isUnavailable = err.message?.toLowerCase().includes('not found') ||
            err.message?.toLowerCase().includes('not supported');
          if (isUnavailable) {
            blacklist.add(modelId);
            if (stableModel === modelId) stableModel = null;
          } else if (autoFallback) {
            // خطأ آخر (كوتة مثلاً) مع تفعيل الـ fallback → تحويل لـ Groq
            rawResponse = await callGroq(messages);
            engine = 'Groq Llama 3.3 (Auto-Fallback)';
            break;
          } else {
            throw err;
          }
        }
      }

      // إذا فشلت كل نماذج Gemini
      if (!rawResponse && autoFallback) {
        rawResponse = await callGroq(messages);
        engine = 'Groq Llama 3.3 (Final Fallback)';
      } else if (!rawResponse) {
        throw lastError || new Error('All Gemini models are unavailable');
      }
    }

    const { explanation, files } = parseAgentResponse(rawResponse);

    return NextResponse.json({ success: true, explanation, files, engine });

  } catch (err: any) {
    console.error('[Neural Architect API Error]', err.message);
    return NextResponse.json({
      success: false,
      error: err.message || 'Neural connection failed',
    }, { status: 500 });
  }
}
