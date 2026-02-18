
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
  text?: string; 
}

interface QuranState {
  currentSurah: QuranSurah | null;
  isPlaying: boolean;
  
  setCurrentSurah: (surah: QuranSurah | null) => void;
  setIsPlaying: (playing: boolean) => void;
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
    text: "الم (1) ذَلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِلْمُتَّقِينَ (2) الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنْفِقُونَ (3) وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنْزِلَ إِلَيْكَ وَمَا أُنْزِلَ مِنْ قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ (4) أُولَئِكَ عَلَى هُدًى مِنْ رَبِّهِمْ وَأُولَئِكَ هُمُ الْمُفْلِحُونَ (5) إِنَّ الَّذِينَ كَفَرُوا سَواءٌ عَلَيْهِمْ أَأَنْذَرْتَهُمْ أَمْ لَمْ تُنْذِرْهُمْ لا يُؤْمِنُونَ (6) خَتَمَ اللَّهُ عَلى قُلُوبِهِمْ وَعَلى سَمْعِهِمْ وَعَلى أَبْصارِهِمْ غِشاوَةٌ وَلَهُمْ عَذابٌ عَظِيمٌ (7) إِنَّ الَّذِينَ اشْتَرَوُا الضَّلالَةَ بِالْهُدَى فَما رَبِحَتْ تِجارَتُهُمْ وَما كانُوا مُهْتَدِينَ (8) مَثَلُهُمْ كَمَثَلِ الَّذِي اسْتَوْقَدَ ناراً فَلَمَّا أَضاءَتْ ما حَوْلَهُ ذَهَبَ اللَّهُ بِنُورِهِمْ وَتَرَكَهُمْ فِي ظُلُماتٍ لا يُبْصِرُونَ (9) صُمٌّ بُكْمٌ عُمْيٌ فَهُمْ لا يَرْجِعُونَ (10)"
  },
  { 
    id: 112, 
    name: "الإخلاص", 
    reciter: "مشاري العفاسي", 
    url: "https://server8.mp3quran.net/afs/112.mp3", 
    sizeMB: 0.5,
    text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ هُوَ اللَّهُ أَحَدٌ (1) اللَّهُ الصَّمَدُ (2) لَمْ يَلِدْ وَلَمْ يُولَدْ (3) وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ (4)"
  },
];

export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      currentSurah: null,
      isPlaying: false,

      setCurrentSurah: (surah) => {
        set({ currentSurah: surah, isPlaying: !!surah });
        if (surah) {
          useGlobalStorage.getState().addAsset({
            id: `quran-${surah.id}`,
            type: 'quran',
            title: surah.name,
            sizeMB: surah.sizeMB
          });
        }
      },

      setIsPlaying: (isPlaying) => set({ isPlaying }),
    }),
    { name: 'nexus-quran-prefs' }
  )
);
