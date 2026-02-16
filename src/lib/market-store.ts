
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, addDoc, where } from 'firebase/firestore';

export type MarketItemStatus = 'active' | 'sold' | 'reserved' | 'archived';
export type MarketCategory = 'all' | 'ai_tools' | 'hardware' | 'services' | 'digital_assets';
export type OfferStatus = 'pending' | 'accepted' | 'rejected';
export type OfferType = 'price' | 'trade';

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  sellerId: string;
  imageUrl?: string;
  category: MarketCategory;
  stockQuantity: number;
  status: MarketItemStatus;
}

export interface MarketOffer {
  id: string;
  productId: string;
  itemTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  type: OfferType;
  value?: number;
  details?: string;
  status: OfferStatus;
  timestamp: string;
}

export const getMarketItems = async (search?: string, category?: MarketCategory): Promise<MarketItem[]> => {
  const { firestore } = initializeFirebase();
  const q = collection(firestore, 'products');
  const snap = await getDocs(q);
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketItem));
  
  if (category && category !== 'all') items = items.filter(i => i.category === category);
  if (search) items = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));
  
  return items;
};

export const addMarketItem = async (item: Omit<MarketItem, 'id' | 'status'>) => {
  const { firestore } = initializeFirebase();
  await addDoc(collection(firestore, 'products'), { ...item, status: 'active' });
};

export const addMarketOffer = async (offer: Omit<MarketOffer, 'id' | 'status' | 'timestamp'>) => {
  const { firestore } = initializeFirebase();
  await addDoc(collection(firestore, 'offers'), { ...offer, status: 'pending', timestamp: new Date().toISOString() });
};

export const getReceivedOffers = async (userId: string): Promise<MarketOffer[]> => {
  const { firestore } = initializeFirebase();
  const q = query(collection(firestore, 'offers'), where('sellerId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketOffer));
};

export const respondToOffer = async (offerId: string, status: OfferStatus) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'offers', offerId), { status });
};
