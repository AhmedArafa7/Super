
'use client';

import { initializeFirebase } from '@/firebase';
import { 
  collection, doc, getDocs, updateDoc, query, 
  addDoc, where, limit, increment,
  QueryConstraint, DocumentSnapshot, getDoc
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
  ownerId?: string; 
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

export const SUB_CATEGORIES = [
  { id: 'smartphones', label: 'هواتف ذكية', parent: 'electronics' },
  { id: 'laptops', label: 'حواسيب محمولة', parent: 'electronics' },
  { id: 'accessories', label: 'إكسسوارات', parent: 'electronics' },
  { id: 'scripts', label: 'سكربتات برمجية', parent: 'digital_assets' },
  { id: 'templates', label: 'قوالب تصميم', parent: 'digital_assets' },
  { id: 'graphics', label: 'أصول جرافيك', parent: 'digital_assets' },
  { id: 'dev_service', label: 'تطوير برمجيات', parent: 'services' },
  { id: 'design_service', label: 'تصميم جرافيك', parent: 'services' },
  { id: 'consulting', label: 'استشارات تقنية', parent: 'services' },
  { id: 'ai_models', label: 'نماذج ذكاء اصطناعي', parent: 'tools' },
  { id: 'automation', label: 'أدوات أتمتة', parent: 'tools' },
  { id: 'data_analysis', label: 'تحليل بيانات', parent: 'tools' },
  { id: 'courses', label: 'دورات تعليمية', parent: 'education' },
  { id: 'ebooks', label: 'كتب تقنية', parent: 'education' },
  { id: 'tutorials', label: 'دروس تطبيقية', parent: 'education' },
  { id: 'web_apps', label: 'تطبيقات ويب', parent: 'software' },
  { id: 'mobile_apps', label: 'تطبيقات جوال', parent: 'software' },
  { id: 'desktop_apps', label: 'تطبيقات ديسكتوب', parent: 'software' },
];

export const getMarketItems = async (
  limitSize: number = 50, 
  lastDoc?: DocumentSnapshot,
  mainCat?: MainCategory,
  subCat?: string,
  search?: string
): Promise<{ items: MarketItem[], lastVisible: DocumentSnapshot | null }> => {
  const { firestore } = initializeFirebase();
  
  const q = query(collection(firestore, 'products'), limit(100));
  const snap = await getDocs(q);
  
  let items = snap.docs.map(d => ({ 
    id: d.id, 
    ...d.data(),
    ownerId: d.data().sellerId // لضمان التوافق مع النسخ القديمة
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

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { items: items.slice(0, limitSize), lastVisible: null };
};

export const addMarketItem = async (item: Omit<MarketItem, 'id' | 'status' | 'currency' | 'createdAt'>) => {
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

export const decrementStock = async (itemId: string) => {
  const { firestore } = initializeFirebase();
  const itemRef = doc(firestore, 'products', itemId);
  const snap = await getDoc(itemRef);
  
  if (snap.exists()) {
    const currentStock = snap.data().stockQuantity || 0;
    if (currentStock > 0) {
      await updateDoc(itemRef, { 
        stockQuantity: increment(-1),
        status: currentStock <= 1 ? 'sold' : 'active'
      });
      return true;
    }
  }
  return false;
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
    productId, 
    sellerId, 
    itemTitle,
    status: 'pending', 
    timestamp: new Date().toISOString() 
  });
  return true;
};

export const getReceivedOffers = async (userId: string): Promise<any[]> => {
  const { firestore } = initializeFirebase();
  const q = query(
    collection(firestore, 'offers'), 
    where('sellerId', '==', userId)
  );
  const snap = await getDocs(q);
  const offers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return offers.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const respondToOffer = async (offerId: string, status: 'accepted' | 'rejected', buyerId?: string, itemTitle?: string) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'offers', offerId), { status });
  return true;
};

export const getAllOffersAdmin = async (): Promise<any[]> => {
  const { firestore } = initializeFirebase();
  const snap = await getDocs(collection(firestore, 'offers'));
  const offers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return offers.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
