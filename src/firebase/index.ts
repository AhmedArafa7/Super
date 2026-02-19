
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * [STABILITY_ANCHOR: FIREBASE_CORE_V8.0]
 * تهيئة خدمات Firebase مع تفعيل "بروتوكول التخزين المستمر" لتوفير الطاقة والبيانات.
 */
export function initializeFirebase() {
  let app: FirebaseApp;
  
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  const sdks = getSdks(app);

  // تفعيل التخزين المحلي المستمر (Persistence) لراحة المستخدم وتقليل استهلاك الإنترنت
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(sdks.firestore).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Persistence failed: Multiple tabs open.");
      } else if (err.code === 'unimplemented') {
        console.warn("Persistence is not supported in this browser.");
      }
    });
  }

  return sdks;
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
