import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      is_edge: typeof (globalThis as any).EdgeRuntime !== 'undefined',
      node_version: process.version,
    },
    ai_status: {
      has_google_genai_key: !!process.env.GOOGLE_GENAI_API_KEY,
      has_gemini_key: !!process.env.GEMINI_API_KEY,
      has_groq_key: !!(process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY),
      active_google_key_source: process.env.GOOGLE_GENAI_API_KEY ? 'GOOGLE_GENAI_API_KEY' : (process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'DRIVE_FALLBACK'),
    },
    drive_status: {
      has_public_drive_key: !!process.env.NEXT_PUBLIC_DRIVE_API_KEY,
    },
    env_keys_present: Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('API')).map(k => k.replace(/./g, (c, i) => i < 3 ? c : '*'))
  };

  return NextResponse.json({
    status: 'online',
    message: 'Neural Diagnostic Trace Active',
    diagnostics
  });
}
