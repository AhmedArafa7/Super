
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_GATEWAY_PROXY_V1.0]
 * محرك البوابة العصبية (Method 1): يقوم بجلب المواقع الخارجية وضغطها لخدمة المستخدمين بإنترنت ضعيف.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing Target URL' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexusAI-Neural-Gateway/1.0',
      },
    });

    if (!response.ok) throw new Error('Target Unreachable');

    let html = await response.text();

    // بروتوكول الضغط والتنقية:
    // 1. حذف الإعلانات الثقيلة (Simple Regex)
    html = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, (match) => {
      if (match.includes('adsbygoogle') || match.includes('analytics')) return '<!-- Optimized by Nexus -->';
      return match;
    });

    // 2. معالجة الروابط لتعمل داخل البوابة (Rewrite Links)
    // ملاحظة: هذه معالجة بسيطة، المواقع المعقدة تحتاج موازن روابط متطور
    const baseUrl = new URL(targetUrl).origin;
    html = html.replace(/(href|src)="(\/|#)([^"]*)"/g, `$1="${baseUrl}/$3"`);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
        'X-Neural-Optimized': 'true'
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Neural Gateway Timeout' }, { status: 504 });
  }
}
