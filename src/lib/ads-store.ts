
'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDocs, updateDoc, query,
  addDoc, deleteDoc, where, limit, increment,
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
  category: string;
  type: 'video' | 'image' | 'page' | 'sidebar' | 'banner' | 'feed';
  targetCategories?: string[];
  createdAt: string;
  authorId: string;
  authorName: string;
  clicks: number;
  impressions: number;
  rejectionReason?: string;
  cta?: string; // High-fidelity CTA label
}

/**
 * [STABILITY_ANCHOR: AD_VALIDATOR_V1.0]
 * Checks if ad data meets minimum quality and functional standards.
 */
export const validateAd = (ad: Partial<Ad>): { valid: boolean; error?: string } => {
  if (!ad.title || ad.title.length < 5) return { valid: false, error: "العنوان قصير جداً" };
  if (!ad.imageUrls || ad.imageUrls.length === 0) return { valid: false, error: "يجب اختيار صورة واحدة على الأقل" };
  if (!ad.linkUrl || !ad.linkUrl.startsWith('http')) return { valid: false, error: "رابط التوجه غير صالح" };
  return { valid: true };
};

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


export const updateAdStatus = async (id: string, status: AdStatus, rejectionReason?: string) => {
  const { firestore } = initializeFirebase();
  const updateData: any = { status };
  if (rejectionReason) updateData.rejectionReason = rejectionReason;
  await updateDoc(doc(firestore, 'ads', id), updateData);
};

export const addAd = async (adData: Omit<Ad, 'id' | 'createdAt' | 'clicks' | 'impressions' | 'status'>, isAdmin = false) => {
  const validation = validateAd(adData);
  if (!validation.valid) throw new Error(validation.error);

  const { firestore } = initializeFirebase();
  try {
    const docRef = await addDoc(collection(firestore, 'ads'), {
      ...adData,
      status: isAdmin ? 'active' : 'pending_review',
      clicks: 0,
      impressions: 0,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("[ADS_STORE_ERROR] Failed to add ad:", error);
    throw error;
  }
};

export const recordAdClick = async (id: string) => {
  const { firestore } = initializeFirebase();
  const adRef = doc(firestore, 'ads', id);
  try {
     // Direct increment for maximum performance and atomicity
     await updateDoc(adRef, { clicks: increment(1) });
  } catch (e) {
    console.error("[ADS_STORE_ERROR] Failed to record click:", e);
  }
};

export const recordAdImpression = async (id: string) => {
  const { firestore } = initializeFirebase();
  const adRef = doc(firestore, 'ads', id);
  try {
    await updateDoc(adRef, { impressions: increment(1) });
  } catch (e) {
    console.error("[ADS_STORE_ERROR] Failed to record impression:", e);
  }
};

export const deleteAd = async (id: string) => {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'ads', id));
};

/**
 * [NEURAL_AD_FETCHER] جلب الإعلانات المستهدفة بناءً على الفئات
 */
export const fetchTargetedAds = async (type: Ad['type'], category?: string): Promise<Ad[]> => {
  const { firestore } = initializeFirebase();
  try {
    let q;
    if (category && category !== "الكل") {
      q = query(
        collection(firestore, 'ads'),
        where('type', '==', type),
        where('status', '==', 'active'),
        where('targetCategories', 'array-contains', category),
        limit(5)
      );
    } else {
      q = query(
        collection(firestore, 'ads'),
        where('type', '==', type),
        where('status', '==', 'active'),
        limit(5)
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad));
  } catch (e) {
    return [];
  }
};
