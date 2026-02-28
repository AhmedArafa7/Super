'use client';

import { 
  doc, getDoc, setDoc, updateDoc, collection, getDocs, limit, query 
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { User, UserRole } from './types';
import { getSession, setSession } from './session';

/**
 * [STABILITY_ANCHOR: AUTH_SERVICE_V4.0]
 * محرك الهوية الموحد - تفعيل "بروتوكول المؤسس التلقائي" لأول مستخدم.
 */

export const getStoredUsers = async (): Promise<User[]> => {
  const { firestore } = initializeFirebase();
  try {
    const snapshot = await getDocs(collection(firestore, 'users'));
    return snapshot.docs.map(d => ({ 
      id: d.id, 
      ...d.data(),
      status: d.data().status || 'offline'
    } as User));
  } catch (e) {
    console.error("Fetch Users Error:", e);
    return [];
  }
};

export const ensureUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
  const { firestore } = initializeFirebase();
  const userRef = doc(firestore, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as User;
  }

  // التحقق مما إذا كان هذا هو أول مستخدم في النظام
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, limit(1));
  const usersSnap = await getDocs(q);
  const isFirstUser = usersSnap.empty;

  let detectedUsername = "user_" + firebaseUser.uid.substring(0, 5);
  if (firebaseUser.email) {
    detectedUsername = firebaseUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
  }

  // إذا كان اسم المستخدم 'admin' أو كان أول مستخدم، يحصل على رتبة مؤسس
  const finalRole: UserRole = (isFirstUser || detectedUsername === 'admin') ? 'founder' : 'free';

  const newUser: User = {
    id: firebaseUser.uid,
    username: detectedUsername,
    name: firebaseUser.displayName || "Nexus Node",
    email: firebaseUser.email || "",
    role: finalRole,
    classification: 'none',
    proResponsesRemaining: 100,
    proTTSRemaining: 50,
    avatar_url: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
    status: 'online',
    lastSeen: new Date().toISOString(),
    canManageCredits: finalRole === 'founder',
    dataConsent: 'none'
  };

  await setDoc(userRef, newUser);
  
  // تهيئة المحفظة المركزية للعقدة الجديدة برصيد ترحيبي
  await setDoc(doc(firestore, `users/${newUser.id}/wallet/main`), {
    balance: finalRole === 'founder' ? 1000000 : 500,
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
    balance: user.role === 'founder' ? 1000000 : 0,
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