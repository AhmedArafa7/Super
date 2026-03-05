
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, doc, getDocs, updateDoc, query, addDoc, where, limit, orderBy } from 'firebase/firestore';
import { MarketOffer } from './types';

export const addMarketOffer = async (productId: string, sellerId: string, itemTitle: string, offer: any) => {
  const { firestore } = initializeFirebase();
  await addDoc(collection(firestore, 'offers'), {
    ...offer,
    productId,
    sellerId,
    itemTitle,
    status: 'pending',
    timestamp: new Date().toISOString()
  });
  return true;
};

export const getReceivedOffers = async (userId: string): Promise<MarketOffer[]> => {
  const { firestore } = initializeFirebase();
  const q = query(collection(firestore, 'offers'), where('sellerId', '==', userId));
  const snap = await getDocs(q);
  const offers = snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketOffer));
  return offers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getAllOffersAdmin = async (): Promise<MarketOffer[]> => {
  const { firestore } = initializeFirebase();
  try {
    const q = query(collection(firestore, 'offers'), orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketOffer));
  } catch (e) {
    return [];
  }
};

export const respondToOffer = async (offerId: string, status: string, buyerId?: string, itemTitle?: string) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'offers', offerId), { status });
  // TODO: send notification to buyerId with itemTitle if provided
  return true;
};
