
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_HEADLESS_STREAM_V3.0]
 * محرك البوابة العصبية المتقدم: يقوم بجلب المواقع وتجريدها من قيود الأمان (Headers Stripping)
 * لضمان فتح أي موقع داخل نكسوس بغض النظر عن سياسات X-Frame.
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
      },
    });

    if (!response.ok) throw new Error('Target Unreachable');

    let html = await response.text();
    const baseUrl = new URL(targetUrl).origin;

    // 1. بروتوكول تجريد الحماية (Headers Stripping & URL Rewriting)
    // حقن وسوم Base لضمان تحميل الصور والملفات من المصدر الأصلي
    const baseTag = `<base href="${baseUrl}/">`;
    html = html.replace('<head>', `<head>${baseTag}`);

    // 2. حقن "المحرك العصبي" لإجبار الروابط على البقاء داخل البروكسي
    const neuralScript = `
      <script>
        // منع المواقع من كسر الـ Iframe (Anti Frame-Busting)
        window.onbeforeunload = function() {};
        
        document.addEventListener('click', function(e) {
          const target = e.target.closest('a');
          if (target && target.href && !target.href.startsWith('javascript:') && !target.href.startsWith('#')) {
            // منع الخروج من نكسوس وإعادة التوجيه عبر البروكسي
            const targetUrl = target.href;
            const currentHost = window.location.host;
            
            if (!targetUrl.includes(currentHost)) {
              e.preventDefault();
              window.location.href = window.location.pathname + '?url=' + encodeURIComponent(targetUrl);
            }
          }
        }, true);

        // محاكاة استقرار المتصفح
        console.log("Nexus Neural Link: Stabilized");
      </script>
    `;
    html = html.replace('</body>', `${neuralScript}</body>`);

    // 3. تنظيف الأكواد التي قد تعطل الـ Iframe (Frame Busting scripts)
    html = html.replace(/if\s*\(window\.top\s*!==\s*window\.self\)/gi, 'if(false)');
    html = html.replace(/window\.top\.location\s*=/gi, 'window.self.location =');

    // إنشاء الاستجابة مع حذف الـ Headers التي تحظر الـ Iframe
    const res = new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        'X-Neural-Stream': 'active'
      },
    });

    // حذف قيود الحماية من الاستجابة النهائية بشكل كامل
    res.headers.delete('content-security-policy');
    res.headers.delete('x-frame-options');
    res.headers.delete('frame-options');
    res.headers.delete('x-content-type-options');

    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Neural Gateway Timeout' }, { status: 504 });
  }
}
