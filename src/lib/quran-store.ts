
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useGlobalStorage } from './global-storage-store';

/**
 * [STABILITY_ANCHOR: QURAN_ENGINE_V3.2]
 * محرك القرآن الكريم المطور - تم تحصين المزامنة ضد أخطاء "Failed to fetch".
 */

export interface QuranSurah {
  id: number;
  name: string;
  reciter: string;
  url: string;
  sizeMB: number;
  englishName?: string;
  numberOfAyahs?: number;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
}

interface QuranState {
  surahs: QuranSurah[];
  currentSurah: QuranSurah | null;
  currentReadingText: Ayah[] | null;
  isPlaying: boolean;
  isLoading: boolean;
  isReadingLoading: boolean;
  
  fetchSurahs: () => Promise<void>;
  fetchSurahText: (id: number) => Promise<void>;
  setCurrentSurah: (surah: QuranSurah | null) => void;
  setIsPlaying: (playing: boolean) => void;
  downloadToLocal: (surah: QuranSurah) => Promise<void>;
  toggleFavoriteSurah: (id: number) => void;
}

export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      surahs: [],
      currentSurah: null,
      currentReadingText: null,
      isPlaying: false,
      isLoading: false,
      isReadingLoading: false,

      fetchSurahs: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('https://api.alquran.cloud/v1/surah');
          const data = await response.json();
          
          if (data.code === 200) {
            const mapped: QuranSurah[] = data.data.map((s: any) => ({
              id: s.number,
              name: s.name,
              englishName: s.englishName,
              numberOfAyahs: s.numberOfAyahs,
              reciter: "مشاري العفاسي",
              url: `https://server8.mp3quran.net/afs/${s.number.toString().padStart(3, '0')}.mp3`,
              sizeMB: Number((s.numberOfAyahs * 0.4).toFixed(1))
            }));
            set({ surahs: mapped, isLoading: false });
          }
        } catch (err) {
          console.error("Neural API Sync Failed:", err);
          set({ isLoading: false });
        }
      },

      fetchSurahText: async (id) => {
        set({ isReadingLoading: true, currentReadingText: null });
        try {
          const response = await fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`);
          const data = await response.json();
          if (data.code === 200) {
            set({ currentReadingText: data.data.ayahs, isReadingLoading: false });
          }
        } catch (err) {
          set({ isReadingLoading: false });
        }
      },

      setCurrentSurah: (surah) => {
        set({ currentSurah: surah, isPlaying: !!surah });
        if (surah) {
          get().downloadToLocal(surah);
        }
      },

      setIsPlaying: (isPlaying) => set({ isPlaying }),

      downloadToLocal: async (surah) => {
        if (!window.navigator.onLine) return; // لا تحاول التحميل إذا كان المستخدم أوفلاين أصلاً

        const assetId = `quran-${surah.id}`;
        const storage = useGlobalStorage.getState();
        const isAlreadyCached = storage.cachedAssets.some(a => a.id === assetId);
        
        if (isAlreadyCached) return;

        try {
          const cache = await caches.open('nexus-quran-physical-cache');
          
          // استخدام وضع 'no-cors' كخيار احتياطي لضمان التحميل حتى مع قيود الخادم
          // ملاحظة: Fetch قد يفشل إذا كان الاتصال ضعيفاً جداً
          const response = await fetch(surah.url, { 
            mode: 'cors',
            credentials: 'omit'
          }).catch(() => fetch(surah.url, { mode: 'no-cors' })); 

          if (!response || (!response.ok && response.type !== 'opaque')) {
            throw new Error("Neural link unstable.");
          }
          
          await cache.put(surah.url, response.clone());
          
          storage.addAsset({
            id: assetId,
            type: 'quran',
            title: `سورة ${surah.name}`,
            sizeMB: surah.sizeMB
          });
        } catch (err) {
          // تسجيل الخطأ بهدوء دون تعطيل الواجهة
          console.warn(`[Background Sync Interrupted] for Surah ${surah.name}:`, err);
        }
      },

      toggleFavoriteSurah: (id) => {
        const assetId = `quran-${id}`;
        const storage = useGlobalStorage.getState();
        const existing = storage.cachedAssets.find(a => a.id === assetId);
        
        if (!existing) {
          const surah = get().surahs.find(s => s.id === id);
          if (surah) {
            storage.addAsset({
              id: assetId,
              type: 'quran',
              title: `سورة ${surah.name}`,
              sizeMB: surah.sizeMB
            });
          }
        }
        storage.toggleFavorite(assetId);
      }
    }),
    { 
      name: 'nexus-quran-registry-v1',
      version: 1 
    }
  )
);
