
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';

export interface YouTubeSubscription {
  id: string;
  userId: string;
  channelUrl: string;
  channelName: string;
  createdAt: string;
}

/**
 * [STABILITY_ANCHOR: SUBSCRIPTION_STORE_V1.0]
 * محرك إدارة الاشتراكات الخاصة لـ WeTube.
 */

export const addSubscription = async (userId: string, channelUrl: string, channelName: string) => {
  const { firestore } = initializeFirebase();
  await addDoc(collection(firestore, 'users', userId, 'subscriptions'), {
    userId,
    channelUrl,
    channelName,
    createdAt: new Date().toISOString()
  });
};

export const getSubscriptions = async (userId: string): Promise<YouTubeSubscription[]> => {
  const { firestore } = initializeFirebase();
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
  await deleteDoc(doc(firestore, 'users', userId, 'subscriptions', subId));
};

export const listenToSubscriptions = (userId: string, callback: (subs: YouTubeSubscription[]) => void) => {
  const { firestore } = initializeFirebase();
  const q = query(collection(firestore, 'users', userId, 'subscriptions'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const subs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as YouTubeSubscription));
    callback(subs);
  });
};
