
'use client';

import { initializeFirebase } from '@/firebase';
import { 
  collection, doc, getDocs, updateDoc, query, 
  addDoc, where, limit, increment,
  QueryConstraint, DocumentSnapshot, getDoc, orderBy
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export type MarketItemStatus = 'active' | 'sold' | 'reserved' | 'archived' | 'pending_review' | 'rejected';
export type AppVersionStatus = 'final' | 'beta';
export type MainCategory = 'all' | 'electronics' | 'digital_assets' | 'services' | 'tools' | 'education' | 'software' | 'home_lifestyle' | 'industrial' | 'health_beauty' | 'other';

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
  promoVideoUrl?: string; // رابط فيديو ترويجي
  promoFileUrl?: string;  // رابط ملف توضيحي
  adminFeedback?: string; // سبب الرفض
  versionStatus?: AppVersionStatus;
}

export interface CategoryRequest {
  id: string;
  userId: string;
  userName: string;
  suggestedName: string;
  parentCategory: MainCategory;
  status: 'pending' | 'approved' | 'rejected';
  adminFeedback?: string;
  createdAt: string;
}

export interface MarketOffer {
  id: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  itemTitle: string;
  type: 'price' | 'trade';
  value: number;
  details: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export type OfferStatus = MarketOffer['status'];

export const SUB_CATEGORIES = [
  // Electronics
  { id: 'smartphones', label: 'هواتف ذكية', parent: 'electronics' },
  { id: 'laptops', label: 'حواسيب محمولة', parent: 'electronics' },
  { id: 'accessories', label: 'إكسسوارات', parent: 'electronics' },
  // Digital Assets
  { id: 'scripts', label: 'سكربتات برمجية', parent: 'digital_assets' },
  { id: 'templates', label: 'قوالب تصميم', parent: 'digital_assets' },
  { id: 'graphics', label: 'أصول جرافيك', parent: 'digital_assets' },
  // Home & Lifestyle
  { id: 'decor', label: 'ديكور وشموع', parent: 'home_lifestyle' },
  { id: 'furniture', label: 'أثاث منزلي', parent: 'home_lifestyle' },
  { id: 'kitchen', label: 'أدوات مطبخ', parent: 'home_lifestyle' },
  // Services
  { id: 'dev_service', label: 'تطوير برمجيات', parent: 'services' },
  { id: 'design_service', label: 'تصميم جرافيك', parent: 'services' },
  // Tools
  { id: 'ai_models', label: 'نماذج ذكاء اصطناعي', parent: 'tools' },
  { id: 'automation', label: 'أدوات أتمتة', parent: 'tools' },
  // Industrial
  { id: 'hardware_tools', label: 'أدوات ومعدات', parent: 'industrial' },
  { id: 'materials', label: 'مواد خام', parent: 'industrial' },
  // Health & Beauty
  { id: 'skincare', label: 'عناية بالبشرة', parent: 'health_beauty' },
  { id: 'supplements', label: 'مكملات غذائية', parent: 'health_beauty' },
];

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
  
  let items = snap.docs.map(d => ({ 
    id: d.id, 
    ...d.data(),
    ownerId: d.data().sellerId
  } as MarketItem));

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
    items = items.filter(i => 
      i.title.toLowerCase().includes(s) || 
      i.description.toLowerCase().includes(s)
    );
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

export const requestNewCategory = async (userId: string, userName: string, suggestedName: string, parent: MainCategory) => {
  const { firestore } = initializeFirebase();
  await addDoc(collection(firestore, 'category_requests'), {
    userId,
    userName,
    suggestedName,
    parentCategory: parent,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
};

export const getCategoryRequests = async (): Promise<CategoryRequest[]> => {
  const { firestore } = initializeFirebase();
  const snap = await getDocs(query(collection(firestore, 'category_requests'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryRequest));
};

export const updateMarketItem = async (itemId: string, updates: Partial<MarketItem>) => {
  const { firestore } = initializeFirebase();
  const itemRef = doc(firestore, 'products', itemId);
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );
  await updateDoc(itemRef, cleanUpdates);
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
    console.error("Admin Offers Fetch Error:", e);
    return [];
  }
};

export const respondToOffer = async (offerId: string, status: OfferStatus, buyerId?: string, itemTitle?: string) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'offers', offerId), { status });
  return true;
};

export const uploadMarketImage = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
  const { storage } = initializeFirebase();
  const filePath = `market/${Date.now()}-${file.name}`;
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
