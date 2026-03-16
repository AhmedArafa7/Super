"use client";

import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export interface HistoryItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  author: string;
  watchedAt: string;
  userId: string;
}

export const addToHistory = async (userId: string, video: any) => {
  try {
    const { firestore } = initializeFirebase();
    
    // Check if video already exists in recent history to avoid duplicates
    // We'll just add it for now as Firestore is cheap for this scale, 
    // but in production we might want to update the timestamp instead.
    
    await addDoc(collection(firestore, 'history'), {
      videoId: video.id,
      title: video.title,
      thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`,
      author: video.author,
      userId: userId,
      watchedAt: new Timestamp(Math.floor(Date.now() / 1000), 0)
    });
    
    window.dispatchEvent(new Event('history-update'));
  } catch (e) {
    console.error("Add to History Error:", e);
  }
};

export const getHistory = async (userId: string, count: number = 50): Promise<HistoryItem[]> => {
  try {
    const { firestore } = initializeFirebase();
    const q = query(
      collection(firestore, 'history'),
      where('userId', '==', userId),
      orderBy('watchedAt', 'desc'),
      limit(count)
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        videoId: data.videoId,
        title: data.title,
        thumbnail: data.thumbnail,
        author: data.author,
        watchedAt: data.watchedAt?.toDate().toISOString() || new Date().toISOString(),
        userId: data.userId
      };
    });
  } catch (e) {
    console.error("Get History Error:", e);
    return [];
  }
};

export const clearHistory = async (userId: string) => {
    // Note: Deleting collection in Firebase is usually done via cloud functions or multiple deletes.
    // For now we'll just implement single delete if needed, but "Clear All" is complex.
    console.warn("Clear History not fully implemented for performance reasons.");
};
