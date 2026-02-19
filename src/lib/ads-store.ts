
'use client';

import { initializeFirebase } from '@/firebase';
import { 
  collection, doc, getDocs, updateDoc, query, 
  orderBy, addDoc, deleteDoc, where, limit, startAfter,
  DocumentSnapshot, QueryConstraint
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
 * [STABILITY_ANCHOR: ADS_PAGINATED_V9]
 * جلب الإعلانات بنظام التجزئة القائم على المؤشر (Cursor) لتقليل الضغط على السيرفر.
 */
export const getAds = async (
  status?: AdStatus, 
  limitSize = 15,
  lastDoc?: DocumentSnapshot
): Promise<{ ads: Ad[], lastVisible: DocumentSnapshot | null }> => {
  const { firestore } = initializeFirebase();
  try {
    let constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
      limit(limitSize)
    ];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(collection(firestore, 'ads'), ...constraints);
    const snap = await getDocs(q);
    
    const ads = snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad));
    const lastVisible = snap.docs[snap.docs.length - 1] || null;

    return { ads, lastVisible };
  } catch (e) {
    console.error("Fetch Ads Error:", e);
    return { ads: [], lastVisible: null };
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
  // نستخدم تحديثاً جزئياً لتوفير القراءة
  try {
    await updateDoc(adRef, { 
      clicks: (await (await getDocs(query(collection(firestore, 'ads'), limit(1)))).docs[0]?.data()?.clicks || 0) + 1 
    });
  } catch (e) {}
};
