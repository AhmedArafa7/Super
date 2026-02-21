
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_PROXY_V33.0_FINAL]
 * محرك البوابة العصبية السيادي: تطبيق الافتراضية المزدوجة وجرة الكوكيز.
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

      // سكريبت الافتراضية المزدوجة وجرة الكوكيز
      const bootScript = `
        <script>
          (function() {
            window.__NEXUS_TARGET_ORIGIN__ = "${targetOrigin}";
            window.__NEXUS_ORIGIN__ = "${nexusOrigin}";
            
            // 1. اختطاف محرك تسجيل الـ Service Worker (Double Virtualization)
            const originalRegister = navigator.serviceWorker.register;
            navigator.serviceWorker.register = function(url, options) {
              // إذا كان الرابط لا يبدأ بنطاق نكسوس، فهو محاولة من الموقع الأصلي ويجب حظرها
              if (url && !url.toString().includes(window.__NEXUS_ORIGIN__)) {
                console.log('🛡️ Nexus Guard: Blocked external SW registration attempt for:', url);
                return Promise.reject(new Error("External SW registration disabled in Nexus Sandbox"));
              }
              return originalRegister.apply(navigator.serviceWorker, arguments);
            };

            // 2. إدارة الكوكيز الافتراضية (Virtual Cookie Jar)
            let virtualCookies = document.cookie;
            Object.defineProperty(document, 'cookie', {
              get: () => virtualCookies,
              set: (val) => {
                virtualCookies = val;
                // إبلاغ الـ SW بتحديث الكوكيز
                if (navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({ type: 'UPDATE_COOKIES', cookies: val });
                }
              }
            });

            // 3. تسجيل الـ SW الخاص بنكسوس باستخدام المحرك الأصلي المخفي
            if ('serviceWorker' in navigator) {
              originalRegister.call(navigator.serviceWorker, window.__NEXUS_ORIGIN__ + '/sw.js', { scope: '/' }).then(reg => {
                console.log('🚀 Nexus Sovereign SW: Registered successfully');
                // تفعيل المزامنة الفورية للـ Origin
                if (reg.active) {
                  reg.active.postMessage({ type: 'SET_TARGET', origin: "${targetOrigin}" });
                }
                if (!navigator.serviceWorker.controller) {
                  window.location.reload(); // إعادة تحميل واحدة لفرض السيطرة
                }
              }).catch(err => console.error('❌ Sovereign SW Fail:', err));
            }

            // 4. اختطاف الملاحة لضمان المسار العصبي
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

      // تطهير الكوكيز السيادي
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          const cleanCookie = value
            .replace(/Domain=[^;]+;?/gi, '')
            .replace(/SameSite=[^;]+;?/gi, 'SameSite=Lax')
            .replace(/Secure;?/gi, '');
          res.headers.append('Set-Cookie', cleanCookie);
        }
      });

      ['content-security-policy', 'x-frame-options', 'permissions-policy', 'x-content-type-options', 'cross-origin-opener-policy'].forEach(h => res.headers.delete(h));
      
      return res;
    }

    const proxyRes = new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
    proxyRes.headers.set('Access-Control-Allow-Origin', '*');
    
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
