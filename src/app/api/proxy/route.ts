import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * [STABILITY_ANCHOR: NEURAL_PROXY_V34.0_FINAL]
 * محرك البوابة العصبية السيادي: الافتراضية الشاملة (Cookies + LocalStorage + SessionStorage).
 */

async function handleProxyRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing Target URL' }, { status: 400 });
  }

  // ══ Auth Bypass: NEVER proxy authentication URLs — redirect directly ══
  // This catches cases where window.open override or cached code routes
  // Firebase/Google auth popups through the proxy by mistake.
  const NEVER_PROXY_PATTERNS = [
    'firebaseapp.com/__/auth',
    'accounts.google.com',
    'googleapis.com/identitytoolkit',
    'securetoken.googleapis.com',
    'apis.google.com',
    'gstatic.com',
    'www.googleapis.com/oauth',
  ];
  const lowerUrl = targetUrl.toLowerCase();
  if (NEVER_PROXY_PATTERNS.some(pattern => lowerUrl.includes(pattern))) {
    // Redirect browser directly to the original URL — don't proxy it
    return NextResponse.redirect(targetUrl, 302);
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

      // سكريبت الافتراضية المزدوجة (Universal Isolation)
      const bootScript = `
        <script>
          (function() {
            window.__NEXUS_TARGET_ORIGIN__ = "${targetOrigin}";
            window.__NEXUS_ORIGIN__ = "${nexusOrigin}";
            
            // 1. الافتراضية الشاملة للتخزين (Virtual Storage Jar)
            const createVirtualStore = (type) => {
              const prefix = "__nexus_" + btoa(window.__NEXUS_TARGET_ORIGIN__).substring(0, 8) + "_";
              const realStore = window[type];
              return {
                getItem: (k) => realStore.getItem(prefix + k),
                setItem: (k, v) => realStore.setItem(prefix + k, v),
                removeItem: (k) => realStore.removeItem(prefix + k),
                clear: () => {
                  Object.keys(realStore).forEach(k => {
                    if (k.startsWith(prefix)) realStore.removeItem(k);
                  });
                },
                key: (i) => {
                  const keys = Object.keys(realStore).filter(k => k.startsWith(prefix));
                  return keys[i] ? keys[i].replace(prefix, '') : null;
                },
                get length() {
                  return Object.keys(realStore).filter(k => k.startsWith(prefix)).length;
                }
              };
            };

            // حقن المتاجر الافتراضية لحماية بيانات المستخدم وعزل الموقع
            const vLocal = createVirtualStore('localStorage');
            const vSession = createVirtualStore('sessionStorage');
            Object.defineProperty(window, 'localStorage', { get: () => vLocal });
            Object.defineProperty(window, 'sessionStorage', { get: () => vSession });

            // 2. اختطاف الكوكيز الافتراضية
            let virtualCookies = document.cookie;
            Object.defineProperty(document, 'cookie', {
              get: () => virtualCookies,
              set: (val) => {
                virtualCookies = val;
                if (navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({ type: 'UPDATE_COOKIES', cookies: val });
                }
              }
            });

            // 3. اختطاف مسجل الخدمة (حظر أي SW من المواقع المُحمّلة عبر البروكسي)
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register = function(url, options) {
                console.log('🛡️ Nexus Guard: Blocked proxied SW registration:', url);
                return Promise.resolve({ scope: '/', active: null, installing: null, waiting: null });
              };
            }

            // 5. اختطاف الملاحة لضمان البقاء داخل نكسوس
            const originalOpen = window.open;
            window.open = function(url, name, specs) {
              if (url && typeof url === 'string' && !url.startsWith(window.location.origin)) {
                url = window.location.origin + '/api/proxy?url=' + encodeURIComponent(new URL(url, window.__NEXUS_TARGET_ORIGIN__).href);
              }
              return originalOpen.call(window, url, name, specs);
            };
          })();
        </script>
      `;

      // حقن السكريبت في البداية لضمان السيطرة قبل تحميل أي ملفات JS أخرى
      html = html.replace('<head>', `<head><base href="${targetOrigin}/">${bootScript}`);

      const res = new NextResponse(html, {
        status: response.status,
        headers: { 
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
          'X-Frame-Options': 'ALLOWALL'
        },
      });

      // تنقية الكوكيز السيرفرية وتجاوز قيود النطاق
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
    
    return proxyRes;

  } catch (err: any) {
    return NextResponse.json({ error: 'Neural Gateway Timeout' }, { status: 504 });
  }
}

export async function GET(request: NextRequest) { return handleProxyRequest(request); }
export async function POST(request: NextRequest) { return handleProxyRequest(request); }
