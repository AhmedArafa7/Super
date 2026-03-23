'use client';

/**
 * [STABILITY_ANCHOR: DEALS_STORE_V1.0]
 * مخزن بيانات عروض المحلات — Firestore-based مع بحث وفلترة ومقارنة أسعار.
 */

import { initializeFirebase } from '@/firebase';
import {
  collection, addDoc, getDocs, doc, updateDoc, query,
  where, orderBy, limit, increment, Timestamp, getDoc, deleteDoc
} from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────

export type DealCategory =
  | 'groceries'      // مواد غذائية
  | 'vegetables'     // خضار وفاكهة
  | 'meat'           // لحوم ودواجن
  | 'dairy'          // ألبان وأجبان
  | 'drinks'         // مشروبات
  | 'cleaning'       // منظفات
  | 'personal_care'  // عناية شخصية
  | 'snacks'         // سناكس وحلويات
  | 'other';         // أخرى

export const DEAL_CATEGORIES: { id: DealCategory; label: string; emoji: string }[] = [
  { id: 'groceries',     label: 'مواد غذائية',    emoji: '🍚' },
  { id: 'vegetables',    label: 'خضار وفاكهة',    emoji: '🥬' },
  { id: 'meat',          label: 'لحوم ودواجن',    emoji: '🥩' },
  { id: 'dairy',         label: 'ألبان وأجبان',   emoji: '🧀' },
  { id: 'drinks',        label: 'مشروبات',        emoji: '🥤' },
  { id: 'cleaning',      label: 'منظفات',         emoji: '🧹' },
  { id: 'personal_care', label: 'عناية شخصية',    emoji: '🧴' },
  { id: 'snacks',        label: 'سناكس وحلويات',  emoji: '🍫' },
  { id: 'other',         label: 'أخرى',           emoji: '📦' },
];

export interface Store {
  id: string;
  name: string;
  address: string;
  type: string;             // مثل: سوبر ماركت، وكالة، بقالة
  lat: number;
  lng: number;
  source: 'google' | 'foursquare' | 'manual';
  placeId?: string;         // Google Place ID for deduplication
  rating?: number;
  dealsCount: number;
}

export interface Deal {
  id: string;
  storeId: string;
  storeName: string;         // denormalized for fast queries
  productName: string;
  price: number;
  originalPrice?: number;    // سعر قبل الخصم
  category: DealCategory;
  unit?: string;             // مثل: كجم، لتر، علبة
  addedBy: string;           // user ID
  addedByName: string;       // username
  createdAt: string;
  expiresAt?: string;        // تاريخ انتهاء العرض
  confirmations: number;     // عدد المستخدمين اللي أكدوا السعر
  reports: number;           // عدد الإبلاغات عن سعر غلط
  confirmedBy: string[];     // قائمة user IDs اللي أكدوا
  reportedBy: string[];      // قائمة user IDs اللي أبلغوا
}

// ─── Store CRUD ──────────────────────────────────────────────────

export const addStore = async (store: Omit<Store, 'id' | 'dealsCount'>): Promise<string> => {
  const { firestore } = initializeFirebase();
  const ref = await addDoc(collection(firestore, 'stores'), {
    ...store,
    dealsCount: 0,
  });
  return ref.id;
};

export const getStores = async (): Promise<Store[]> => {
  const { firestore } = initializeFirebase();
  const snap = await getDocs(collection(firestore, 'stores'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Store));
};

export const getStoreById = async (storeId: string): Promise<Store | null> => {
  const { firestore } = initializeFirebase();
  const d = await getDoc(doc(firestore, 'stores', storeId));
  return d.exists() ? { id: d.id, ...d.data() } as Store : null;
};

// ─── Deal CRUD ───────────────────────────────────────────────────

export const addDeal = async (deal: Omit<Deal, 'id' | 'confirmations' | 'reports' | 'confirmedBy' | 'reportedBy'>): Promise<string> => {
  const { firestore } = initializeFirebase();
  const ref = await addDoc(collection(firestore, 'deals'), {
    ...deal,
    confirmations: 0,
    reports: 0,
    confirmedBy: [],
    reportedBy: [],
  });
  // Increment deals count on store
  await updateDoc(doc(firestore, 'stores', deal.storeId), {
    dealsCount: increment(1),
  });
  return ref.id;
};

export const getDeals = async (
  categoryFilter?: DealCategory,
  limitCount: number = 50
): Promise<Deal[]> => {
  const { firestore } = initializeFirebase();
  const constraints: any[] = [];
  if (categoryFilter) constraints.push(where('category', '==', categoryFilter));
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(limitCount));

  const q = query(collection(firestore, 'deals'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Deal));
};

export const getDealsByStore = async (storeId: string): Promise<Deal[]> => {
  const { firestore } = initializeFirebase();
  const q = query(
    collection(firestore, 'deals'),
    where('storeId', '==', storeId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Deal));
};

// ─── Search ──────────────────────────────────────────────────────

/** بحث عن منتج — يجلب كل العروض اللي فيها المنتج ويرتبها بالسعر */
export const searchDealsByProduct = async (productName: string): Promise<Deal[]> => {
  const { firestore } = initializeFirebase();
  // Firestore doesn't support full-text search, so we fetch all and filter client-side
  const snap = await getDocs(collection(firestore, 'deals'));
  const allDeals = snap.docs.map(d => ({ id: d.id, ...d.data() } as Deal));
  const searchTerms = (productName?.toLowerCase()?.trim() ?? "").split(/\s+/);
  return allDeals
    .filter(deal => {
      const name = (deal.productName?.toLowerCase() ?? "");
      return searchTerms.every(term => name.includes(term));
    })
    .sort((a, b) => a.price - b.price); // ترتيب بالأرخص
};

/** بحث عن محل بالاسم */
export const searchStoresByName = async (name: string): Promise<Store[]> => {
  const stores = await getStores();
  const searchTerm = name?.toLowerCase()?.trim() ?? "";
  return stores.filter(s => (s.name?.toLowerCase() ?? "").includes(searchTerm));
};

// ─── Confirm / Report ────────────────────────────────────────────

export const confirmDeal = async (dealId: string, userId: string): Promise<void> => {
  const { firestore } = initializeFirebase();
  const dealRef = doc(firestore, 'deals', dealId);
  const d = await getDoc(dealRef);
  if (!d.exists()) return;
  const data = d.data();
  if ((data.confirmedBy || []).includes(userId)) return; // already confirmed
  await updateDoc(dealRef, {
    confirmations: increment(1),
    confirmedBy: [...(data.confirmedBy || []), userId],
  });
};

export const reportDeal = async (dealId: string, userId: string): Promise<void> => {
  const { firestore } = initializeFirebase();
  const dealRef = doc(firestore, 'deals', dealId);
  const d = await getDoc(dealRef);
  if (!d.exists()) return;
  const data = d.data();
  if ((data.reportedBy || []).includes(userId)) return; // already reported
  await updateDoc(dealRef, {
    reports: increment(1),
    reportedBy: [...(data.reportedBy || []), userId],
  });
};

// ─── Distance Calculation ────────────────────────────────────────

/** حساب المسافة بالكيلومتر بين نقطتين (Haversine formula) */
export const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Seed Data ───────────────────────────────────────────────────

/** بيانات تجريبية للمحلات والعروض — تُستدعى مرة واحدة */
export const seedDealsData = async (userId: string, userName: string): Promise<void> => {
  const { firestore } = initializeFirebase();
  // Check if data already exists
  const existing = await getDocs(query(collection(firestore, 'stores'), limit(1)));
  if (!existing.empty) return;

  // المنصورة coordinates: 31.0409, 31.3785
  const stores: Omit<Store, 'id' | 'dealsCount'>[] = [
    { name: 'النقيطي', address: 'شارع الجمهورية، المنصورة', type: 'سوبر ماركت', lat: 31.0425, lng: 31.3800, source: 'manual' },
    { name: 'كازيون', address: 'شارع بنك مصر، المنصورة', type: 'سوبر ماركت', lat: 31.0395, lng: 31.3770, source: 'manual' },
    { name: 'وكالة المنصورة', address: 'ميدان أم كلثوم، المنصورة', type: 'وكالة جملة', lat: 31.0410, lng: 31.3790, source: 'manual' },
    { name: 'خير زمان', address: 'شارع السلاب، المنصورة', type: 'سوبر ماركت', lat: 31.0380, lng: 31.3812, source: 'manual' },
    { name: 'أولاد رجب', address: 'طريق المنصورة طلخا، المنصورة', type: 'هايبر ماركت', lat: 31.0450, lng: 31.3750, source: 'manual' },
  ];

  const storeIds: string[] = [];
  for (const store of stores) {
    const id = await addStore(store);
    storeIds.push(id);
  }

  const now = new Date().toISOString();
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const in1Day = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const deals: Omit<Deal, 'id' | 'confirmations' | 'reports' | 'confirmedBy' | 'reportedBy'>[] = [
    // أرز
    { storeId: storeIds[0], storeName: 'النقيطي', productName: 'أرز مصري 5 كجم', price: 42, originalPrice: 55, category: 'groceries', unit: '5 كجم', addedBy: userId, addedByName: userName, createdAt: now, expiresAt: in3Days },
    { storeId: storeIds[1], storeName: 'كازيون', productName: 'أرز مصري 5 كجم', price: 50, originalPrice: 52, category: 'groceries', unit: '5 كجم', addedBy: userId, addedByName: userName, createdAt: now, expiresAt: in7Days },
    { storeId: storeIds[2], storeName: 'وكالة المنصورة', productName: 'أرز مصري 5 كجم', price: 48, category: 'groceries', unit: '5 كجم', addedBy: userId, addedByName: userName, createdAt: now },
    { storeId: storeIds[4], storeName: 'أولاد رجب', productName: 'أرز مصري 5 كجم', price: 45, originalPrice: 58, category: 'groceries', unit: '5 كجم', addedBy: userId, addedByName: userName, createdAt: now, expiresAt: in7Days },
    // زيت
    { storeId: storeIds[0], storeName: 'النقيطي', productName: 'زيت عباد الشمس 1 لتر', price: 65, originalPrice: 75, category: 'groceries', unit: '1 لتر', addedBy: userId, addedByName: userName, createdAt: now, expiresAt: in3Days },
    { storeId: storeIds[3], storeName: 'خير زمان', productName: 'زيت عباد الشمس 1 لتر', price: 70, category: 'groceries', unit: '1 لتر', addedBy: userId, addedByName: userName, createdAt: now },
    { storeId: storeIds[4], storeName: 'أولاد رجب', productName: 'زيت عباد الشمس 1 لتر', price: 62, originalPrice: 78, category: 'groceries', unit: '1 لتر', addedBy: userId, addedByName: userName, createdAt: now, expiresAt: in1Day },
    // سكر
    { storeId: storeIds[1], storeName: 'كازيون', productName: 'سكر 1 كجم', price: 28, category: 'groceries', unit: '1 كجم', addedBy: userId, addedByName: userName, createdAt: now },
    { storeId: storeIds[2], storeName: 'وكالة المنصورة', productName: 'سكر 1 كجم', price: 25, originalPrice: 30, category: 'groceries', unit: '1 كجم', addedBy: userId, addedByName: userName, createdAt: now, expiresAt: in7Days },
    // لحوم
    { storeId: storeIds[0], storeName: 'النقيطي', productName: 'فراخ طازة 1 كجم', price: 105, originalPrice: 120, category: 'meat', unit: '1 كجم', addedBy: userId, addedByName: userName, createdAt: now, expiresAt: in1Day },
    { storeId: storeIds[4], storeName: 'أولاد رجب', productName: 'فراخ طازة 1 كجم', price: 98, originalPrice: 115, category: 'meat', unit: '1 كجم', addedBy: userId, addedByName: userName, createdAt: now, expiresAt: in3Days },
    // ألبان
    { storeId: storeIds[1], storeName: 'كازيون', productName: 'جبنة بيضاء 1 كجم', price: 80, category: 'dairy', unit: '1 كجم', addedBy: userId, addedByName: userName, createdAt: now },
    { storeId: storeIds[3], storeName: 'خير زمان', productName: 'جبنة بيضاء 1 كجم', price: 85, originalPrice: 95, category: 'dairy', unit: '1 كجم', addedBy: userId, addedByName: userName, createdAt: now, expiresAt: in3Days },
    // منظفات
    { storeId: storeIds[1], storeName: 'كازيون', productName: 'بريل صابون أطباق 1 لتر', price: 32, originalPrice: 40, category: 'cleaning', unit: '1 لتر', addedBy: userId, addedByName: userName, createdAt: now, expiresAt: in7Days },
    { storeId: storeIds[0], storeName: 'النقيطي', productName: 'بريل صابون أطباق 1 لتر', price: 35, category: 'cleaning', unit: '1 لتر', addedBy: userId, addedByName: userName, createdAt: now },
    // مشروبات
    { storeId: storeIds[4], storeName: 'أولاد رجب', productName: 'بيبسي 1 لتر', price: 18, originalPrice: 22, category: 'drinks', unit: '1 لتر', addedBy: userId, addedByName: userName, createdAt: now, expiresAt: in3Days },
    { storeId: storeIds[3], storeName: 'خير زمان', productName: 'بيبسي 1 لتر', price: 20, category: 'drinks', unit: '1 لتر', addedBy: userId, addedByName: userName, createdAt: now },
  ];

  for (const deal of deals) {
    await addDeal(deal);
  }
};
