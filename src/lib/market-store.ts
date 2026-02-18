'use client';

import { initializeFirebase } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, addDoc, where } from 'firebase/firestore';

export type MarketItemStatus = 'active' | 'sold' | 'reserved' | 'archived';
export type AppVersionStatus = 'final' | 'beta';

// نظام التصنيفات الهرمي المطور ليشمل التطبيقات
export type MainCategory = 'all' | 'electronics' | 'digital_assets' | 'services' | 'tools' | 'education' | 'software';

export interface SubCategory {
  id: string;
  label: string;
  parent: MainCategory;
}

export const SUB_CATEGORIES: SubCategory[] = [
  // Electronics
  { id: 'hardware', label: 'Hardware & Circuits', parent: 'electronics' },
  { id: 'sensors', label: 'Sensors & IoT', parent: 'electronics' },
  { id: 'peripherals', label: 'Peripherals', parent: 'electronics' },
  // Digital Assets
  { id: 'ai_models', label: 'AI Models', parent: 'digital_assets' },
  { id: 'scripts', label: 'Scripts & Automation', parent: 'digital_assets' },
  { id: 'templates', label: 'Design Templates', parent: 'digital_assets' },
  // Services
  { id: 'dev_ops', label: 'Cloud & DevOps', parent: 'services' },
  { id: 'neural_training', label: 'Neural Training', parent: 'services' },
  { id: 'consulting', label: 'Technical Consulting', parent: 'services' },
  // Tools
  { id: 'ai_agents', label: 'Autonomous Agents', parent: 'tools' },
  { id: 'plugins', label: 'IDE Plugins', parent: 'tools' },
  // Education
  { id: 'datasets', label: 'Datasets', parent: 'education' },
  { id: 'courses', label: 'Knowledge Packs', parent: 'education' },
  // Software
  { id: 'web_apps', label: 'Web Applications', parent: 'software' },
  { id: 'desktop_tools', label: 'Desktop Executables', parent: 'software' },
  { id: 'mobile_nodes', label: 'Mobile Deployment', parent: 'software' },
];

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  sellerId: string;
  ownerId: string; 
  imageUrl?: string;
  mainCategory: MainCategory;
  subCategory: string;
  stockQuantity: number;
  status: MarketItemStatus;
  currency: string;
  createdAt: string;
  // App Specific Properties
  isLaunchable?: boolean;
  launchUrl?: string;
  downloadUrl?: string;
  framework?: string;
  versionStatus?: AppVersionStatus;
}

export interface MarketOffer {
  id: string;
  productId: string;
  itemTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  type: 'price' | 'trade';
  value?: number;
  details?: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export const getMarketItems = async (
  offset: number = 0, 
  limitSize: number = 12, 
  search?: string, 
  mainCat?: MainCategory,
  subCat?: string
): Promise<{ items: MarketItem[], hasMore: boolean }> => {
  const { firestore } = initializeFirebase();
  let q = query(collection(firestore, 'products'), orderBy('createdAt', 'desc'));
  
  const snap = await getDocs(q);
  let items = snap.docs.map(d => ({ 
    id: d.id, 
    ...d.data(),
    ownerId: d.data().sellerId 
  } as MarketItem));
  
  if (mainCat && mainCat !== 'all') {
    items = items.filter(i => i.mainCategory === mainCat);
  }

  if (subCat && subCat !== 'all_subs') {
    items = items.filter(i => i.subCategory === subCat);
  }
  
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(i => 
      i.title.toLowerCase().includes(s) || 
      i.description.toLowerCase().includes(s)
    );
  }

  const paginated = items.slice(offset, offset + limitSize);
  return {
    items: paginated,
    hasMore: items.length > (offset + limitSize)
  };
};

export const addMarketItem = async (item: Omit<MarketItem, 'id' | 'status' | 'currency' | 'ownerId' | 'createdAt'>) => {
  const { firestore } = initializeFirebase();
  const docRef = await addDoc(collection(firestore, 'products'), { 
    ...item, 
    status: 'active', 
    currency: 'Credits',
    createdAt: new Date().toISOString() 
  });
  return docRef.id;
};

export const updateMarketItem = async (itemId: string, updates: Partial<MarketItem>) => {
  const { firestore } = initializeFirebase();
  const itemRef = doc(firestore, 'products', itemId);
  await updateDoc(itemRef, updates);
  return true;
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
  const q = query(collection(firestore, 'offers'), where('sellerId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketOffer))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const respondToOffer = async (offerId: string, status: 'accepted' | 'rejected', buyerId: string, itemTitle: string) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'offers', offerId), { status });
  return true;
};
