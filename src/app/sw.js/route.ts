
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: PROXY_SERVICE_WORKER_V2.0]
 * خادم الـ Service Worker المطور - يدعم نطاقات متعددة وتوجيه الموارد العميقة.
 */
export async function GET() {
  const swCode = `
    const PROXY_PATH = '/api/proxy?url=';

    self.addEventListener('install', (event) => {
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(self.clients.claim());
    });

    self.addEventListener('fetch', (event) => {
      const url = new URL(event.request.url);
      
      // 1. لا تعترض الطلبات الخاصة بنطاق نكسوس نفسه أو الملحقات
      if (url.origin === self.location.origin || url.protocol.startsWith('chrome')) {
        return;
      }

      // 2. تحويل الطلب عبر البروكسي
      // إذا كان الطلب نسبياً، نستخدم الـ Target Origin المخزن في السيرفر (عبر تمريره في الهيدرز أو استنتاجه)
      const proxyUrl = self.location.origin + PROXY_PATH + encodeURIComponent(event.request.url);
      
      event.respondWith(
        fetch(proxyUrl, {
          method: event.request.method,
          headers: event.request.headers,
          body: event.request.method !== 'GET' && event.request.method !== 'HEAD' ? event.request.clone().blob() : undefined,
          credentials: 'include', // السماح بالكوكيز المطهره
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
