
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_HIJACK_ULTIMATE_V26.0]
 * محرك البث العصبي المطور: الاستحواذ الشامل على الملاحة، التاريخ، وطلبات الشبكة.
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
    
    // 1. نقل الرؤوس الأساسية والكوكيز مع استبعاد العوائق
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

        // 2. حقن بروتوكول الاستحواذ الشامل (The Deep Interceptor V2)
        const baseTag = `<base href="${targetOrigin}/">`;
        const neuralScript = `
          <script>
            (function() {
              console.log("🚀 Nexus Deep Interceptor V2: ACTIVATED");
              const proxyPath = window.location.pathname;

              const getProxyUrl = (url) => {
                if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:')) return url;
                try {
                  const absoluteUrl = new URL(url, "${targetOrigin}").href;
                  if (absoluteUrl.startsWith(window.location.origin + proxyPath)) return url;
                  return proxyPath + '?url=' + encodeURIComponent(absoluteUrl);
                } catch(e) { return url; }
              };

              // 📡 اختطاف FETCH
              const originalFetch = window.fetch;
              window.fetch = function(input, init) {
                let url = typeof input === 'string' ? input : (input.url || input);
                const newUrl = getProxyUrl(url);
                if (typeof input === 'string') return originalFetch(newUrl, init);
                return originalFetch(new Request(newUrl, input), init);
              };

              // 📡 اختطاف XHR
              const originalOpen = XMLHttpRequest.prototype.open;
              XMLHttpRequest.prototype.open = function(method, url) {
                const newUrl = getProxyUrl(url);
                return originalOpen.apply(this, [method, newUrl, ...Array.from(arguments).slice(2)]);
              };

              // 📡 اختطاف التاريخ والملاحة (History API)
              const originalPushState = history.pushState;
              window.history.pushState = function(state, title, url) {
                return originalPushState.apply(this, [state, title, getProxyUrl(url)]);
              };
              const originalReplaceState = history.replaceState;
              window.history.replaceState = function(state, title, url) {
                return originalReplaceState.apply(this, [state, title, getProxyUrl(url)]);
              };

              // 📡 اختطاف النماذج (Forms)
              document.addEventListener('submit', function(e) {
                const form = e.target;
                const originalAction = form.action || window.location.href;
                form.action = getProxyUrl(originalAction);
              }, true);

              // 📡 اختطاف النقرات والأزرار (Global Link Hijack)
              document.addEventListener('click', function(e) {
                const target = e.target.closest('a');
                if (target && target.href && !target.href.startsWith('javascript:') && !target.href.startsWith('#')) {
                  const newUrl = getProxyUrl(target.href);
                  if (newUrl !== target.href) {
                    e.preventDefault();
                    window.location.href = newUrl;
                  }
                }
              }, true);

              // 📡 منع كسر الإطار (Anti-Frame Busting)
              window.onbeforeunload = function() { return null; };
              setInterval(() => {
                if (window.top !== window.self) {
                  try { window.top = window.self; } catch(e) {}
                }
              }, 500);
            })();
          </script>
        `;

        html = html.replace('<head>', `<head>${baseTag}`);
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
