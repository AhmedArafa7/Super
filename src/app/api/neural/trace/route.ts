import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      has_google_key: !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_DRIVE_API_KEY),
      has_groq_key: !!(process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY),
      runtime: typeof (globalThis as any).EdgeRuntime !== 'undefined' ? 'edge' : 'nodejs',
      node_version: process.version,
    },
    headers: {
      // Useful for debugging Cloudflare routing
      host: process.env.HTTP_HOST || 'unknown',
    },
    env_keys_present: Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('API')).map(k => k.replace(/./g, (c, i) => i < 3 ? c : '*'))
  };

  return NextResponse.json({
    status: 'online',
    message: 'Neural Diagnostic Trace Active',
    diagnostics
  });
}
