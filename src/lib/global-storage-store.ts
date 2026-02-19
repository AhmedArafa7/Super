
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AssetType = 'quran' | 'video' | 'learning_asset' | 'ai_model_data';

export interface CachedAsset {
  id: string;
  type: AssetType;
  title: string;
  sizeMB: number;
  timestamp: number;
  isFavorite: boolean;
  metadata?: any;
}

interface GlobalStorageState {
  cachedAssets: CachedAsset[];
  storageLimitMB: number;
  
  addAsset: (asset: Omit<CachedAsset, 'timestamp' | 'isFavorite'>) => void;
  removeAsset: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setStorageLimit: (limit: number) => void;
  clearOldestAssets: (requiredSpace: number) => void;
  getTotalUsedSpace: () => number;
}

/**
 * [STABILITY_ANCHOR: GLOBAL_STORAGE_V6.0]
 * بروتوكول إدارة التخزين المحلي السيادي.
 * تم تثبيت معرف التخزين لضمان استمرارية البيانات عبر التحديثات.
 */
export const useGlobalStorage = create<GlobalStorageState>()(
  persist(
    (set, get) => ({
      cachedAssets: [],
      storageLimitMB: 500,

      addAsset: (assetData) => {
        const { cachedAssets, storageLimitMB, clearOldestAssets } = get();
        const existing = cachedAssets.find(a => a.id === assetData.id);
        
        if (existing) {
          // تحديث الطابع الزمني فقط للأصول الموجودة
          set({
            cachedAssets: cachedAssets.map(a => 
              a.id === assetData.id ? { ...a, timestamp: Date.now() } : a
            )
          });
          return;
        }

        const currentTotal = cachedAssets.reduce((acc, a) => acc + (a.sizeMB || 0), 0);
        if (currentTotal + (assetData.sizeMB || 0) > storageLimitMB) {
          clearOldestAssets(assetData.sizeMB);
        }

        const newAsset: CachedAsset = {
          ...assetData,
          timestamp: Date.now(),
          isFavorite: false
        };

        set({ cachedAssets: [...get().cachedAssets, newAsset] });
      },

      removeAsset: (id) => {
        set({ cachedAssets: get().cachedAssets.filter(a => a.id !== id) });
      },

      toggleFavorite: (id) => {
        set({
          cachedAssets: get().cachedAssets.map(a => 
            a.id === id ? { ...a, isFavorite: !a.isFavorite } : a
          )
        });
      },

      setStorageLimit: (limit) => set({ storageLimitMB: limit }),

      clearOldestAssets: (requiredSpace) => {
        const { cachedAssets, storageLimitMB } = get();
        let currentAssets = [...cachedAssets];
        let currentTotal = currentAssets.reduce((acc, a) => acc + (a.sizeMB || 0), 0);

        // تصفية المرشحين للحذف (غير المفضلين فقط)
        const deleteCandidates = currentAssets
          .filter(a => !a.isFavorite)
          .sort((a, b) => a.timestamp - b.timestamp);

        for (const candidate of deleteCandidates) {
          if (currentTotal + requiredSpace <= storageLimitMB) break;
          currentTotal -= candidate.sizeMB;
          currentAssets = currentAssets.filter(a => a.id !== candidate.id);
        }

        set({ cachedAssets: currentAssets });
      },

      getTotalUsedSpace: () => {
        return get().cachedAssets.reduce((acc, a) => acc + (a.sizeMB || 0), 0);
      }
    }),
    { 
      name: 'nexus-global-assets-v1',
      version: 1 
    }
  )
);
