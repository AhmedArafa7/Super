
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
 * [STABILITY_ANCHOR: FIREBASE_CORE_V8.8_FINAL]
 * تم تحديث المحرك لاستخدام بروتوكول التخزين الحديث وإزالة تحذير deprecation تماماً.
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
  
  // تفعيل التخزين المحلي باستخدام البروتوكول الحديث لمنع تحذير enableIndexedDbPersistence
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
