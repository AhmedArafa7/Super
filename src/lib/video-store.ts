
'use client';

import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { addNotification } from './notification-store';

export type VideoStatus = 'published' | 'pending_review' | 'rejected' | 'needs_action';
export type Visibility = 'public' | 'unlisted' | 'private';
export type VideoSource = 'local' | 'youtube' | 'drive';

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  author: string;
  authorId: string;
  channelAvatar?: string;
  time: string;
  status: VideoStatus;
  visibility: Visibility;
  allowedUserIds: string[];
  adminFeedback?: string;
  uploaderRole: 'admin' | 'employee' | 'user';
  createdAt: string;
  source: VideoSource;
  externalUrl?: string;
  productIds?: string[];
  productDisplayMode?: 'none' | 'specific' | 'all';
  hasMusic?: boolean;
  relatedSurah?: number;
  aiReview?: {
    status: 'pending' | 'completed' | 'failed' | 'processing';
    summary?: string;
    flags?: string[];
    advice?: string;
    reviewedAt?: string;
    fallbackUsed?: boolean;
  };
}

export const getStoredVideos = async (): Promise<Video[]> => {
  try {
    const { firestore } = initializeFirebase();
    const snap = await getDocs(query(collection(firestore, 'videos'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Video));
  } catch (e) {
    console.error("Fetch Videos Error:", e);
    return [];
  }
};

export const addVideo = async (video: Omit<Video, 'id' | 'createdAt' | 'views'>): Promise<string> => {
  const { firestore } = initializeFirebase();
  const payload = {
    ...video,
    views: 0,
    createdAt: new Date().toISOString()
  };
  const docRef = await addDoc(collection(firestore, 'videos'), payload);

  if (video.uploaderRole !== 'admin') {
    addNotification({
      type: 'content_new',
      title: 'إرسال فيديو جديد',
      message: `مطلوب مراجعة المحتوى لـ: "${video.title}"`,
      priority: 'info'
    });
  }

  window.dispatchEvent(new Event('videos-update'));
  return docRef.id;
};

export const updateVideoStatus = async (id: string, status: VideoStatus, feedback?: string, hasMusic?: boolean) => {
  const { firestore } = initializeFirebase();
  const videoRef = doc(firestore, 'videos', id);

  // بناء كائن التحديث مع تجنب القيم undefined التي تسبب الانهيار في Firestore
  const updates: any = { status };
  if (feedback !== undefined) {
    updates.adminFeedback = feedback;
  } else {
    updates.adminFeedback = ""; // القيمة الافتراضية بدلاً من undefined
  }
  
  if (hasMusic !== undefined) {
    updates.hasMusic = hasMusic;
  }

  await updateDoc(videoRef, updates);

  window.dispatchEvent(new Event('videos-update'));
};

export const deleteVideo = async (id: string) => {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'videos', id));
  window.dispatchEvent(new Event('videos-update'));
};
