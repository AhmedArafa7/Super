
'use client';

import { initializeFirebase } from '@/firebase';
import { 
  collection, doc, getDocs, updateDoc, query, 
  addDoc, deleteDoc, where, orderBy, getDoc
} from 'firebase/firestore';

export type AppFramework = 'angular' | 'react' | 'vue' | 'html' | 'nextjs' | 'other';
export type AppAccess = 'free' | 'paid' | 'trial';
export type AppStatus = 'approved' | 'pending' | 'rejected';

export interface WebProject {
  id: string;
  title: string;
  description: string;
  url: string;
  framework: AppFramework;
  access: AppAccess;
  price: number;
  thumbnail: string;
  authorId: string;
  authorName: string;
  status: AppStatus;
  createdAt: string;
}

/**
 * [STABILITY_ANCHOR: LAUNCHER_STORE_DYNAMIC_V1.1]
 * تم تحويل الفرز ليكون برمجياً في جهة العميل لتجنب أخطاء الفهارس المركبة.
 */

export const getApprovedApps = async (): Promise<WebProject[]> => {
  const { firestore } = initializeFirebase();
  try {
    // جلب التطبيقات المعتمدة فقط بدون أمر فرز في الكويري لتجنب طلب الفهارس المركبة
    const q = query(
      collection(firestore, 'app_launcher'), 
      where('status', '==', 'approved')
    );
    const snap = await getDocs(q);
    const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as WebProject));
    
    // الفرز يدوياً حسب التاريخ (الأحدث أولاً) لضمان الاستقرار بدون فهارس إضافية
    return apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error("Fetch Apps Error:", e);
    return [];
  }
};

export const getPendingAppsAdmin = async (): Promise<WebProject[]> => {
  const { firestore } = initializeFirebase();
  try {
    const q = query(
      collection(firestore, 'app_launcher'), 
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as WebProject));
    // الفرز برمجياً للأدمن أيضاً
    return apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error("Fetch Pending Apps Error:", e);
    return [];
  }
};

export const submitAppRequest = async (app: Omit<WebProject, 'id' | 'status' | 'createdAt' | 'price' | 'access'>) => {
  const { firestore } = initializeFirebase();
  await addDoc(collection(firestore, 'app_launcher'), {
    ...app,
    status: 'pending',
    price: 0,
    access: 'free',
    createdAt: new Date().toISOString()
  });
};

export const approveApp = async (id: string, price: number, access: AppAccess) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'app_launcher', id), {
    status: 'approved',
    price,
    access
  });
};

export const rejectApp = async (id: string) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'app_launcher', id), {
    status: 'rejected'
  });
};

export const deleteApp = async (id: string) => {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'app_launcher', id));
};
