'use client';

import { 
  doc, getDoc, setDoc, updateDoc, collection, getDocs 
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { User, UserRole } from './types';
import { getSession, setSession } from './session';

/**
 * [STABILITY_ANCHOR: AUTH_SERVICE_V3.0]
 * محرك الهوية الموحد - تم تحديث addUser ليدعم الهوية السحابية المباشرة.
 */

export const getStoredUsers = async (): Promise<User[]> => {
  const { firestore } = initializeFirebase();
  const snapshot = await getDocs(collection(firestore, 'users'));
  return snapshot.docs.map(d => ({ 
    id: d.id, 
    ...d.data(),
    status: d.data().status || 'offline'
  } as User));
};

export const ensureUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as User;
  }

  // فرض رتبة 'free' لضمان التوافق مع قواعد Firestore
  const newUser: User = {
    id: firebaseUser.uid,
    username: firebaseUser.email?.includes('@nexusai.local') 
      ? firebaseUser.email.split('@')[0] 
      : (firebaseUser.email?.split('@')[0] || firebaseUser.uid.substring(0, 8)),
    name: firebaseUser.displayName || "Nexus Node",
    email: firebaseUser.email || "",
    role: 'free',
    classification: 'none',
    proResponsesRemaining: 0,
    proTTSRemaining: 0,
    avatar_url: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
    status: 'online',
    lastSeen: new Date().toISOString(),
    canManageCredits: false,
    dataConsent: 'none'
  };

  await setDoc(userRef, newUser);
  
  // تهيئة المحفظة
  await setDoc(doc(firestore, `users/${newUser.id}/wallet/main`), {
    balance: 0,
    frozenBalance: 0,
    currency: 'Credits'
  });

  return newUser;
};

export const addUser = async (user: User) => {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', user.id);
  
  await setDoc(userRef, {
    ...user,
    status: user.status || 'online',
    lastSeen: new Date().toISOString(),
    dataConsent: user.dataConsent || 'none'
  });
  
  await setDoc(doc(firestore, `users/${user.id}/wallet/main`), {
    balance: 0,
    frozenBalance: 0,
    currency: 'Credits'
  });

  return user;
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
