
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_HIJACK_NUCLEAR_V29.0]
 * محرك الاستحواذ النووي المطور: إعادة كتابة شاملة للمحتوى لكسر حظر CORS وتفعيل الأزرار.
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

      // وظيفة مساعدة لتحويل الروابط داخل الـ HTML
      const getProxyUrl = (url: string) => {
        if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:') || url.startsWith('#')) return url;
        try {
          const absoluteUrl = new URL(url, targetUrl).href;
          return `${proxyPath}?url=${encodeURIComponent(absoluteUrl)}`;
        } catch(e) { return url; }
      };

      // إعادة كتابة الروابط في الـ HTML (Scripts, Links, Images, Forms)
      html = html.replace(/(src|href|action|data-src)=["'](.*?)["']/gi, (match, attr, url) => {
        return `${attr}="${getProxyUrl(url)}"`;
      });

      // حقن سكريبت المراقبة والتشخيص المطور (The Spy Client V29)
      const spyScript = `
        <script>
          (function() {
            const PROXY_PATH = "${proxyPath}";
            const TARGET_ORIGIN = "${targetOrigin}";

            const getProxyUrl = (url) => {
              if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:') || url.startsWith('#')) return url;
              try {
                const absoluteUrl = new URL(url, window.location.href).href;
                if (absoluteUrl.includes(PROXY_PATH + '?url=')) return url;
                return PROXY_PATH + '?url=' + encodeURIComponent(absoluteUrl);
              } catch(e) { return url; }
            };

            // 📡 اختطاف إنشاء العناصر (لحل مشكلة gstatic)
            const originalCreateElement = document.createElement;
            document.createElement = function(tagName) {
              const el = originalCreateElement.apply(this, arguments);
              if (tagName.toLowerCase() === 'script' || tagName.toLowerCase() === 'link' || tagName.toLowerCase() === 'img') {
                const originalSetAttribute = el.setAttribute;
                el.setAttribute = function(name, value) {
                  if (name === 'src' || name === 'href') {
                    value = getProxyUrl(value);
                  }
                  return originalSetAttribute.apply(this, [name, value]);
                };
                Object.defineProperty(el, 'src', {
                  set: function(val) { el.setAttribute('src', val); },
                  get: function() { return el.getAttribute('src'); }
                });
              }
              return el;
            };

            // 📡 اختطاف FETCH و XHR
            const originalFetch = window.fetch;
            window.fetch = function(input, init) {
              let url = typeof input === 'string' ? input : (input.url || input);
              return originalFetch(getProxyUrl(url), init);
            };

            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
              return originalOpen.apply(this, [method, getProxyUrl(url), ...Array.from(arguments).slice(2)]);
            };

            console.log("🚀 Nexus Spy Client V29: DEEP RESOURCE HIJACK ACTIVE");
          })();
        </script>
      `;

      html = html.replace('<head>', `<head><base href="${targetOrigin}/">`);
      html = html.replace('</body>', `${spyScript}</body>`);

      const res = new NextResponse(html, {
        status: response.status,
        headers: { 
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
          'X-Frame-Options': 'ALLOWALL'
        },
      });

      // حذف قيود الحماية
      ['content-security-policy', 'x-frame-options', 'permissions-policy'].forEach(h => res.headers.delete(h));
      
      return res;
    }

    // إذا لم يكن HTML (مثل ملفات JS من gstatic)، نمرره مع السماح بـ CORS
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
