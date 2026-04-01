'use client';

import { 
  doc, getDoc, setDoc, updateDoc, collection, getDocs, limit, query 
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { User, UserRole } from './types';
import { getSession, setSession } from './session';

/**
 * [SECURITY_FIX: AUTH_SERVICE_V6.0]
 * تم إلغاء بروتوكول المؤسس التلقائي لمنع الثغرات الأمنية.
 * يجب ترقية المدير يدوياً عبر Firestore لضمان السيادة الكاملة للمالك.
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
    const data = snap.data() as User;
    // [ADMIN_OVERRIDE: ENG_MO_V1.0]
    // Grant admin role to "Eng mo" automatically
    if (data.name === 'Eng mo' && data.role !== 'admin') {
      const updatedUser = { ...data, role: 'admin' as UserRole };
      await updateDoc(userRef, { role: 'admin' });
      return { ...updatedUser, id: snap.id } as User;
    }
    return { ...data, id: snap.id } as User;
  }

  let detectedUsername = "user_" + firebaseUser.uid.substring(0, 5);
  if (firebaseUser.email) {
    detectedUsername = firebaseUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
  }

  // كافة المستخدمين الجدد يبدأون برتبة free. المالك يرفع رتبته يدوياً من قاعدة البيانات.
  // [ADMIN_OVERRIDE: ENG_MO_V1.0]
  const isEngMo = (firebaseUser.displayName === 'Eng mo');
  const newUser: User = {
    id: firebaseUser.uid,
    username: detectedUsername,
    name: firebaseUser.displayName || "عضو جديد",
    email: firebaseUser.email || "",
    role: isEngMo ? 'admin' : 'free',
    classification: 'none',
    proResponsesRemaining: 10,
    proTTSRemaining: 5,
    avatar_url: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
    status: 'online',
    lastSeen: new Date().toISOString(),
    canManageCredits: false,
    dataConsent: 'none'
  };

  await setDoc(userRef, newUser);
  
  // تهيئة المحفظة برصيد ترحيبي بسيط
  await setDoc(doc(firestore, `users/${newUser.id}/wallet/main`), {
    balance: 50,
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
