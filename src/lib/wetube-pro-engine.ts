
'use client';

import { MarketItem } from './market/types';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * [STABILITY_ANCHOR: WETUBE_PRO_ENGINE_V1.0]
 * المحرك الرئيسي لمزايا WeTube Pro - يعالج التحقق من الملكية، التحكم في الفريمات، والتخزين الذكي.
 */

export interface ProSettings {
  frameSkipRatio: 'none' | '1/2' | '3/4' | '4/5';
  autoTrimOutro: boolean;
  maxCacheSizeGB: number;
}

export const DEFAULT_PRO_SETTINGS: ProSettings = {
  frameSkipRatio: 'none',
  autoTrimOutro: true,
  maxCacheSizeGB: 1
};

const PRO_PRODUCT_TITLE = "WeTube Pro";

/**
 * التحقق مما إذا كان المستخدم يمتلك اشتراك Pro
 */
export const checkProOwnership = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const { firestore } = initializeFirebase();
    const q = query(
      collection(firestore, 'products'),
      where('title', '==', PRO_PRODUCT_TITLE),
      where('purchasedBy', 'array-contains', userId),
      limit(1)
    );
    
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (err) {
    console.error("Pro Ownership Check Error:", err);
    return false;
  }
};

/**
 * منطق الـ Frame Skipping
 * يقوم بتحديد ما إذا كان يجب عرض الفريم الحالي أم لا لتوفير الباقة
 */
export const shouldRenderFrame = (frameIndex: number, ratio: ProSettings['frameSkipRatio']): boolean => {
  if (ratio === 'none') return true;
  
  if (ratio === '1/2') {
    // يرسل فريم ويترك فريم (50%)
    return frameIndex % 2 === 0;
  }
  
  if (ratio === '3/4') {
    // يرسل 3 فريمات ويترك واحد (75%)
    return frameIndex % 4 !== 0;
  }
  
  if (ratio === '4/5') {
    // يرسل 4 فريمات ويترك واحد (80%)
    return frameIndex % 5 !== 0;
  }
  
  return true;
};

/**
 * إدارة التخزين الذكي (IndexedDB)
 * سيتم استخدامه داخل مكون المشغل لتخزين واسترجاع أجزاء الفيديو
 */
export const initProCache = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wetube-pro-cache', 1);
    
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('chunks')) {
        db.createObjectStore('chunks', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e: any) => reject(e.target.error);
  });
};
