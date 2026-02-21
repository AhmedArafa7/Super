
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_HEADLESS_STREAM_V5.0]
 * محرك البوابة العصبية المتقدم: تم تحصين الاتصال ضد أخطاء Timeout وتحسين تنقية الهيدرز.
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
    
    // 1. بروتوكول تنقية الرؤوس لضمان استقرار الاتصال
    request.headers.forEach((value, key) => {
      const forbiddenHeaders = ['host', 'origin', 'referer', 'cookie', 'connection', 'content-length', 'accept-encoding'];
      if (!forbiddenHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 2. التحكم في وقت الاستجابة (Timeout) لمنع تعليق السيرفر
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout

    try {
      const response = await fetch(targetUrl, {
        method,
        headers,
        body,
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('text/html')) {
        let html = await response.text();
        const baseUrl = new URL(targetUrl).origin;

        // 3. بروتوكول تجريد الحماية وإعادة صياغة المسارات
        const baseTag = `<base href="${baseUrl}/">`;
        html = html.replace('<head>', `<head>${baseTag}`);

        // 4. حقن المحرك العصبي للملاحة والنماذج
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

            // اعتراض النماذج (Forms)
            document.addEventListener('submit', function(e) {
              const form = e.target;
              const action = form.action || window.location.href;
              const currentHost = window.location.host;
              
              if (!action.includes(currentHost)) {
                e.preventDefault();
                const proxyUrl = window.location.pathname + '?url=' + encodeURIComponent(action);
                
                if (form.method.toLowerCase() === 'get') {
                  const formData = new FormData(form);
                  const params = new URLSearchParams();
                  for (const pair of formData) {
                    params.append(pair[0], pair[1]);
                  }
                  window.location.href = proxyUrl + '&' + params.toString();
                } else {
                  // في حالة الـ POST، نوجه المستخدم للرابط المطلوب عبر البروكسي
                  window.location.href = proxyUrl;
                }
              }
            }, true);

            // تنظيف الأكواد التي تعطل الـ Iframe
            const clearBusters = () => {
              try {
                window.top = window.self;
                window.parent = window.self;
              } catch(e) {}
            };
            setInterval(clearBusters, 500);
            console.log("Nexus Neural Link: Stabilized V5.0");
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

    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        return NextResponse.json({ error: 'Neural Gateway Timeout (Target unreachable)' }, { status: 504 });
      }
      throw fetchErr;
    }

  } catch (err: any) {
    console.error("Proxy Failure:", err);
    return NextResponse.json({ error: 'Neural Gateway Disturbance', detail: err.message }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function POST(request: NextRequest) {
  return handleProxyRequest(request);
}
