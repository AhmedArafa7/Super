
'use client';

import { 
  doc, getDoc, setDoc, updateDoc, collection, getDocs 
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { User, UserRole } from './types';
import { getSession, setSession } from './session';

/**
 * [STABILITY_ANCHOR: AUTH_SERVICE_V2.1]
 * محرك الهوية الموحد - يضمن توافق الرتب مع قواعد Firestore.
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
    username: firebaseUser.email?.split('@')[0] || firebaseUser.uid.substring(0, 8),
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

export const addUser = async (userData: Omit<User, 'id'>) => {
  const { firestore } = initializeFirebase();
  const newUserRef = doc(collection(firestore, 'users'));
  const user: User = { 
    ...userData, 
    id: newUserRef.id,
    role: userData.role || 'free',
    classification: userData.classification || 'none',
    proResponsesRemaining: userData.proResponsesRemaining || 0,
    proTTSRemaining: userData.proTTSRemaining || 0,
    avatar_url: userData.avatar_url || `https://picsum.photos/seed/${userData.username}/100/100`,
    status: 'online',
    lastSeen: new Date().toISOString(),
    canManageCredits: userData.canManageCredits || false,
    dataConsent: userData.dataConsent || 'none'
  };
  await setDoc(newUserRef, user);
  
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
