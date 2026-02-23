
'use client';

import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// [STABILITY_ANCHOR: OCTAL_HIERARCHY_V1.0]
export type UserRole = 
  | 'founder'
  | 'cofounder'
  | 'admin'
  | 'management'
  | 'investor'
  | 'task_executor'
  | 'free'
  | 'external_user';

export type UserClassification = 'none' | 'freelancer' | 'investor' | 'manager';
export type OnlineStatus = 'online' | 'offline' | 'away';
export type ConsentStatus = 'none' | 'agreed' | 'declined';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  classification?: UserClassification;
  proResponsesRemaining?: number;
  proTTSRemaining?: number;
  avatar_url?: string;
  customTag?: string;
  canManageCredits?: boolean;
  status?: OnlineStatus;
  lastSeen?: string;
  dataConsent: ConsentStatus;
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
  return snapshot.docs.map(d => ({ 
    id: d.id, 
    ...d.data(),
    status: d.data().status || 'offline'
  } as User));
};

export const addUser = async (userData: Omit<User, 'id' | 'dataConsent'>) => {
  const { firestore } = initializeFirebase();
  const newUserRef = doc(collection(firestore, 'users'));
  const user: User = { 
    ...userData, 
    id: newUserRef.id,
    classification: userData.classification || 'none',
    proResponsesRemaining: userData.proResponsesRemaining || 0,
    proTTSRemaining: userData.proTTSRemaining || 0,
    avatar_url: userData.avatar_url || `https://picsum.photos/seed/${userData.username}/100/100`,
    status: 'online',
    lastSeen: new Date().toISOString(),
    canManageCredits: userData.canManageCredits || false,
    dataConsent: 'none'
  };
  await setDoc(newUserRef, user);
  
  await setDoc(doc(firestore, `users/${user.id}/wallet/main`), {
    balance: 0,
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

export const uploadAvatar = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
  const { storage } = initializeFirebase();
  const filePath = `avatars/${Date.now()}-${file.name}`;
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
