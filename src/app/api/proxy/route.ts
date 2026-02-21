
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: NEURAL_HIJACK_NUCLEAR_V30.0]
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
    
    // إذا كان المحتوى HTML، نقوم بإعادة كتابة الروابط وحقن السكريبت
    if (contentType.includes('text/html')) {
      let html = await response.text();
      const targetOrigin = new URL(targetUrl).origin;
      const proxyPath = request.nextUrl.pathname;

      // وظيفة مساعدة لتحويل الروابط داخل الـ HTML
      const getProxyUrl = (url: string) => {
        if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:') || url.startsWith('#')) return url;
        try {
          // تحويل الروابط النسبية إلى مطلقة قبل تشفيرها في البروكسي
          const absoluteUrl = new URL(url, targetUrl).href;
          // فلتر المحتوى: منع ملفات التتبع لزيادة السرعة
          if (absoluteUrl.includes('google-analytics') || absoluteUrl.includes('doubleclick')) return '';
          return `${proxyPath}?url=${encodeURIComponent(absoluteUrl)}`;
        } catch(e) { return url; }
      };

      // إعادة كتابة الروابط في الـ HTML (Scripts, Links, Images, Forms)
      // هذا يحل مشكلة CORS لأن المتصفح سيراها كروابط داخلية من نكسوس
      html = html.replace(/(src|href|action|data-src)=["'](.*?)["']/gi, (match, attr, url) => {
        const proxied = getProxyUrl(url);
        return proxied ? `${attr}="${proxied}"` : '';
      });

      // حقن سكريبت الاستحواذ العميق (Deep Hijack V30)
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

            // 📡 اختطاف إنشاء العناصر (لحل مشكلة gstatic وغيرها من الموارد الديناميكية)
            const originalCreateElement = document.createElement;
            document.createElement = function(tagName) {
              const el = originalCreateElement.apply(this, arguments);
              const tag = tagName.toLowerCase();
              if (tag === 'script' || tag === 'link' || tag === 'img' || tag === 'iframe') {
                const originalSetAttribute = el.setAttribute;
                el.setAttribute = function(name, value) {
                  if (name === 'src' || name === 'href') {
                    value = getProxyUrl(value);
                  }
                  return originalSetAttribute.apply(this, [name, value]);
                };
                
                // اعتراض خاصية .src مباشرة عبر Prototype
                Object.defineProperty(el, 'src', {
                  set: function(val) { el.setAttribute('src', val); },
                  get: function() { return el.getAttribute('src'); }
                });
              }
              return el;
            };

            // 📡 اختطاف FETCH و XHR لضمان بقاء البيانات داخل الجسر
            const originalFetch = window.fetch;
            window.fetch = function(input, init) {
              let url = typeof input === 'string' ? input : (input.url || input);
              return originalFetch(getProxyUrl(url), init);
            };

            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
              return originalOpen.apply(this, [method, getProxyUrl(url), ...Array.from(arguments).slice(2)]);
            };

            // 📡 اختطاف الـ Location لضمان بقاء الأزرار داخل الإطار
            const originalPushState = history.pushState;
            history.pushState = function(state, title, url) {
              return originalPushState.apply(this, [state, title, getProxyUrl(url)]);
            };

            console.log("🚀 Nexus Nuclear Hijack V30: DEEP INTERCEPTION ACTIVE");
          })();
        </script>
      `;

      // إضافة base href وحقن السكريبت
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

      // حذف كافة قيود الحماية التي قد تمنع العرض أو عمل الأزرار
      ['content-security-policy', 'x-frame-options', 'permissions-policy', 'x-content-type-options'].forEach(h => res.headers.delete(h));
      
      return res;
    }

    // إذا لم يكن HTML (مثل ملفات JS من gstatic)، نمرره مع السماح بـ CORS
    const proxyRes = new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
    proxyRes.headers.set('Access-Control-Allow-Origin', '*');
    // إجبار المتصفح على معالجة الملفات كـ JS إذا كانت قادمة من نطاقات برمجية
    if (targetUrl.includes('.js') || targetUrl.includes('boq-identity')) {
      proxyRes.headers.set('Content-Type', 'application/javascript');
    }
    return proxyRes;

  } catch (err: any) {
    return NextResponse.json({ error: 'Neural Gateway Timeout' }, { status: 504 });
  }
}

export async function GET(request: NextRequest) { return handleProxyRequest(request); }
export async function POST(request: NextRequest) { return handleProxyRequest(request); }
