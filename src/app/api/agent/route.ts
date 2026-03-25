import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

/**
 * [STABILITY_ANCHOR: NEURAL_ARCHITECT_API_V2.0]
 * محرك المهندس العصبي - نمط مستقر باستخدام fetch المباشر فقط (بدون SDK).
 * مطابق لأسلوب /api/ai/generate الذي أثبت استقراره في هذه البيئة.
 */

const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

const AGENT_SYSTEM_PROMPT = `أنت "المهندس العصبي" (Neural Architect) في نظام NexusAI.
مهمتك الأساسية هي بناء وتعديل الأكواد البرمجية في بيئة عمل المستخدم.

عند طلب بناء أو تعديل أي كود، أعد ردك حصرياً بصيغة JSON التالية (بدون markdown):
{
  "explanation": "شرح عربي مختصر لما قمت به",
  "files": [
    {"path": "مسار/الملف", "content": "محتوى الملف كاملاً", "language": "نوع اللغة"}
  ]
}

إذا كان الطلب نقاشاً فقط (بدون كود)، أعد:
{"explanation": "ردك هنا", "files": []}`;

// قائمة نماذج Gemini بالأولوية
const GEMINI_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash',
];

// ذاكرة مؤقتة للنموذج المستقر (Server-side only)
let stableModel: string | null = null;
const blacklist = new Set<string>();

async function callGemini(model: string, messages: any[]): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY_MISSING');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: AGENT_SYSTEM_PROMPT }] },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Gemini Error');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '{"explanation":"لم أتمكن من الرد.","files":[]}';
}

async function callGroq(messages: any[]): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY_MISSING');

  const groqMessages = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    })),
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Groq Error');
  return data.choices?.[0]?.message?.content || '{"explanation":"لم أتمكن من الرد.","files":[]}';
}

function parseAgentResponse(raw: string): { explanation: string; files: any[] } {
  try {
    const clean = raw.replace(/^```json\n?|^```\n?|\n?```$/gm, '').trim();
    const parsed = JSON.parse(clean);
    return {
      explanation: parsed.explanation || parsed.text || raw,
      files: Array.isArray(parsed.files) ? parsed.files : [],
    };
  } catch {
    // رد نصي بدون JSON مقبول، نعامله كمحادثة
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

    if (preferredAI === 'groq') {
      rawResponse = await callGroq(messages);
      engine = 'Groq Llama 3.3';
    } else if (!GEMINI_API_KEY) {
      rawResponse = await callGroq(messages);
      engine = 'Groq Llama 3.3';
    } else {
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
          } else {
            // خطأ غير معروف (كوتة مثلاً) → fallback إذا مفعّل
            if (autoFallback && GROQ_API_KEY) {
              rawResponse = await callGroq(messages);
              engine = 'Groq Llama 3.3 (Auto-Fallback)';
              break;
            }
            throw err;
          }
        }
      }

      if (!rawResponse) {
        if (autoFallback && GROQ_API_KEY) {
          rawResponse = await callGroq(messages);
          engine = 'Groq Llama 3.3 (Final Fallback)';
        } else {
          throw lastError || new Error('All Gemini models are unavailable');
        }
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
