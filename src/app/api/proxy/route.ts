
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_HIJACK_NUCLEAR_V28.0]
 * محرك الاستحواذ النووي المطور: يدعم سجل أخطاء البروكسي وإعادة الكتابة الذكية.
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
      const proxyPath = request.nextUrl.pathname;

      // حقن سكريبت المراقبة والتشخيص (The Spy Client)
      const spyScript = `
        <script>
          (function() {
            const PROXY_PATH = "${proxyPath}";
            const TARGET_ORIGIN = "${targetOrigin}";

            const getProxyUrl = (url) => {
              if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:') || url.startsWith('#')) return url;
              try {
                const absoluteUrl = new URL(url, TARGET_ORIGIN).href;
                if (absoluteUrl.startsWith(window.location.origin + PROXY_PATH)) return url;
                return PROXY_PATH + '?url=' + encodeURIComponent(absoluteUrl);
              } catch(e) { return url; }
            };

            const logError = (data) => {
              fetch('/api/proxy/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, sourceUrl: window.location.href, targetOrigin: TARGET_ORIGIN })
              }).catch(() => {});
            };

            // 📡 اختطاف FETCH مع تسجيل الأخطاء
            const originalFetch = window.fetch;
            window.fetch = function(input, init) {
              let url = typeof input === 'string' ? input : (input.url || input);
              const proxiedUrl = getProxyUrl(url);
              console.log("📡 Proxy Fetch:", url);
              return originalFetch(proxiedUrl, init).catch(err => {
                logError({ type: 'fetch_failed', failedUrl: url, error: err.message });
                throw err;
              });
            };

            // 📡 اختطاف XHR
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
              const proxiedUrl = getProxyUrl(url);
              this._targetUrl = url;
              return originalOpen.apply(this, [method, proxiedUrl, ...Array.from(arguments).slice(2)]);
            };

            // 📡 اختطاف الملاحة والتاريخ
            const originalPushState = history.pushState;
            window.history.pushState = function(state, title, url) {
              return originalPushState.apply(this, [state, title, getProxyUrl(url)]);
            };

            // 📡 اختطاف الروابط الديناميكية (Attribute Observer)
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                  if (node.tagName === 'A') node.href = getProxyUrl(node.href);
                  if (node.tagName === 'FORM') node.action = getProxyUrl(node.action);
                });
              });
            });
            observer.observe(document.body, { childList: true, subtree: true });

            // 📡 اعتراض النقرات الشامل
            document.addEventListener('click', function(e) {
              const target = e.target.closest('a, button, [role="button"]');
              if (target && target.tagName === 'A' && target.href) {
                const newUrl = getProxyUrl(target.href);
                if (newUrl !== target.href) {
                  e.preventDefault();
                  window.location.href = newUrl;
                }
              }
            }, true);

            console.log("🚀 Nexus Spy Client V28: ACTIVE");
          })();
        </script>
      `;

      html = html.replace('<head>', `<head><base href="${targetOrigin}/">`);
      html = html.replace('</body>', `${spyScript}</body>`);

      const res = new NextResponse(html, {
        status: response.status,
        headers: { 
          'Content-Type': 'text/html',
          'X-Frame-Options': 'ALLOWALL',
          'Access-Control-Allow-Origin': '*',
        },
      });

      const securityHeaders = ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'permissions-policy'];
      securityHeaders.forEach(h => res.headers.delete(h));
      
      return res;
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Neural Gateway Disturbance' }, { status: 502 });
  }
}

export async function GET(request: NextRequest) { return handleProxyRequest(request); }
export async function POST(request: NextRequest) { return handleProxyRequest(request); }
