
'use client';

/**
 * [STABILITY_ANCHOR: QURAN_ENGINE_V5.0]
 * محرك القرآن الكريم المطور - يدعم التفسير الميسر والمزامنة الكلية للأوفلاين.
 */

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

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  tafsir?: string;
}

interface QuranState {
  surahs: QuranSurah[];
  currentSurah: QuranSurah | null;
  currentReadingText: Ayah[] | null;
  currentJuzText: Ayah[] | null;
  isPlaying: boolean;
  isLoading: boolean;
  isReadingLoading: boolean;
  isBulkSyncing: boolean;
  bulkSyncProgress: number;

  // New Playback State
  playbackPosition: number;
  duration: number;
  savedPositions: Record<number, number>; // Persisted map of surahId -> seconds
  seekToCommand: number | null; // Used to trigger seek in the audio element
  
  fetchSurahs: () => Promise<void>;
  fetchSurahText: (id: number) => Promise<void>;
  fetchJuzText: (juz: number) => Promise<void>;
  setCurrentSurah: (surah: QuranSurah | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
  performSeek: (pos: number) => void;
  clearSeekCommand: () => void;
  downloadToLocal: (surah: QuranSurah) => Promise<void>;
  toggleFavoriteSurah: (id: number) => void;
  syncAllQuranText: () => Promise<void>;
}

export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      surahs: [],
      currentSurah: null,
      currentReadingText: null,
      currentJuzText: null,
      isPlaying: false,
      isLoading: false,
      isReadingLoading: false,
      isBulkSyncing: false,
      bulkSyncProgress: 0,
      
      playbackPosition: 0,
      duration: 0,
      savedPositions: {},
      seekToCommand: null,

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
          // محاولة الجلب من الكاش أولاً
          const cache = await caches.open('nexus-quran-text-cache');
          const textUrl = `https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`;
          const tafsirUrl = `https://api.alquran.cloud/v1/surah/${id}/ar.muyassar`;

          let textData, tafsirData;

          const cachedText = await cache.match(textUrl);
          const cachedTafsir = await cache.match(tafsirUrl);

          if (cachedText && cachedTafsir) {
            textData = await cachedText.json();
            tafsirData = await cachedTafsir.json();
          } else {
            const [textRes, tafsirRes] = await Promise.all([
              fetch(textUrl),
              fetch(tafsirUrl)
            ]);
            textData = await textRes.json();
            tafsirData = await tafsirRes.json();
          }

          if (textData.code === 200 && tafsirData.code === 200) {
            const combinedAyahs = textData.data.ayahs.map((ayah: any, index: number) => ({
              ...ayah,
              tafsir: tafsirData.data.ayahs[index].text
            }));
            set({ currentReadingText: combinedAyahs, isReadingLoading: false });
          }
        } catch (err) {
          set({ isReadingLoading: false });
        }
      },

      fetchJuzText: async (juz) => {
        set({ isReadingLoading: true, currentJuzText: null });
        try {
          const cache = await caches.open('nexus-quran-text-cache');
          const textUrl = `https://api.alquran.cloud/v1/juz/${juz}/quran-uthmani`;
          const tafsirUrl = `https://api.alquran.cloud/v1/juz/${juz}/ar.muyassar`;

          let textData, tafsirData;
          const cachedText = await cache.match(textUrl);
          const cachedTafsir = await cache.match(tafsirUrl);

          if (cachedText && cachedTafsir) {
            textData = await cachedText.json();
            tafsirData = await cachedTafsir.json();
          } else {
            const [textRes, tafsirRes] = await Promise.all([fetch(textUrl), fetch(tafsirUrl)]);
            textData = await textRes.json();
            tafsirData = await tafsirRes.json();
            if (textRes.ok && tafsirRes.ok) {
              const c = await caches.open('nexus-quran-text-cache');
              c.put(textUrl, textRes.clone());
              c.put(tafsirUrl, tafsirRes.clone());
            }
          }

          if (textData.code === 200 && tafsirData.code === 200) {
            const combinedAyahs = textData.data.ayahs.map((ayah: any, index: number) => ({
              number: ayah.number,
              text: ayah.text,
              numberInSurah: ayah.numberInSurah,
              tafsir: tafsirData.data.ayahs[index].text,
              surahId: ayah.surah.number // Helpful for display
            }));
            set({ currentJuzText: combinedAyahs, isReadingLoading: false });
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

      setPlaybackPosition: (pos) => {
        const { currentSurah, savedPositions } = get();
        if (currentSurah) {
          set({ 
            playbackPosition: pos,
            savedPositions: { ...savedPositions, [currentSurah.id]: pos }
          });
        }
      },

      setDuration: (dur) => set({ duration: dur }),

      performSeek: (pos) => set({ seekToCommand: pos }),

      clearSeekCommand: () => set({ seekToCommand: null }),

      downloadToLocal: async (surah) => {
        if (!window.navigator.onLine) return;

        const assetId = `quran-${surah.id}`;
        const storage = useGlobalStorage.getState();
        const isAlreadyCached = storage.cachedAssets.some(a => a.id === assetId);
        
        if (isAlreadyCached) return;

        try {
          const cache = await caches.open('nexus-quran-physical-cache');
          const response = await fetch(surah.url, { mode: 'cors', credentials: 'omit' }).catch(() => fetch(surah.url, { mode: 'no-cors' })); 

          if (!response) throw new Error("Neural link unstable.");
          
          await cache.put(surah.url, response.clone());
          
          storage.addAsset({
            id: assetId,
            type: 'quran',
            title: `سورة ${surah.name}`,
            sizeMB: surah.sizeMB
          });
        } catch (err) {
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
      },

      syncAllQuranText: async () => {
        if (get().isBulkSyncing) return;
        set({ isBulkSyncing: true, bulkSyncProgress: 0 });
        
        const cache = await caches.open('nexus-quran-text-cache');
        const storage = useGlobalStorage.getState();
        
        try {
          for (let i = 1; i <= 114; i++) {
            const textUrl = `https://api.alquran.cloud/v1/surah/${i}/quran-uthmani`;
            const tafsirUrl = `https://api.alquran.cloud/v1/surah/${i}/ar.muyassar`;
            
            // جلب البيانات وحفظها في الكاش
            const [textRes, tafsirRes] = await Promise.all([
              fetch(textUrl),
              fetch(tafsirUrl)
            ]);

            if (textRes.ok && tafsirRes.ok) {
              await cache.put(textUrl, textRes.clone());
              await cache.put(tafsirUrl, tafsirRes.clone());
            }
            
            set({ bulkSyncProgress: Math.round((i / 114) * 100) });
          }
          
          storage.addAsset({
            id: 'quran-full-text',
            type: 'learning_asset',
            title: 'المصحف الشريف كاملاً (نص + تفسير)',
            sizeMB: 15
          });
          
          set({ isBulkSyncing: false });
        } catch (e) {
          set({ isBulkSyncing: false });
          console.error("Bulk Sync Failed", e);
        }
      }
    }),
    { 
      name: 'nexus-quran-registry-v1',
      version: 1 
    }
  )
);
