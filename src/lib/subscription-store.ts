'use client';

import { initializeFirebase } from '@/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export interface YouTubeSubscription {
  id: string;
  userId: string;
  channelUrl: string;
  channelName: string;
  channelId: string;
  avatarUrl?: string;
  createdAt: string;
}

/**
 * [STABILITY_ANCHOR: SUBSCRIPTION_STORE_V3.0]
 * محرك إدارة الاشتراكات - تم إضافة دعم لرابط أيقونة القناة الحقيقي.
 */

export const addSubscription = async (userId: string, channelUrl: string, channelName: string, channelId: string, avatarUrl?: string) => {
  const { firestore } = initializeFirebase();
  const subsRef = collection(firestore, 'users', userId, 'subscriptions');
  const data = {
    userId,
    channelUrl,
    channelName,
    channelId,
    avatarUrl: avatarUrl || "",
    createdAt: new Date().toISOString()
  };

  addDoc(subsRef, data).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: subsRef.path,
      operation: 'create',
      requestResourceData: data,
    } satisfies SecurityRuleContext);
    
    errorEmitter.emit('permission-error', permissionError);
  });
};

export const getSubscriptions = async (userId: string): Promise<YouTubeSubscription[]> => {
  const { firestore, auth } = initializeFirebase();
  if (!auth.currentUser) return [];

  try {
    const q = query(collection(firestore, 'users', userId, 'subscriptions'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as YouTubeSubscription));
  } catch (e) {
    console.error("Fetch Subscriptions Error:", e);
    return [];
  }
};

export const deleteSubscription = async (userId: string, subId: string) => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, 'users', userId, 'subscriptions', subId);
  
  deleteDoc(docRef).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    } satisfies SecurityRuleContext);
    
    errorEmitter.emit('permission-error', permissionError);
  });
};

export const listenToSubscriptions = (userId: string, callback: (subs: YouTubeSubscription[]) => void) => {
  const { firestore, auth } = initializeFirebase();
  
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const subsRef = collection(firestore, 'users', userId, 'subscriptions');
  const q = query(subsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, 
    (snapshot) => {
      const subs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as YouTubeSubscription));
      callback(subs);
    },
    async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: subsRef.path,
        operation: 'list',
      } satisfies SecurityRuleContext);
      
      errorEmitter.emit('permission-error', permissionError);
    }
  );
};
