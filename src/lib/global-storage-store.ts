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
  downloadedQuality?: string;
}

interface CategoryLimit {
  id: AssetType;
  label: string;
  limitMB: number;
}

interface GlobalStorageState {
  cachedAssets: CachedAsset[];
  categoryLimits: Record<AssetType, number>;
  storageLimitMB: number;

  addAsset: (asset: Omit<CachedAsset, 'timestamp' | 'isFavorite'>) => void;
  removeAsset: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setCategoryLimit: (type: AssetType, limit: number) => void;
  clearCategorySpace: (type: AssetType, requiredSpace: number) => void;
  getUsedSpaceByCategory: (type: AssetType) => number;
  getTotalUsedSpace: () => number;
  setStorageLimit: (limit: number) => void;
}

/**
 * [STABILITY_ANCHOR: GLOBAL_STORAGE_V7.0]
 * بروتوكول التخزين المتطور: يدعم الحدود القصوى لكل قسم والتنظيف الذكي المستهدف.
 */
export const useGlobalStorage = create<GlobalStorageState>()(
  persist(
    (set, get) => ({
      cachedAssets: [],
      storageLimitMB: 500,
      categoryLimits: {
        'quran': 100,
        'video': 300,
        'learning_asset': 200,
        'ai_model_data': 50
      },

      addAsset: (assetData) => {
        const { cachedAssets, categoryLimits, clearCategorySpace, getUsedSpaceByCategory } = get();
        const existing = cachedAssets.find(a => a.id === assetData.id);

        if (existing) {
          set({
            cachedAssets: cachedAssets.map(a =>
              a.id === assetData.id ? { ...a, timestamp: Date.now() } : a
            )
          });
          return;
        }

        const limit = categoryLimits[assetData.type] || 100;
        const currentCategoryUsed = getUsedSpaceByCategory(assetData.type);

        if (currentCategoryUsed + (assetData.sizeMB || 0) > limit) {
          clearCategorySpace(assetData.type, assetData.sizeMB);
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

      setCategoryLimit: (type, limit) => {
        set(state => ({
          categoryLimits: { ...state.categoryLimits, [type]: limit }
        }));
      },

      clearCategorySpace: (type, requiredSpace) => {
        const { cachedAssets, categoryLimits } = get();
        const limit = categoryLimits[type] || 100;

        let assetsOfCategory = cachedAssets.filter(a => a.type === type);
        let currentTotal = assetsOfCategory.reduce((acc, a) => acc + (a.sizeMB || 0), 0);

        // التنظيف الذكي: مسح الأقدم غير المحمي
        const deleteCandidates = assetsOfCategory
          .filter(a => !a.isFavorite)
          .sort((a, b) => a.timestamp - b.timestamp);

        let idsToRemove = new Set<string>();
        for (const candidate of deleteCandidates) {
          if (currentTotal + requiredSpace <= limit) break;
          currentTotal -= candidate.sizeMB;
          idsToRemove.add(candidate.id);
        }

        set({
          cachedAssets: cachedAssets.filter(a => !idsToRemove.has(a.id))
        });
      },

      getUsedSpaceByCategory: (type) => {
        return get().cachedAssets
          .filter(a => a.type === type)
          .reduce((acc, a) => acc + (a.sizeMB || 0), 0);
      },

      getTotalUsedSpace: () => {
        return get().cachedAssets.reduce((acc, a) => acc + (a.sizeMB || 0), 0);
      },

      setStorageLimit: (limit) => set({ storageLimitMB: limit }),
    }),
    {
      name: 'nexus-segmented-storage-v2',
      version: 2
    }
  )
);
