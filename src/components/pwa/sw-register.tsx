'use client';

/**
 * مكون تسجيل Service Worker — يُنظف الـ SWs القديمة مرة واحدة ثم يسجل الجديد.
 */

import { useEffect } from 'react';

const SW_CLEANUP_KEY = 'nexus-sw-cleanup-v4'; // Incremented to v4 to force cleanup

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // ─── Automatic Recovery Strategy ─────────────────────────
    const handleError = (e: ErrorEvent) => {
      const isChunkError = e.message.includes('Loading chunk') || e.message.includes('ChunkLoadError');
      if (isChunkError) {
        console.error('🚀 [PWA] ChunkLoadError detected. Performing emergency recovery...');
        init(true); // Force full cleanup and reload
      }
    };

    const init = async (forceReload = false) => {
      try {
        const alreadyCleaned = localStorage.getItem(SW_CLEANUP_KEY);

        if (!alreadyCleaned || forceReload) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            await reg.unregister();
            console.log('[PWA] Unregistered old SW:', reg.scope);
          }
          const names = await caches.keys();
          for (const name of names) {
            await caches.delete(name);
          }
          localStorage.setItem(SW_CLEANUP_KEY, Date.now().toString());
          if (forceReload) window.location.reload();
        }

        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('[PWA] SW registered, scope:', reg.scope);
        setInterval(() => reg.update(), 60 * 60 * 1000);
      } catch (err) {
        console.warn('[PWA] SW error:', err);
      }
    };

    window.addEventListener('error', handleError);
    if (document.readyState === 'complete') init();
    else window.addEventListener('load', () => init(), { once: true });

    return () => window.removeEventListener('error', handleError);
  }, []);

  return null;
}
