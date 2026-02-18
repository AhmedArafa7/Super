
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QuranSurah {
  id: number;
  name: string;
  reciter: string;
  url: string;
  sizeMB: number;
}

export interface OfflineAsset {
  id: number;
  type: 'quran';
  size: number;
  timestamp: number;
  isFavorite: boolean;
}

interface QuranState {
  currentSurah: QuranSurah | null;
  downloadedAssets: OfflineAsset[];
  storageLimitMB: number; // بالـ ميجابايت
  isPlaying: boolean;
  
  setCurrentSurah: (surah: QuranSurah | null) => void;
  toggleFavorite: (id: number) => void;
  setStorageLimit: (limit: number) => void;
  addAsset: (surah: QuranSurah) => void;
  setIsPlaying: (playing: boolean) => void;
  clearOldestAssets: (requiredSpace: number) => void;
  deleteAsset: (id: number) => void;
}

export const QURAN_DATA: QuranSurah[] = [
  { id: 1, name: "الفاتحة", reciter: "مشاري العفاسي", url: "https://server8.mp3quran.net/afs/001.mp3", sizeMB: 1.2 },
  { id: 2, name: "البقرة", reciter: "مشاري العفاسي", url: "https://server8.mp3quran.net/afs/002.mp3", sizeMB: 154.5 },
  { id: 18, name: "الكهف", reciter: "مشاري العفاسي", url: "https://server8.mp3quran.net/afs/018.mp3", sizeMB: 22.4 },
  { id: 36, name: "يس", reciter: "مشاري العفاسي", url: "https://server8.mp3quran.net/afs/036.mp3", sizeMB: 12.8 },
  { id: 67, name: "الملك", reciter: "مشاري العفاسي", url: "https://server8.mp3quran.net/afs/067.mp3", sizeMB: 4.5 },
  { id: 112, name: "الإخلاص", reciter: "مشاري العفاسي", url: "https://server8.mp3quran.net/afs/112.mp3", sizeMB: 0.5 },
];

export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      currentSurah: null,
      downloadedAssets: [],
      storageLimitMB: 500, // القيمة الافتراضية
      isPlaying: false,

      setCurrentSurah: (surah) => {
        set({ currentSurah: surah, isPlaying: !!surah });
        if (surah) get().addAsset(surah);
      },

      setIsPlaying: (isPlaying) => set({ isPlaying }),

      setStorageLimit: (storageLimitMB) => set({ storageLimitMB }),

      toggleFavorite: (id) => {
        const { downloadedAssets } = get();
        set({
          downloadedAssets: downloadedAssets.map(a => 
            a.id === id ? { ...a, isFavorite: !a.isFavorite } : a
          )
        });
      },

      deleteAsset: (id) => {
        set({ downloadedAssets: get().downloadedAssets.filter(a => a.id !== id) });
      },

      addAsset: (surah) => {
        const { downloadedAssets, storageLimitMB, clearOldestAssets } = get();
        const existing = downloadedAssets.find(a => a.id === surah.id);
        
        if (existing) {
          // تحديث وقت الاستخدام الأخير
          set({
            downloadedAssets: downloadedAssets.map(a => 
              a.id === surah.id ? { ...a, timestamp: Date.now() } : a
            )
          });
          return;
        }

        const currentTotal = downloadedAssets.reduce((acc, a) => acc + a.size, 0);
        if (currentTotal + surah.sizeMB > storageLimitMB) {
          clearOldestAssets(surah.sizeMB);
        }

        const newAsset: OfflineAsset = {
          id: surah.id,
          type: 'quran',
          size: surah.sizeMB,
          timestamp: Date.now(),
          isFavorite: false
        };

        set({ downloadedAssets: [...get().downloadedAssets, newAsset] });
      },

      clearOldestAssets: (requiredSpace) => {
        const { downloadedAssets, storageLimitMB } = get();
        let currentAssets = [...downloadedAssets];
        let currentTotal = currentAssets.reduce((acc, a) => acc + a.size, 0);

        // تصفية العناصر التي ليست مفضلة وترتيبها من الأقدم
        const deleteCandidates = currentAssets
          .filter(a => !a.isFavorite)
          .sort((a, b) => a.timestamp - b.timestamp);

        for (const candidate of deleteCandidates) {
          if (currentTotal + requiredSpace <= storageLimitMB) break;
          currentTotal -= candidate.size;
          currentAssets = currentAssets.filter(a => a.id !== candidate.id);
        }

        set({ downloadedAssets: currentAssets });
      }
    }),
    { name: 'nexus-quran-storage' }
  )
);
