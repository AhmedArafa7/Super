
'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDocs, updateDoc, query,
  addDoc, deleteDoc, where, limit,
  DocumentSnapshot, QueryConstraint
} from 'firebase/firestore';

export type AdStatus = 'active' | 'pending_review' | 'rejected' | 'archived';

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrls: string[];
  linkUrl: string;
  rewardAmount: number;
  status: AdStatus;
  category: 'promo' | 'news' | 'tutorial';
  type: 'video' | 'image' | 'page';
  createdAt: string;
  authorId: string;
  authorName: string;
  clicks: number;
  rejectionReason?: string;
}

/**
 * [STABILITY_ANCHOR: CLIENT_SIDE_ADS_V1]
 * العودة لمنطق العميل لتجنب أخطاء الفهرسة.
 */
export const getAds = async (
  status?: AdStatus,
  limitSize = 15,
  cursor?: DocumentSnapshot | null
): Promise<{ ads: Ad[], lastVisible: DocumentSnapshot | null }> => {
  const { firestore } = initializeFirebase();
  try {
    const q = query(collection(firestore, 'ads'), limit(100));
    const snap = await getDocs(q);

    let ads = snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad));

    // تصفية وترتيب في المتصفح
    if (status) {
      ads = ads.filter(a => a.status === status);
    }

    ads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { ads: ads.slice(0, limitSize), lastVisible: null };
  } catch (e) {
    console.error("Fetch Ads Error:", e);
    return { ads: [], lastVisible: null };
  }
};

export const getUserAds = async (userId: string): Promise<Ad[]> => {
  const { firestore } = initializeFirebase();
  try {
    const q = query(collection(firestore, 'ads'), where('authorId', '==', userId));
    const snap = await getDocs(q);
    const ads = snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad));
    return ads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error("Fetch User Ads Error:", e);
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

export const updateAdStatus = async (id: string, status: AdStatus, rejectionReason?: string) => {
  const { firestore } = initializeFirebase();
  const updateData: any = { status };
  if (rejectionReason) updateData.rejectionReason = rejectionReason;
  await updateDoc(doc(firestore, 'ads', id), updateData);
};

export const deleteAd = async (id: string) => {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'ads', id));
};

export const recordAdClick = async (id: string) => {
  const { firestore } = initializeFirebase();
  const adRef = doc(firestore, 'ads', id);
  try {
    const snap = await getDocs(query(collection(firestore, 'ads'), limit(1)));
    const currentClicks = snap.docs[0]?.data()?.clicks || 0;
    await updateDoc(adRef, { clicks: currentClicks + 1 });
  } catch (e) { }
};
