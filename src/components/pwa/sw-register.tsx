'use client';

/**
 * مكون تسجيل Service Worker — يُحمّل في layout.tsx
 * يسجل الـ SW فقط في بيئة الإنتاج أو عندما يكون متاحاً.
 */

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((reg) => {
                        console.log('[PWA] Service Worker registered, scope:', reg.scope);

                        // Check for updates periodically (every 60 minutes)
                        setInterval(() => {
                            reg.update();
                        }, 60 * 60 * 1000);
                    })
                    .catch((err) => {
                        console.warn('[PWA] SW registration failed:', err);
                    });
            });
        }
    }, []);

    return null;
}
