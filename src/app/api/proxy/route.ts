
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_HEADLESS_STREAM_V6.0_FINAL]
 * المحرك السيادي المطور: الاستحواذ الكامل على طلبات الشبكة (fetch/XHR) لضمان عمل كافة المواقع.
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
    
    // 1. تنقية الرؤوس لضمان عدم كشف "الجسر"
    request.headers.forEach((value, key) => {
      const forbiddenHeaders = ['host', 'origin', 'referer', 'cookie', 'connection', 'content-length', 'accept-encoding', 'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site'];
      if (!forbiddenHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); 

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

        // 2. حقن بروتوكول الاستحواذ الشامل
        const baseTag = `<base href="${baseUrl}/">`;
        const neuralScript = `
          <script>
            (function() {
              console.log("🚀 Nexus Neural Engine: Full Hijack Protocol Active");
              const proxyPath = window.location.pathname;

              const getProxyUrl = (url) => {
                if (!url) return url;
                if (url.startsWith('data:') || url.startsWith('blob:')) return url;
                try {
                  const absoluteUrl = new URL(url, "${baseUrl}").href;
                  if (absoluteUrl.includes(window.location.host)) return url;
                  return proxyPath + '?url=' + encodeURIComponent(absoluteUrl);
                } catch(e) { return url; }
              };

              // A. الاستحواذ على FETCH
              const originalFetch = window.fetch;
              window.fetch = function(input, init) {
                const url = typeof input === 'string' ? input : input.url;
                console.log("📡 Intercepted Fetch:", url);
                const newUrl = getProxyUrl(url);
                return originalFetch(newUrl, init);
              };

              // B. الاستحواذ على XMLHttpRequest (للأزرار القديمة)
              const originalOpen = XMLHttpRequest.prototype.open;
              XMLHttpRequest.prototype.open = function(method, url) {
                console.log("📡 Intercepted XHR:", url);
                const newUrl = getProxyUrl(url);
                return originalOpen.apply(this, [method, newUrl, ...Array.from(arguments).slice(2)]);
              };

              // C. اعتراض الروابط والـ Forms
              document.addEventListener('click', function(e) {
                const target = e.target.closest('a');
                if (target && target.href && !target.href.startsWith('javascript:') && !target.href.startsWith('#')) {
                  e.preventDefault();
                  window.location.href = getProxyUrl(target.href);
                }
              }, true);

              document.addEventListener('submit', function(e) {
                const form = e.target;
                e.preventDefault();
                console.log("📩 Intercepted Form Submit:", form.action);
                const actionUrl = getProxyUrl(form.action || window.location.href);
                
                if (form.method.toLowerCase() === 'get') {
                  const params = new URLSearchParams(new FormData(form)).toString();
                  window.location.href = actionUrl + (actionUrl.includes('?') ? '&' : '?') + params;
                } else {
                  // محاكاة إرسال POST عبر البروكسي
                  const formData = new FormData(form);
                  const xhr = new XMLHttpRequest();
                  xhr.open('POST', actionUrl);
                  xhr.onload = () => { document.open(); document.write(xhr.responseText); document.close(); };
                  xhr.send(formData);
                }
              }, true);

              // D. تنظيف معطلات الـ Iframe
              setInterval(() => {
                try { window.top = window.self; window.parent = window.self; } catch(e) {}
              }, 500);
            })();
          </script>
        `;

        html = html.replace('<head>', `<head>${baseTag}`);
        html = html.replace('</body>', `${neuralScript}</body>`);

        const res = new NextResponse(html, {
          headers: { 'Content-Type': 'text/html', 'X-Neural-Stream': 'active' },
        });

        // 3. تجريد كافة قيود الأمان
        const securityHeaders = ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'x-xss-protection', 'frame-ancestors'];
        securityHeaders.forEach(h => res.headers.delete(h));
        
        return res;
      }

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

export async function GET(request: NextRequest) { return handleProxyRequest(request); }
export async function POST(request: NextRequest) { return handleProxyRequest(request); }
