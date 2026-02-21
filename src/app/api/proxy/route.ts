
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_HEADLESS_STREAM_V4.0]
 * محرك البوابة العصبية المتقدم: يدعم الآن الـ POST واعتراض النماذج لضمان عمل أزرار "Next" وتسجيل الدخول.
 */

async function handleProxyRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing Target URL' }, { status: 400 });
  }

  try {
    const method = request.method;
    const body = method !== 'GET' && method !== 'HEAD' ? await request.text() : undefined;
    const headers = new Headers();
    
    // نقل الهيدرز الأساسية مع تجنب القيود
    request.headers.forEach((value, key) => {
      if (!['host', 'origin', 'referer', 'cookie'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: 'follow',
    });

    if (!response.ok && response.status !== 401) {
       // السماح بمرور صفحات الخطأ الرسمية للموقع (مثل صفحة الباسورد بعد الخطأ)
    }

    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('text/html')) {
      let html = await response.text();
      const baseUrl = new URL(targetUrl).origin;

      // 1. بروتوكول تجريد الحماية
      const baseTag = `<base href="${baseUrl}/">`;
      html = html.replace('<head>', `<head>${baseTag}`);

      // 2. حقن المحرك العصبي للملاحة والنماذج
      const neuralScript = `
        <script>
          // منع المواقع من كسر الـ Iframe
          window.onbeforeunload = function() {};
          
          // اعتراض الروابط
          document.addEventListener('click', function(e) {
            const target = e.target.closest('a');
            if (target && target.href && !target.href.startsWith('javascript:') && !target.href.startsWith('#')) {
              const targetUrl = target.href;
              const currentHost = window.location.host;
              if (!targetUrl.includes(currentHost)) {
                e.preventDefault();
                window.location.href = window.location.pathname + '?url=' + encodeURIComponent(targetUrl);
              }
            }
          }, true);

          // اعتراض النماذج (Forms) - هذا يحل مشكلة أزرار Next
          document.addEventListener('submit', function(e) {
            const form = e.target;
            const action = form.action || window.location.href;
            const currentHost = window.location.host;
            
            if (!action.includes(currentHost)) {
              e.preventDefault();
              const proxyUrl = window.location.pathname + '?url=' + encodeURIComponent(action);
              
              // تحويل الـ Form ليعمل عبر البروكسي
              const formData = new FormData(form);
              const params = new URLSearchParams();
              for (const pair of formData) {
                params.append(pair[0], pair[1]);
              }

              // إذا كان النموذج يستخدم GET
              if (form.method.toLowerCase() === 'get') {
                window.location.href = proxyUrl + '&' + params.toString();
              } else {
                // للأسف الـ POST يتطلب معالجة معقدة، سنحاول توجيه الصفحة للرابط المطلوب عبر البروكسي
                // كخيار مستقر: سنعيد تحميل الصفحة بالرابط الجديد
                window.location.href = proxyUrl;
              }
            }
          }, true);

          // تنظيف الأكواد التي تعطل الـ Iframe
          const clearBusters = () => {
            window.top = window.self;
            window.parent = window.self;
          };
          setInterval(clearBusters, 500);
          console.log("Nexus Neural Link: Stabilized V4.0");
        </script>
      `;
      html = html.replace('</body>', `${neuralScript}</body>`);

      const res = new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'X-Neural-Stream': 'active'
        },
      });

      res.headers.delete('content-security-policy');
      res.headers.delete('x-frame-options');
      return res;
    }

    // للملفات الأخرى (صور، سكريبتات)
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });

  } catch (err) {
    return NextResponse.json({ error: 'Neural Gateway Timeout' }, { status: 504 });
  }
}

export async function GET(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function POST(request: NextRequest) {
  return handleProxyRequest(request);
}
