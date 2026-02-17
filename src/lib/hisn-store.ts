
'use client';

export interface ZikrItem {
  id: number;
  text: string;
  count: number;
  description?: string;
  reference?: string;
}

export interface HisnCategory {
  id: string;
  title: string;
  items: ZikrItem[];
}

export const HISN_DATA: HisnCategory[] = [
  {
    id: 'morning',
    title: 'أذكار الصباح',
    items: [
      {
        id: 1,
        text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.',
        count: 1,
        reference: 'رواه مسلم'
      },
      {
        id: 2,
        text: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ.',
        count: 1,
        reference: 'رواه الحاكم'
      },
      {
        id: 3,
        text: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ.',
        count: 100,
        description: 'حُطَّتْ خَطَايَاهُ وَإِنْ كَانَتْ مِثْلَ زَبَدِ الْبَحْرِ.'
      }
    ]
  },
  {
    id: 'evening',
    title: 'أذكار المساء',
    items: [
      {
        id: 4,
        text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ.',
        count: 1,
        reference: 'رواه مسلم'
      },
      {
        id: 5,
        text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ.',
        count: 1,
        reference: 'رواه الترمذي'
      }
    ]
  },
  {
    id: 'after-prayer',
    title: 'الأذكار بعد الصلاة',
    items: [
      {
        id: 6,
        text: 'أستغفر الله.',
        count: 3
      },
      {
        id: 7,
        text: 'اللهم أنت السلام ومنك السلام، تباركت يا ذا الجلال والإكرام.',
        count: 1
      }
    ]
  }
];

export const getHisnCategories = () => HISN_DATA;
