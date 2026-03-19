
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export type AutoSyncType = 'all' | 'long' | 'shorts';

export interface YouTubeSubscription {
  id: string;
  userId: string;
  channelUrl: string;
  channelName: string;
  channelId: string;
  avatarUrl?: string;
  isFavorite: boolean;
  autoSyncType: AutoSyncType;
  createdAt: string;
}

/**
 * [STABILITY_ANCHOR: SUBSCRIPTION_STORE_V5.0]
 * محرك إدارة الاشتراكات المطور - يدعم اختيار نوع المزامنة التلقائية.
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
    isFavorite: false,
    autoSyncType: 'all', // الافتراضي هو مزامنة الكل
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

export const updateSubscriptionSettings = async (userId: string, subId: string, updates: Partial<YouTubeSubscription>) => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, 'users', userId, 'subscriptions', subId);
  
  return updateDoc(docRef, updates).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: updates,
    } satisfies SecurityRuleContext);
    
    errorEmitter.emit('permission-error', permissionError);
  });
};

export const toggleFavoriteSubscription = async (userId: string, subId: string, currentStatus: boolean) => {
  return updateSubscriptionSettings(userId, subId, { isFavorite: !currentStatus });
};

export const deleteSubscription = async (userId: string, subId: string) => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, 'users', userId, 'subscriptions', subId);
  
  return deleteDoc(docRef).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    } satisfies SecurityRuleContext);
    
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
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
