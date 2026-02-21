
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_PROXY_V32.0_SOVEREIGN]
 * محرك البوابة العصبية السيادي: تطبيق الافتراضية المزدوجة وتطهير الكوكيز.
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
    
    if (contentType.includes('text/html')) {
      let html = await response.text();
      const targetOrigin = new URL(targetUrl).origin;
      const nexusOrigin = request.nextUrl.origin;

      // سكريبت الافتراضية المزدوجة: اختطاف الـ SW ومنع الموقع الأصلي من تسجيل عامله
      const bootScript = `
        <script>
          (function() {
            window.__NEXUS_TARGET_ORIGIN__ = "${targetOrigin}";
            window.__NEXUS_ORIGIN__ = "${nexusOrigin}";
            
            // 1. اختطاف محرك تسجيل الـ Service Worker (Double Virtualization)
            const originalRegister = navigator.serviceWorker.register;
            navigator.serviceWorker.register = function(url, options) {
              console.log('🛡️ Nexus Guard: Blocked external SW registration attempt for:', url);
              return Promise.reject(new Error("External SW registration disabled in Nexus Sandbox"));
            };

            // 2. تسجيل الـ SW الخاص بنكسوس من النطاق الصحيح
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register(window.__NEXUS_ORIGIN__ + '/sw.js', { scope: '/' }).then(reg => {
                console.log('🚀 Nexus Sovereign SW: Registered successfully');
                if (!navigator.serviceWorker.controller) {
                  window.location.reload();
                }
              }).catch(err => console.error('❌ Sovereign SW Fail:', err));
            }

            // 3. اختطاف الـ Fetch و XHR لضمان المسار العصبي
            const originalOpen = window.open;
            window.open = function(url, name, specs) {
              if (url && typeof url === 'string' && !url.startsWith(window.location.origin)) {
                url = window.__NEXUS_ORIGIN__ + '/api/proxy?url=' + encodeURIComponent(new URL(url, "${targetOrigin}").href);
              }
              return originalOpen.call(window, url, name, specs);
            };
          })();
        </script>
      `;

      html = html.replace('<head>', `<head><base href="${targetOrigin}/">${bootScript}`);

      const res = new NextResponse(html, {
        status: response.status,
        headers: { 
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
          'X-Frame-Options': 'ALLOWALL'
        },
      });

      // تطهير الكوكيز السيادي: إزالة قيود الـ Domain و SameSite
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          const cleanCookie = value
            .replace(/Domain=[^;]+;?/gi, '')
            .replace(/SameSite=[^;]+;?/gi, 'SameSite=Lax')
            .replace(/Secure;?/gi, '');
          res.headers.append('Set-Cookie', cleanCookie);
        }
      });

      // حذف قيود الحماية
      ['content-security-policy', 'x-frame-options', 'permissions-policy', 'x-content-type-options', 'cross-origin-opener-policy'].forEach(h => res.headers.delete(h));
      
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
