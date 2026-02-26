import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * [STABILITY_ANCHOR: PROXY_SERVICE_WORKER_V34.0_FINAL]
 * خادم الـ Service Worker السيادي: السيطرة اللحظية (skipWaiting) والافتراضية الشاملة للشبكة.
 */
export async function GET() {
  const swCode = `
    let targetOrigin = '';
    let virtualCookies = '';
    const PROXY_PATH = '/api/proxy?url=';

    self.addEventListener('install', (event) => {
      // إجبار الـ SW الجديد على التنشيط فوراً وتجاوز الانتظار التقليدي
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      // السيطرة على كافة الصفحات المفتوحة فوراً دون الحاجة لإعادة تحميل (Refresh)
      event.waitUntil(self.clients.claim());
    });

    self.addEventListener('message', (event) => {
      if (event.data.type === 'SET_TARGET') {
        targetOrigin = event.data.origin;
      }
      if (event.data.type === 'UPDATE_COOKIES') {
        virtualCookies = event.data.cookies;
      }
    });

    self.addEventListener('fetch', (event) => {
      const url = new URL(event.request.url);
      
      // 1. استثناء طلبات نكسوس الداخلية لمنع الحلقات اللانهائية
      if (url.origin === self.location.origin && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/sw.js'))) {
        return;
      }

      // 2. بناء الرابط المستهدف المطلق (تحويل الروابط النسبية إلى كاملة)
      let absoluteUrl = event.request.url;
      if (url.origin === self.location.origin && targetOrigin) {
        absoluteUrl = targetOrigin + url.pathname + url.search;
      }

      const proxyUrl = self.location.origin + PROXY_PATH + encodeURIComponent(absoluteUrl);
      
      // 3. حقن الكوكيز والبيانات الافتراضية في كل طلب يخرج
      const modifiedHeaders = new Headers(event.request.headers);
      if (virtualCookies) {
        modifiedHeaders.set('X-Nexus-Virtual-Cookies', virtualCookies);
      }

      event.respondWith(
        fetch(proxyUrl, {
          method: event.request.method,
          headers: modifiedHeaders,
          body: event.request.method !== 'GET' && event.request.method !== 'HEAD' ? event.request.clone().blob() : undefined,
          credentials: 'include',
          mode: 'cors'
        })
      );
    });
  `;

  return new NextResponse(swCode, {
    headers: {
      'Content-Type': 'application/javascript',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-store'
    }
  });
}
