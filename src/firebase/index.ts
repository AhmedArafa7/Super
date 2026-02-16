'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// تهيئة Firebase مع ضمان استخدام الإعدادات الصريحة لـ Storage
export function initializeFirebase() {
  let app: FirebaseApp;
  
  if (!getApps().length) {
    // نفضل دائماً استخدام الإعدادات الصريحة لضمان ربط الـ Storage Bucket
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    // نمرر رابط الـ bucket يدوياً للتأكد من عدم حدوث انسداد في الربط
    storage: getStorage(firebaseApp, `gs://${firebaseConfig.storageBucket}`)
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
