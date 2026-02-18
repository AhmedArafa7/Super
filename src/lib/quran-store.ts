
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QuranSurah {
  id: number;
  name: string;
  reciter: string;
  url: string;
  sizeMB: number;
  text?: string; // نص السورة للقراءة
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
  storageLimitMB: number;
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
  { 
    id: 1, 
    name: "الفاتحة", 
    reciter: "مشاري العفاسي", 
    url: "https://server8.mp3quran.net/afs/001.mp3", 
    sizeMB: 1.2,
    text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ (1) الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ (2) الرَّحْمَنِ الرَّحِيمِ (3) مَالِكِ يَوْمِ الدِّينِ (4) إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ (5) اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ (6) صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ (7)"
  },
  { 
    id: 2, 
    name: "البقرة", 
    reciter: "مشاري العفاسي", 
    url: "https://server8.mp3quran.net/afs/002.mp3", 
    sizeMB: 154.5,
    text: "الم (1) ذَلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِلْمُتَّقِينَ (2) الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنْفِقُونَ (3)... [تم اختصار النص للمساحة البرمجية]"
  },
  { 
    id: 18, 
    name: "الكهف", 
    reciter: "مشاري العفاسي", 
    url: "https://server8.mp3quran.net/afs/018.mp3", 
    sizeMB: 22.4,
    text: "الْحَمْدُ لِلَّهِ الَّذِي أَنْزَلَ عَلَى عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَلْ لَهُ عِوَجًا (1) قَيِّمًا لِيُنْذِرَ بَأْسًا شَدِيدًا مِنْ لَدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا (2)..."
  },
  { 
    id: 36, 
    name: "يس", 
    reciter: "مشاري العفاسي", 
    url: "https://server8.mp3quran.net/afs/036.mp3", 
    sizeMB: 12.8,
    text: "يس (1) وَالْقُرْآنِ الْحَكِيمِ (2) إِنَّكَ لَمِنَ الْمُرْسَلِينَ (3) عَلَى صِرَاطٍ مُسْتَقِيمٍ (4)..."
  },
  { 
    id: 67, 
    name: "الملك", 
    reciter: "مشاري العفاسي", 
    url: "https://server8.mp3quran.net/afs/067.mp3", 
    sizeMB: 4.5,
    text: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ (1) الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا وَهُوَ الْعَزِيزُ الْغَفُورُ (2)..."
  },
  { 
    id: 112, 
    name: "الإخلاص", 
    reciter: "مشاري العفاسي", 
    url: "https://server8.mp3quran.net/afs/112.mp3", 
    sizeMB: 0.5,
    text: "قُلْ هُوَ اللَّهُ أَحَدٌ (1) اللَّهُ الصَّمَدُ (2) لَمْ يَلِدْ وَلَمْ يُولَدْ (3) وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ (4)"
  },
];

export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      currentSurah: null,
      downloadedAssets: [],
      storageLimitMB: 500,
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
