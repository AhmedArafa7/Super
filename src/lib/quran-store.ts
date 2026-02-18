
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

const SURAH_NAMES = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس"
];

// توليد قائمة الـ 114 سورة آلياً مع أحجام منطقية (Heuristic calculation)
export const QURAN_DATA: QuranSurah[] = SURAH_NAMES.map((name, index) => {
  const id = index + 1;
  const paddedId = id.toString().padStart(3, '0');
  
  // منطق أحجام الملفات المنطقي (تقديري بناءً على طول السور)
  let sizeMB = 5;
  if (id === 1) sizeMB = 1.2; // الفاتحة قصيرة جداً
  else if (id === 2) sizeMB = 145; // البقرة طويلة جداً
  else if (id === 3) sizeMB = 95;  // آل عمران
  else if (id === 4) sizeMB = 105; // النساء
  else if (id < 10) sizeMB = 60;
  else if (id < 30) sizeMB = 35;
  else if (id > 100) sizeMB = 1.5; // السور القصيرة في الجزء الثلاثين
  else sizeMB = 12;

  return {
    id,
    name,
    reciter: "مشاري العفاسي",
    url: `https://server8.mp3quran.net/afs/${paddedId}.mp3`,
    sizeMB,
    text: id === 1 ? "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ (1) الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ (2) الرَّحْمَنِ الرَّحِيمِ (3) مَالِكِ يَوْمِ الدِّينِ (4) إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ (5) اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ (6) صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ (7)" : undefined
  };
});

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
