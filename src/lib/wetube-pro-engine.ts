
'use client';

import { create } from 'zustand';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * [STABILITY_ANCHOR: WETUBE_PRO_ENGINE_V1.1]
 * المحرك الرئيسي لمزايا WeTube Pro - يعالج التحقق من الملكية، التحكم في الفريمات، والتخزين الذكي، وتتبع الاستهلاك.
 */

export interface NeuralMetadata {
  introStart?: number; // In seconds
  introEnd?: number;   // In seconds
  outroStart?: number; // In seconds
}

export interface ProSettings {
  isSmartCacheEnabled: boolean;
  isFrameSkipEnabled: boolean;
  cacheSizeLimitMB: number;
  frameSkipRatio: number; // 0 to 1 (e.g. 0.5 for 1/2)
}

export interface ConsumptionRecord {
  id: string;
  videoId: string;
  timestamp: number;
  quality: string;
  bytesConsumed: number;
  bytesSaved: number;
  method: 'cache' | 'skip' | 'network';
}

interface ProState {
  settings: ProSettings;
  usageLog: ConsumptionRecord[];
  totalSavedMB: number;
  updateSettings: (settings: Partial<ProSettings>) => void;
  addUsageRecord: (record: Omit<ConsumptionRecord, 'id' | 'timestamp'>) => void;
  clearLog: () => void;
}

export const useProStore = create<ProState>((set) => ({
  settings: {
    isSmartCacheEnabled: true,
    isFrameSkipEnabled: true,
    cacheSizeLimitMB: 1024,
    frameSkipRatio: 0
  },
  usageLog: [],
  totalSavedMB: 0,
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  addUsageRecord: (record) => set((state) => {
    const newRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    return {
      usageLog: [newRecord, ...state.usageLog].slice(0, 50),
      totalSavedMB: state.totalSavedMB + (record.bytesSaved / (1024 * 1024))
    };
  }),
  clearLog: () => set({ usageLog: [], totalSavedMB: 0 })
}));

export const DEFAULT_PRO_SETTINGS: ProSettings = {
  isSmartCacheEnabled: true,
  isFrameSkipEnabled: true,
  cacheSizeLimitMB: 1024,
  frameSkipRatio: 0
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
 * Ratio: 0 = No skipping, 0.5 = Skip half, 0.75 = Skip 3/4
 */
export const shouldRenderFrame = (frameIndex: number, ratio: number): boolean => {
  if (ratio <= 0) return true;
  if (ratio >= 1) return frameIndex === 0;
  
  const skipInterval = Math.round(1 / ratio);
  return frameIndex % skipInterval !== 0;
};

/**
 * إدارة التخزين الذكي (IndexedDB)
 */
export const initProCache = async () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve(null);
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
