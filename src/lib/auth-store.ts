
'use client';

import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export type UserRole = 'admin' | 'employee' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  customTag?: string;
  canManageCredits?: boolean; // الصلاحية المالية المستقلة
}

const SESSION_KEY = 'nexus_session';

export const getSession = (): User | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const setSession = (user: User | null) => {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('auth-update'));
};

export const getStoredUsers = async (): Promise<User[]> => {
  const { firestore } = initializeFirebase();
  const snapshot = await getDocs(collection(firestore, 'users'));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
};

/**
 * [DELETION_PREVENTION_PROTOCOL]: إضافة المستخدمين تتم حصراً عبر هذا التابع من قبل الأدمن.
 */
export const addUser = async (userData: Omit<User, 'id'>) => {
  const { firestore } = initializeFirebase();
  const newUserRef = doc(collection(firestore, 'users'));
  const user = { ...userData, id: newUserRef.id };
  await setDoc(newUserRef, user);
  
  // إنشاء محفظة لكل مستخدم جديد برصيد افتتاحي
  await setDoc(doc(firestore, `users/${user.id}/wallet/main`), {
    balance: 1000,
    frozenBalance: 0,
    currency: 'Credits'
  });

  return user;
};

export const deleteUser = async (id: string) => {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'users', id));
  window.dispatchEvent(new Event('auth-update'));
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, updates);
  
  const currentSession = getSession();
  if (currentSession && currentSession.id === userId) {
    setSession({ ...currentSession, ...updates });
  }
};
