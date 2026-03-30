import { YoutubeTranscript } from 'youtube-transcript';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'edge';

const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const google = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
});

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { videoId, preferredAI = 'gemini' } = await req.json();

    if (!videoId) {
      return new Response(JSON.stringify({ error: 'Video ID is required' }), { status: 400 });
    }

    let transcriptData;
    let fallbackUsed = false;
    
    // 1. Try to fetch the transcript from YouTube
    try {
      transcriptData = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ar' });
    } catch (langErr) {
      try {
        transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
      } catch (err) {
        // Fallback needed - Video lacks captions or restricts extraction
        // In a real isolated processing server, we would download audio via ytdl-core and use STT.
        // For Edge limits, we return a failure to trigger client-side fallback/notification.
        return new Response(JSON.stringify({ 
          error: 'No transcript available.',
          needsFallback: true
        }), { status: 200 }); // Return 200 so frontend can handle it gracefully
      }
    }

    // Combine transcript pieces
    // Limit to ~20000 characters to prevent huge token limits edge timeouts just in case
    const fullText = transcriptData.map(t => t.text).join(' ').substring(0, 30000);

    const provider = preferredAI === 'groq' ? groq : google;
    const modelName = preferredAI === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-2.5-flash';

    const systemPrompt = `[STRICT_JSON_RESPONSE]
You are a highly capable content moderator and fact-checker for an Islamic/Educational video platform.
You will be provided with the text transcript of a YouTube video.

Your task:
1. Summarize the video in 1-2 Arabic sentences.
2. Identify ANY factual errors, contradictions, false historical claims, or violations of general safety in the text.
3. Provide a recommendation (advice) to the Admin on whether they should keep this video approved or withdraw it.

Return ONLY a standard exact JSON object with this exact structure:
{
  "status": "completed",
  "summary": "ملخص الفيديو...",
  "flags": ["الملاحظة الأولى إن وجدت", "الملاحظة الثانية"],
  "advice": "نصيحة للإدارة"
}
If no errors or flags exist, leave the "flags" array empty. Do not write markdown blocks (\`\`\`json). Just the raw JSON object.`;

    const { text } = await generateText({
      model: provider(modelName),
      system: systemPrompt,
      messages: [{ role: 'user', content: `TRANSCRIPT:\n\n${fullText}` }],
      temperature: 0.1,
    });

    let cleanJson = text.trim();
    if (cleanJson.startsWith('```json')) {
       cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanJson);
      parsedResult.fallbackUsed = fallbackUsed;
    } catch (e) {
      console.error("AI Evaluation Parse Error:", e);
      parsedResult = {
        status: 'completed',
        summary: "تم تحليل الفيديو لكن حدث خطأ في معالجة التنسيق من الذكاء الاصطناعي.",
        flags: [],
        advice: "يرجى المراجعة اليدوية بدقة.",
        fallbackUsed
      };
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[AI Review API Error]', err);
    return new Response(JSON.stringify({
      error: err.message || 'AI Review failed',
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
