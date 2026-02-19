
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, doc, getDocs, setDoc, updateDoc, query, orderBy, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  rewardAmount: number;
  status: 'active' | 'archived';
  category: 'promo' | 'news' | 'tutorial';
  createdAt: string;
  expiryDate?: string;
  clicks: number;
}

/**
 * محرك إدارة الإعلانات في نكسوس - يتعامل مع السجل العالمي للإعلانات.
 */
export const getAds = async (): Promise<Ad[]> => {
  const { firestore } = initializeFirebase();
  try {
    const q = query(collection(firestore, 'ads'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad));
  } catch (e) {
    console.error("Fetch Ads Error:", e);
    return [];
  }
};

export const addAd = async (ad: Omit<Ad, 'id' | 'createdAt' | 'clicks' | 'status'>) => {
  const { firestore } = initializeFirebase();
  const docRef = await addDoc(collection(firestore, 'ads'), {
    ...ad,
    status: 'active',
    clicks: 0,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updateAd = async (id: string, updates: Partial<Ad>) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'ads', id), updates);
};

export const deleteAd = async (id: string) => {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'ads', id));
};

export const recordAdClick = async (id: string) => {
  const { firestore } = initializeFirebase();
  const adRef = doc(firestore, 'ads', id);
  // محاكاة زيادة العداد
  const snap = await getDocs(query(collection(firestore, 'ads')));
  const ad = snap.docs.find(d => d.id === id);
  if (ad) {
    await updateDoc(adRef, { clicks: (ad.data().clicks || 0) + 1 });
  }
};
