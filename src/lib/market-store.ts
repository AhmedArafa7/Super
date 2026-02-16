
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, addDoc, where, limit, startAfter } from 'firebase/firestore';

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
  currency: string;
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

export const getMarketItems = async (
  offset: number = 0, 
  limitSize: number = 12, 
  search?: string, 
  category?: MarketCategory
): Promise<{ items: MarketItem[], hasMore: boolean }> => {
  const { firestore } = initializeFirebase();
  let q = query(collection(firestore, 'products'), orderBy('title'));
  
  const snap = await getDocs(q);
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketItem));
  
  if (category && category !== 'all') {
    items = items.filter(i => i.category === category);
  }
  
  if (search) {
    items = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));
  }

  const paginated = items.slice(offset, offset + limitSize);
  return {
    items: paginated,
    hasMore: items.length > (offset + limitSize)
  };
};

export const addMarketItem = async (item: Omit<MarketItem, 'id' | 'status' | 'currency'>) => {
  const { firestore } = initializeFirebase();
  await addDoc(collection(firestore, 'products'), { 
    ...item, 
    status: 'active', 
    currency: 'Credits',
    createdAt: new Date().toISOString() 
  });
};

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
  const q = query(collection(firestore, 'offers'), where('sellerId', '==', userId), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketOffer));
};

export const respondToOffer = async (offerId: string, status: OfferStatus, buyerId: string, itemTitle: string) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'offers', offerId), { status });
  // Logic for wallet transfers could be added here if offer is accepted
  return true;
};
