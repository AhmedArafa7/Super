'use client';

/**
 * مكون تسجيل Service Worker — يُنظف الـ SWs القديمة مرة واحدة ثم يسجل الجديد.
 */

import { useEffect } from 'react';

const SW_CLEANUP_KEY = 'nexus-sw-cleanup-v2';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const init = async () => {
      try {
        // Only do full cleanup ONCE per version (not on every page load)
        const alreadyCleaned = localStorage.getItem(SW_CLEANUP_KEY);

        if (!alreadyCleaned) {
          // Unregister all old SWs
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            await reg.unregister();
            console.log('[PWA] Unregistered old SW:', reg.scope);
          }
          // Clear old caches
          const names = await caches.keys();
          for (const name of names) {
            await caches.delete(name);
            console.log('[PWA] Cleared cache:', name);
          }
          localStorage.setItem(SW_CLEANUP_KEY, Date.now().toString());
        }

        // Register fresh SW
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('[PWA] SW registered, scope:', reg.scope);

        // Check for updates every hour
        setInterval(() => reg.update(), 60 * 60 * 1000);
      } catch (err) {
        console.warn('[PWA] SW error:', err);
      }
    };

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init, { once: true });
  }, []);

  return null;
}
