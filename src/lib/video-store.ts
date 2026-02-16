
'use client';

import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { addNotification } from './notification-store';

export type VideoStatus = 'published' | 'pending_review' | 'rejected' | 'needs_action';
export type Visibility = 'public' | 'unlisted' | 'private';

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  author: string;
  authorId: string;
  time: string;
  status: VideoStatus;
  visibility: Visibility;
  allowedUserIds: string[];
  adminFeedback?: string;
  uploaderRole: 'admin' | 'user';
  createdAt: string;
}

export const getStoredVideos = async (): Promise<Video[]> => {
  const { firestore } = initializeFirebase();
  const snap = await getDocs(query(collection(firestore, 'videos'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Video));
};

export const addVideo = async (video: Omit<Video, 'id' | 'createdAt' | 'views'>): Promise<string> => {
  const { firestore } = initializeFirebase();
  const payload = {
    ...video,
    views: "0",
    createdAt: new Date().toISOString()
  };
  const docRef = await addDoc(collection(firestore, 'videos'), payload);
  
  if (video.uploaderRole === 'user') {
    addNotification({
      type: 'content_new',
      title: 'New Video Submission',
      message: `Review required: "${video.title}"`,
      priority: 'info'
    });
  }
  
  window.dispatchEvent(new Event('videos-update'));
  return docRef.id;
};

export const updateVideoStatus = async (id: string, status: VideoStatus, feedback?: string) => {
  const { firestore } = initializeFirebase();
  const videoRef = doc(firestore, 'videos', id);
  await updateDoc(videoRef, { status, adminFeedback: feedback });
  
  window.dispatchEvent(new Event('videos-update'));
};

export const deleteVideo = async (id: string) => {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'videos', id));
  window.dispatchEvent(new Event('videos-update'));
};
