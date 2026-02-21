
import { NextRequest, NextResponse } from 'next/server';

/**
 * [STABILITY_ANCHOR: PROXY_SERVICE_WORKER_V1.0]
 * خادم الـ Service Worker - يقوم بتقديم الكود الذي سيعترض كافة طلبات الشبكة في المتصفح.
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
      
      // لا تعترض الطلبات الخاصة بنطاقنا نفسه (نكسوس) أو الـ internal browser extensions
      if (url.origin === self.location.origin || url.protocol.startsWith('chrome')) {
        return;
      }

      // اعتراض كافة الطلبات الخارجية وتحويلها للبروكسي
      const proxyUrl = PROXY_PATH + encodeURIComponent(event.request.url);
      
      event.respondWith(
        fetch(proxyUrl, {
          method: event.request.method,
          headers: event.request.headers,
          body: event.request.method !== 'GET' && event.request.method !== 'HEAD' ? event.request.clone().blob() : undefined,
          credentials: 'omit',
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
