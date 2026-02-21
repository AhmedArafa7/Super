
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_HIJACK_STREAM_V7.0_FINAL]
 * المحرك السيادي المطور: الاستحواذ الكامل على طلبات الشبكة ومزامنة الكوكيز.
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
    
    // 1. نقل الرؤوس الأساسية والكوكيز
    request.headers.forEach((value, key) => {
      const forbiddenHeaders = ['host', 'origin', 'referer', 'connection', 'content-length', 'accept-encoding'];
      if (!forbiddenHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); 

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

        // 2. حقن بروتوكول الاستحواذ الشامل
        const baseTag = `<base href="${targetOrigin}/">`;
        const neuralScript = `
          <script>
            (function() {
              console.log("🚀 Nexus Hijack Protocol: Active");
              const proxyPath = window.location.pathname;

              const getProxyUrl = (url) => {
                if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
                try {
                  const absoluteUrl = new URL(url, "${targetOrigin}").href;
                  if (absoluteUrl.includes(window.location.host)) return url;
                  return proxyPath + '?url=' + encodeURIComponent(absoluteUrl);
                } catch(e) { return url; }
              };

              // اعتراض FETCH
              const originalFetch = window.fetch;
              window.fetch = function(input, init) {
                const url = typeof input === 'string' ? input : input.url;
                const newUrl = getProxyUrl(url);
                return originalFetch(newUrl, init);
              };

              // اعتراض XHR
              const originalOpen = XMLHttpRequest.prototype.open;
              XMLHttpRequest.prototype.open = function(method, url) {
                const newUrl = getProxyUrl(url);
                return originalOpen.apply(this, [method, newUrl, ...Array.from(arguments).slice(2)]);
              };

              // اعتراض الضغط على الروابط
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

              // اعتراض إرسال النماذج (حل مشكلة أزرار Next)
              document.addEventListener('submit', function(e) {
                const form = e.target;
                e.preventDefault();
                const actionUrl = getProxyUrl(form.action || window.location.href);
                
                const formData = new FormData(form);
                const xhr = new XMLHttpRequest();
                xhr.open(form.method || 'POST', actionUrl);
                xhr.onload = () => {
                  document.open();
                  document.write(xhr.responseText);
                  document.close();
                };
                xhr.send(formData);
              }, true);

              // منع كسر الإطار (Anti-Frame Busting)
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
          headers: { 'Content-Type': 'text/html', 'X-Neural-Hijack': 'active' },
        });

        // مزامنة الكوكيز مع المتصفح
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) res.headers.set('set-cookie', setCookie);
        
        return res;
      }

      // الموارد الأخرى (JS, CSS, Images)
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
