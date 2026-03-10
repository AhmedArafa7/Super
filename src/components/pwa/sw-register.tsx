'use client';

/**
 * مكون تنظيف + تسجيل Service Worker
 * يمسح أي SW قديم أولاً ثم يسجل الجديد.
 */

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const cleanAndRegister = async () => {
      try {
        // 1. Unregister ALL existing service workers first
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
          console.log('[PWA] Unregistered old SW:', reg.scope);
        }

        // 2. Clear ALL caches
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
          console.log('[PWA] Cleared cache:', name);
        }

        // 3. Register fresh SW
        const newReg = await navigator.serviceWorker.register('/sw.js');
        console.log('[PWA] Fresh SW registered, scope:', newReg.scope);

      } catch (err) {
        console.warn('[PWA] SW setup error:', err);
      }
    };

    // Run after page fully loads
    if (document.readyState === 'complete') {
      cleanAndRegister();
    } else {
      window.addEventListener('load', cleanAndRegister, { once: true });
    }
  }, []);

  return null;
}
