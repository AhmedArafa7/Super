
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_PROXY_V31.0_SW_CORE]
 * محرك البوابة العصبية 3.0: التوقف عن تعديل الكود يدوياً والاعتماد على Service Worker.
 */

async function handleProxyRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing Target URL' }, { status: 400 });
  }

  try {
    const method = request.method;
    let body: any = undefined;
    
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          body = JSON.stringify(await request.json());
        } else if (contentType?.includes('form')) {
          body = await request.formData();
        } else {
          body = await request.text();
        }
      } catch (e) { body = undefined; }
    }

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      const forbiddenHeaders = ['host', 'origin', 'referer', 'connection', 'content-length', 'accept-encoding', 'content-security-policy'];
      if (!forbiddenHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: 'follow'
    });

    const contentType = response.headers.get('content-type') || '';
    
    // إذا كان المحتوى HTML، نقوم بحقن سكريبت تسجيل الـ Service Worker
    if (contentType.includes('text/html')) {
      let html = await response.text();
      const targetOrigin = new URL(targetUrl).origin;

      // سكريبت التهيئة وتسجيل الـ SW
      const bootScript = `
        <script>
          (function() {
            window.__NEXUS_TARGET_ORIGIN__ = "${targetOrigin}";
            
            // تسجيل الـ Service Worker على مستوى النطاق
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').then(reg => {
                console.log('🚀 Nexus Proxy SW: Registered', reg.scope);
                // إجبار الصفحة على التحديث إذا كان الـ SW جديداً لضمان السيطرة
                if (!navigator.serviceWorker.controller) {
                  window.location.reload();
                }
              }).catch(err => console.error('❌ Proxy SW Fail:', err));
            }

            // اختطاف الـ Location لضمان بقاء الروابط داخل الجسر
            const originalOpen = window.open;
            window.open = function(url, name, specs) {
              if (url && typeof url === 'string' && !url.startsWith(window.location.origin)) {
                url = '/api/proxy?url=' + encodeURIComponent(new URL(url, "${targetOrigin}").href);
              }
              return originalOpen.call(window, url, name, specs);
            };
          })();
        </script>
      `;

      // حقن الـ Base والـ BootScript
      html = html.replace('<head>', `<head><base href="${targetOrigin}/">${bootScript}`);

      const res = new NextResponse(html, {
        status: response.status,
        headers: { 
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
          'X-Frame-Options': 'ALLOWALL'
        },
      });

      // حذف قيود الحماية
      ['content-security-policy', 'x-frame-options', 'permissions-policy', 'x-content-type-options'].forEach(h => res.headers.delete(h));
      
      return res;
    }

    // للموارد الأخرى (JS, CSS, Images)
    const proxyRes = new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
    proxyRes.headers.set('Access-Control-Allow-Origin', '*');
    
    // تصحيح MIME type لملفات جوجل
    if (targetUrl.includes('.js') || targetUrl.includes('/js/')) {
      proxyRes.headers.set('Content-Type', 'application/javascript');
    }

    return proxyRes;

  } catch (err: any) {
    return NextResponse.json({ error: 'Neural Gateway Timeout' }, { status: 504 });
  }
}

export async function GET(request: NextRequest) { return handleProxyRequest(request); }
export async function POST(request: NextRequest) { return handleProxyRequest(request); }
