
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useGlobalStorage } from './global-storage-store';

export interface QuranSurah {
  id: number;
  name: string;
  reciter: string;
  url: string;
  sizeMB: number;
  englishName?: string;
  numberOfAyahs?: number;
}

interface QuranState {
  surahs: QuranSurah[];
  currentSurah: QuranSurah | null;
  isPlaying: boolean;
  isLoading: boolean;
  
  fetchSurahs: () => Promise<void>;
  setCurrentSurah: (surah: QuranSurah | null) => void;
  setIsPlaying: (playing: boolean) => void;
  downloadToLocal: (surah: QuranSurah) => Promise<void>;
}

/**
 * @fileOverview محرك القرآن الكريم - يعمل عبر API خارجي مع دعم التحميل الفيزيائي للجهاز.
 */
export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      surahs: [],
      currentSurah: null,
      isPlaying: false,
      isLoading: false,

      fetchSurahs: async () => {
        set({ isLoading: true });
        try {
          // جلب البيانات من AlQuran API
          const response = await fetch('https://api.alquran.cloud/v1/surah');
          const data = await response.json();
          
          if (data.code === 200) {
            const mapped: QuranSurah[] = data.data.map((s: any) => ({
              id: s.number,
              name: s.name,
              englishName: s.englishName,
              numberOfAyahs: s.numberOfAyahs,
              reciter: "مشاري العفاسي",
              // رابط البث من mp3quran
              url: `https://server8.mp3quran.net/afs/${s.number.toString().padStart(3, '0')}.mp3`,
              // تقدير المساحة بناءً على عدد الآيات
              sizeMB: Number((s.numberOfAyahs * 0.5).toFixed(1))
            }));
            set({ surahs: mapped, isLoading: false });
          }
        } catch (err) {
          console.error("API Sync Failed:", err);
          set({ isLoading: false });
        }
      },

      setCurrentSurah: (surah) => {
        set({ currentSurah: surah, isPlaying: !!surah });
      },

      setIsPlaying: (isPlaying) => set({ isPlaying }),

      downloadToLocal: async (surah) => {
        try {
          const cache = await caches.open('nexus-quran-cache');
          const response = await fetch(surah.url);
          if (!response.ok) throw new Error("Network response was not ok");
          
          await cache.put(surah.url, response);
          
          useGlobalStorage.getState().addAsset({
            id: `quran-${surah.id}`,
            type: 'quran',
            title: surah.name,
            sizeMB: surah.sizeMB
          });
        } catch (err) {
          console.error("Download Failed:", err);
        }
      }
    }),
    { name: 'nexus-quran-prefs' }
  )
);
