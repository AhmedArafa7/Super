
'use client';

import { initializeFirebase } from '@/firebase';
import { 
  collection, doc, getDocs, updateDoc, query, 
  orderBy, addDoc, where, limit, startAfter,
  QueryConstraint
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export type MarketItemStatus = 'active' | 'sold' | 'reserved' | 'archived';
export type AppVersionStatus = 'final' | 'beta';
export type MainCategory = 'all' | 'electronics' | 'digital_assets' | 'services' | 'tools' | 'education' | 'software';

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
  isLaunchable?: boolean;
  launchUrl?: string;
  downloadUrl?: string;
  framework?: string;
  versionStatus?: AppVersionStatus;
}

/**
 * [STABILITY_ANCHOR: SUB_CATEGORIES_DEFINITION]
 * قائمة التصنيفات الفرعية الموحدة للنظام لضمان دقة الفهرسة والبحث.
 */
export const SUB_CATEGORIES = [
  // electronics
  { id: 'smartphones', label: 'هواتف ذكية', parent: 'electronics' },
  { id: 'laptops', label: 'حواسيب محمولة', parent: 'electronics' },
  { id: 'accessories', label: 'إكسسوارات', parent: 'electronics' },
  // digital_assets
  { id: 'scripts', label: 'سكربتات برمجية', parent: 'digital_assets' },
  { id: 'templates', label: 'قوالب تصميم', parent: 'digital_assets' },
  { id: 'graphics', label: 'أصول جرافيك', parent: 'digital_assets' },
  // services
  { id: 'dev_service', label: 'تطوير برمجيات', parent: 'services' },
  { id: 'design_service', label: 'تصميم جرافيك', parent: 'services' },
  { id: 'consulting', label: 'استشارات تقنية', parent: 'services' },
  // tools
  { id: 'ai_models', label: 'نماذج ذكاء اصطناعي', parent: 'tools' },
  { id: 'automation', label: 'أدوات أتمتة', parent: 'tools' },
  { id: 'data_analysis', label: 'تحليل بيانات', parent: 'tools' },
  // education
  { id: 'courses', label: 'دورات تعليمية', parent: 'education' },
  { id: 'ebooks', label: 'كتب تقنية', parent: 'education' },
  { id: 'tutorials', label: 'دروس تطبيقية', parent: 'education' },
  // software
  { id: 'web_apps', label: 'تطبيقات ويب', parent: 'software' },
  { id: 'mobile_apps', label: 'تطبيقات جوال', parent: 'software' },
  { id: 'desktop_apps', label: 'تطبيقات ديسكتوب', parent: 'software' },
];

/**
 * [STABILITY_ANCHOR: MARKET_TRUE_PAGINATION_V8]
 * جلب منتجات المتجر مع التصفية والترتيب في السيرفر لراحة العميل.
 */
export const getMarketItems = async (
  offset: number = 0,
  limitSize: number = 12, 
  search?: string, 
  mainCat?: MainCategory,
  subCat?: string
): Promise<{ items: MarketItem[] }> => {
  const { firestore } = initializeFirebase();
  
  let constraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc'),
    limit(limitSize)
  ];

  if (mainCat && mainCat !== 'all') {
    constraints.push(where('mainCategory', '==', mainCat));
  }

  if (subCat && subCat !== 'all_subs') {
    constraints.push(where('subCategory', '==', subCat));
  }

  const q = query(collection(firestore, 'products'), ...constraints);
  const snap = await getDocs(q);
  
  let items = snap.docs.map(d => ({ 
    id: d.id, 
    ...d.data(),
    ownerId: d.data().sellerId 
  } as MarketItem));

  if (search) {
    const s = search.toLowerCase();
    items = items.filter(i => 
      i.title.toLowerCase().includes(s) || 
      i.description.toLowerCase().includes(s)
    );
  }

  return { items };
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

export const uploadMarketImage = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
  const { storage } = initializeFirebase();
  const filePath = `market/images/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on('state_changed', 
      (snapshot) => onProgress?.((snapshot.bytesTransferred / snapshot.totalBytes) * 100), 
      (error) => reject(error), 
      async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
    );
  });
};

export const addMarketOffer = async (productId: string, sellerId: string, itemTitle: string, offer: any) => {
  const { firestore } = initializeFirebase();
  await addDoc(collection(firestore, 'offers'), { 
    ...offer, 
    productId, sellerId, itemTitle,
    status: 'pending', 
    timestamp: new Date().toISOString() 
  });
  return true;
};

export const getReceivedOffers = async (userId: string): Promise<any[]> => {
  const { firestore } = initializeFirebase();
  const q = query(
    collection(firestore, 'offers'), 
    where('sellerId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const respondToOffer = async (offerId: string, status: 'accepted' | 'rejected', buyerId?: string, itemTitle?: string) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'offers', offerId), { status });
  return true;
};

export const getAllOffersAdmin = async (): Promise<any[]> => {
  const { firestore } = initializeFirebase();
  const q = query(collection(firestore, 'offers'), orderBy('timestamp', 'desc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
