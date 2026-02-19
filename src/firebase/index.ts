
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

/**
 * [STABILITY_ANCHOR: FIREBASE_CORE_V8.1]
 * تهيئة خدمات Firebase مع ضمان تفعيل "بروتوكول التخزين المستمر" لمرة واحدة فقط.
 * تم استخدام نمط الـ Singleton لمنع خطأ "Firestore has already been started".
 */

let cachedSdks: {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
} | null = null;

let isPersistenceAttempted = false;

export function initializeFirebase() {
  // العودة للنسخة المخزنة إذا كانت موجودة لضمان استقرار الأداء ومنع إعادة التهيئة
  if (cachedSdks) return cachedSdks;

  let app: FirebaseApp;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  cachedSdks = {
    firebaseApp: app,
    auth,
    firestore,
    storage
  };

  // تفعيل التخزين المحلي المستمر (Persistence) لمرة واحدة فقط عند بداية التشغيل
  // هذا يضمن عمل التطبيق أوفلاين بكفاءة دون حدوث تضارب في الذاكرة
  if (typeof window !== 'undefined' && !isPersistenceAttempted) {
    isPersistenceAttempted = true;
    enableIndexedDbPersistence(firestore).catch((err) => {
      if (err.code === 'failed-precondition') {
        // احتمالية وجود عدة تبويبات مفتوحة للنظام
        console.warn("Persistence failed: Multiple tabs open.");
      } else if (err.code === 'unimplemented') {
        // المتصفح الحالي لا يدعم تقنية التخزين المحلي المستمر
        console.warn("Persistence is not supported in this browser.");
      }
    });
  }

  return cachedSdks;
}

export function getSdks(firebaseApp: FirebaseApp) {
  // وظيفة مساعدة لجلب الخدمات الملحقة بالعقدة
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
