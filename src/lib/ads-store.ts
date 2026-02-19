
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, doc, getDocs, setDoc, updateDoc, query, orderBy, addDoc, deleteDoc, where } from 'firebase/firestore';

export type AdStatus = 'active' | 'pending_review' | 'rejected' | 'archived';

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  rewardAmount: number;
  status: AdStatus;
  category: 'promo' | 'news' | 'tutorial';
  createdAt: string;
  authorId: string;
  authorName: string;
  clicks: number;
}

/**
 * [STABILITY_ANCHOR: ADS_FETCH_V2]
 * محرك جلب الإعلانات - تم نقل الترتيب والتصفية لجانب العميل لتجنب أخطاء الفهرسة (Index Errors).
 */
export const getAds = async (status?: AdStatus): Promise<Ad[]> => {
  const { firestore } = initializeFirebase();
  try {
    // جلب المجموعة كاملة لتجنب الحاجة لفهارس مركبة
    const snap = await getDocs(collection(firestore, 'ads'));
    let ads = snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad));

    // التصفية حسب الحالة برمجياً
    if (status) {
      ads = ads.filter(ad => ad.status === status);
    }

    // الترتيب حسب التاريخ برمجياً (الأحدث أولاً)
    return ads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error("Fetch Ads Error:", e);
    return [];
  }
};

export const addAd = async (adData: Omit<Ad, 'id' | 'createdAt' | 'clicks' | 'status'>, isAdmin = false) => {
  const { firestore } = initializeFirebase();
  const docRef = await addDoc(collection(firestore, 'ads'), {
    ...adData,
    status: isAdmin ? 'active' : 'pending_review',
    clicks: 0,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updateAdStatus = async (id: string, status: AdStatus) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'ads', id), { status });
};

export const deleteAd = async (id: string) => {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'ads', id));
};

export const recordAdClick = async (id: string) => {
  const { firestore } = initializeFirebase();
  const adRef = doc(firestore, 'ads', id);
  // جلب البيانات الحالية لتحديث العداد
  const snap = await getDocs(query(collection(firestore, 'ads')));
  const ad = snap.docs.find(d => d.id === id);
  if (ad) {
    await updateDoc(adRef, { clicks: (ad.data().clicks || 0) + 1 });
  }
};
