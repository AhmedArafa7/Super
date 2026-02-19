
'use client';

import { initializeFirebase } from '@/firebase';
import { 
  collection, doc, getDocs, updateDoc, query, 
  orderBy, addDoc, deleteDoc, where, limit, startAfter,
  DocumentSnapshot
} from 'firebase/firestore';

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
 * [STABILITY_ANCHOR: ADS_PAGINATED_V8]
 * جلب الإعلانات بنظام التجزئة (Pagination) لتقليل استهلاك البيانات والبطارية.
 */
export const getAds = async (status?: AdStatus, limitSize = 15): Promise<Ad[]> => {
  const { firestore } = initializeFirebase();
  try {
    let q = query(
      collection(firestore, 'ads'),
      orderBy('createdAt', 'desc'),
      limit(limitSize)
    );

    if (status) {
      // يتطلب فهرس مركب (status + createdAt)
      q = query(q, where('status', '==', status));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad));
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
  // تحديث العداد مباشرة في السيرفر لتقليل البيانات المتبادلة
  const snap = await getDocs(query(collection(firestore, 'ads'), limit(100))); // محاكاة لجلب الوثيقة
  const adDoc = snap.docs.find(d => d.id === id);
  if (adDoc) {
    await updateDoc(adRef, { clicks: (adDoc.data().clicks || 0) + 1 });
  }
};
