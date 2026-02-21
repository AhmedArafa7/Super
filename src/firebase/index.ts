
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore 
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

/**
 * [STABILITY_ANCHOR: FIREBASE_CORE_V8.5]
 * تهيئة خدمات Firebase مع ضمان عدم تكرار الاستدعاء واستخدام أحدث بروتوكولات التخزين لمنع تحذيرات الـ deprecation.
 */

let cachedSdks: {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
} | null = null;

export function initializeFirebase() {
  if (cachedSdks) return cachedSdks;

  let app: FirebaseApp;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  const auth = getAuth(app);
  
  // تفعيل التخزين المحلي باستخدام الطريقة الحديثة (Firestore v11+)
  // هذا يمنع ظهور رسالة التحذير enableIndexedDbPersistence()
  const firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });

  const storage = getStorage(app);

  cachedSdks = {
    firebaseApp: app,
    auth,
    firestore,
    storage
  };

  return cachedSdks;
}

export function getSdks(firebaseApp: FirebaseApp) {
  // نستخدم initializeFirebase لضمان الحصول على النسخة المهيأة بالـ Cache الصحيح
  const sdks = initializeFirebase();
  return {
    firebaseApp: sdks.firebaseApp,
    auth: sdks.auth,
    firestore: sdks.firestore,
    storage: sdks.storage
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
