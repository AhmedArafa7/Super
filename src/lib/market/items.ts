
'use client';

import { initializeFirebase } from '@/firebase';
import { 
  collection, doc, getDocs, updateDoc, query, 
  addDoc, where, limit, increment, getDoc, orderBy, DocumentSnapshot, arrayUnion 
} from 'firebase/firestore';
import { MarketItem, MainCategory, MarketItemStatus } from './types';

export const getMarketItems = async (
  limitSize: number = 50, 
  lastDoc?: DocumentSnapshot,
  mainCat?: MainCategory,
  subCat?: string,
  search?: string,
  includePending = false
): Promise<{ items: MarketItem[], lastVisible: DocumentSnapshot | null }> => {
  const { firestore } = initializeFirebase();
  
  const q = query(collection(firestore, 'products'), limit(200));
  const snap = await getDocs(q);
  
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketItem));

  if (!includePending) {
    items = items.filter(i => i.status === 'active' || i.status === 'sold');
  }

  if (mainCat && mainCat !== 'all') {
    items = items.filter(i => i.mainCategory === mainCat);
  }
  if (subCat && subCat !== 'all_subs') {
    items = items.filter(i => i.subCategory === subCat);
  }
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(i => i.title.toLowerCase().includes(s) || i.description.toLowerCase().includes(s));
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { items: items.slice(0, limitSize), lastVisible: null };
};

export const addMarketItem = async (item: Omit<MarketItem, 'id' | 'status' | 'currency' | 'createdAt'>, isAdmin = false) => {
  const { firestore } = initializeFirebase();
  const docRef = await addDoc(collection(firestore, 'products'), { 
    ...item, 
    status: isAdmin ? 'active' : 'pending_review', 
    currency: 'Credits',
    createdAt: new Date().toISOString() 
  });
  return docRef.id;
};

export const updateMarketItem = async (itemId: string, updates: Partial<MarketItem>) => {
  const { firestore } = initializeFirebase();
  const itemRef = doc(firestore, 'products', itemId);
  const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
  await updateDoc(itemRef, cleanUpdates);
  return true;
};

export const decrementStock = async (itemId: string, buyerId?: string) => {
  const { firestore } = initializeFirebase();
  const itemRef = doc(firestore, 'products', itemId);
  const snap = await getDoc(itemRef);
  if (snap.exists()) {
    const currentStock = snap.data().stockQuantity || 0;
    if (currentStock > 0) {
      await updateDoc(itemRef, { 
        stockQuantity: increment(-1),
        status: currentStock <= 1 ? 'sold' : 'active',
        ...(buyerId ? { purchasedBy: arrayUnion(buyerId) } : {})
      });
      return true;
    }
  }
  return false;
};
