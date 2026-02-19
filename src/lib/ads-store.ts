
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
 * محرك إدارة الإعلانات في نكسوس - يدعم السيادة الإدارية ومساهمات المستخدمين.
 */
export const getAds = async (status?: AdStatus): Promise<Ad[]> => {
  const { firestore } = initializeFirebase();
  try {
    let q = query(collection(firestore, 'ads'), orderBy('createdAt', 'desc'));
    
    if (status) {
      q = query(collection(firestore, 'ads'), where('status', '==', status), orderBy('createdAt', 'desc'));
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
  // محاكاة زيادة العداد مع التحقق
  const snap = await getDocs(query(collection(firestore, 'ads')));
  const ad = snap.docs.find(d => d.id === id);
  if (ad) {
    await updateDoc(adRef, { clicks: (ad.data().clicks || 0) + 1 });
  }
};
