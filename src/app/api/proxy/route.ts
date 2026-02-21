
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_HIJACK_NUCLEAR_V27.0]
 * محرك الاستحواذ النووي: إعادة كتابة المحتوى من جهة السيرفر واختطاف شامل للملاحة والأحداث.
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
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = JSON.stringify(await request.json());
      } else {
        body = await request.text();
      }
    }

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      const forbiddenHeaders = ['host', 'origin', 'referer', 'connection', 'content-length', 'accept-encoding', 'content-security-policy'];
      if (!forbiddenHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); 

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
        const targetOrigin = new URL(targetUrl).origin;
        const proxyPath = request.nextUrl.pathname;

        // 1. إعادة كتابة الروابط من جهة السيرفر (Server-Side URL Rewriting)
        // هذا يضمن أن حتى الروابط التي لا يلتقطها الـ JS تمر عبر البروكسي
        const rewriteUrl = (url: string) => {
          if (!url || url.startsWith('data:') || url.startsWith('#') || url.startsWith('javascript:')) return url;
          try {
            const absolute = new URL(url, targetOrigin).href;
            return `${proxyPath}?url=${encodeURIComponent(absolute)}`;
          } catch(e) { return url; }
        };

        // حقن بروتوكول الاستحواذ النووي في الـ HTML
        const neuralScript = `
          <script>
            (function() {
              console.log("🚀 Nexus Nuclear Interceptor V27: ACTIVATED");
              const proxyPath = "${proxyPath}";
              const targetOrigin = "${targetOrigin}";

              const getProxyUrl = (url) => {
                if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:') || url.startsWith('#')) return url;
                try {
                  const absoluteUrl = new URL(url, targetOrigin).href;
                  if (absoluteUrl.startsWith(window.location.origin + proxyPath)) return url;
                  return proxyPath + '?url=' + encodeURIComponent(absoluteUrl);
                } catch(e) { return url; }
              };

              // 📡 اختطاف FETCH & XHR
              const originalFetch = window.fetch;
              window.fetch = function(input, init) {
                let url = typeof input === 'string' ? input : (input.url || input);
                return originalFetch(getProxyUrl(url), init);
              };

              const originalOpen = XMLHttpRequest.prototype.open;
              XMLHttpRequest.prototype.open = function(method, url) {
                return originalOpen.apply(this, [method, getProxyUrl(url), ...Array.from(arguments).slice(2)]);
              };

              // 📡 اختطاف النوافذ المنبثقة (Popups)
              const originalOpenWin = window.open;
              window.open = function(url, name, specs) {
                return originalOpenWin(getProxyUrl(url), name, specs);
              };

              // 📡 اختطاف التاريخ والملاحة
              const originalPushState = history.pushState;
              window.history.pushState = function(state, title, url) {
                return originalPushState.apply(this, [state, title, getProxyUrl(url)]);
              };

              // 📡 اختطاف كافة النقرات في مرحلة الـ Capture (لحل مشكلة الأزرار)
              document.addEventListener('click', function(e) {
                const target = e.target.closest('a, button, [role="button"]');
                if (target) {
                  console.log("📡 Intercepted Click on:", target);
                  // إذا كان عنصراً يحمل رابطاً صريحاً
                  if (target.tagName === 'A' && target.href) {
                    const newUrl = getProxyUrl(target.href);
                    if (newUrl !== target.href) {
                      e.preventDefault();
                      window.location.href = newUrl;
                    }
                  }
                }
              }, true);

              // 📡 مراقب التغييرات الديناميكية لإصلاح النماذج
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'FORM') {
                      node.action = getProxyUrl(node.action);
                    }
                  });
                });
              });
              observer.observe(document.body, { childList: true, subtree: true });

              // منع محاولات الهروب من الإطار
              window.onbeforeunload = function() { return null; };
            })();
          </script>
        `;

        // تنظيف الـ HTML وحقن السكريبتات والـ Base
        html = html.replace('<head>', `<head><base href="${targetOrigin}/">`);
        html = html.replace('</body>', `${neuralScript}</body>`);

        const res = new NextResponse(html, {
          status: response.status,
          headers: { 
            'Content-Type': 'text/html',
            'X-Frame-Options': 'ALLOWALL',
            'Access-Control-Allow-Origin': '*',
            'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';"
          },
        });

        // مسح كافة رؤوس الأمان التي تسبب Refused to connect
        const securityHeaders = [
          'content-security-policy', 'x-frame-options', 'x-content-type-options', 
          'x-xss-protection', 'permissions-policy', 'cross-origin-opener-policy',
          'cross-origin-embedder-policy', 'cross-origin-resource-policy'
        ];
        
        securityHeaders.forEach(h => res.headers.delete(h));

        const setCookie = response.headers.get('set-cookie');
        if (setCookie) res.headers.set('set-cookie', setCookie);
        
        return res;
      }

      return new NextResponse(response.body, {
        status: response.status,
        headers: response.headers,
      });

    } catch (fetchErr: any) {
      return NextResponse.json({ error: 'Neural Link Timeout' }, { status: 504 });
    }

  } catch (err: any) {
    return NextResponse.json({ error: 'Neural Gateway Disturbance' }, { status: 502 });
  }
}

export async function GET(request: NextRequest) { return handleProxyRequest(request); }
export async function POST(request: NextRequest) { return handleProxyRequest(request); }
