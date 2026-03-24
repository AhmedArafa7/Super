'use client';

import { initializeFirebase } from '@/firebase';
import {
  collection, addDoc, getDocs, doc, updateDoc, query,
  orderBy, deleteDoc, getDoc, onSnapshot, where
} from 'firebase/firestore';

export type QACategory = 'question' | 'request';

export interface QAPost {
  id: string;
  category: QACategory;
  text: string;
  authorId: string;
  authorName: string;
  isAnonymous?: boolean;
  createdAt: string;
  updatedAt?: string;
  answer?: string;
  answeredAt?: string;
  answeredBy?: string;
  answerAlert?: string;
}

export const subscribeToQAPosts = (callback: (posts: QAPost[]) => void): () => void => {
  const { firestore } = initializeFirebase();
  const q = query(
    collection(firestore, 'qa_posts'),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QAPost));
    callback(posts);
  });

  return unsubscribe;
};

export const addQAPost = async (
  postData: Omit<QAPost, 'id' | 'createdAt' | 'answer' | 'answeredAt' | 'answeredBy' | 'updatedAt'>
): Promise<string> => {
  const { firestore } = initializeFirebase();
  
  // منع التكرار للطلبات غير المجابة
  const q = query(
    collection(firestore, 'qa_posts'),
    where('authorId', '==', postData.authorId),
    where('text', '==', postData.text),
    where('category', '==', postData.category)
  );
  
  const existing = await getDocs(q);
  const hasDuplicate = existing.docs.some(d => !d.data().answer);
  
  if (hasDuplicate) {
    throw new Error("لقد قمت بإرسال هذا الطلب بالفعل وهو قيد المراجعة.");
  }

  const ref = await addDoc(collection(firestore, 'qa_posts'), {
    ...postData,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
};

export const updateQAPostUser = async (
  postId: string,
  userId: string,
  newText: string,
  newCategory: QACategory,
  isAnonymous?: boolean
): Promise<void> => {
  const { firestore } = initializeFirebase();
  const postRef = doc(firestore, 'qa_posts', postId);
  
  const snap = await getDoc(postRef);
  if (!snap.exists()) throw new Error("Post not found");
  
  const data = snap.data() as QAPost;
  if (data.authorId !== userId) throw new Error("Unauthorized: Only author can edit");
  if (data.answer) throw new Error("Cannot edit after it has been answered");

  await updateDoc(postRef, {
    text: newText,
    category: newCategory,
    isAnonymous: isAnonymous ?? data.isAnonymous,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteQAPostUser = async (
  postId: string,
  userId: string
): Promise<void> => {
  const { firestore } = initializeFirebase();
  const postRef = doc(firestore, 'qa_posts', postId);
  
  const snap = await getDoc(postRef);
  if (!snap.exists()) return;
  
  const data = snap.data() as QAPost;
  if (data.authorId !== userId) throw new Error("Unauthorized");
  if (data.answer) throw new Error("Cannot delete after it has been answered");

  await deleteDoc(postRef);
};

export const answerQAPost = async (
  postId: string,
  answer: string,
  adminName: string,
  answerAlert?: string
): Promise<void> => {
  const { firestore } = initializeFirebase();
  const postRef = doc(firestore, 'qa_posts', postId);
  
  await updateDoc(postRef, {
    answer,
    answerAlert: answerAlert || null,
    answeredAt: new Date().toISOString(),
    answeredBy: adminName,
  });
};

export const seedQAPosts = async (userId: string, userName: string): Promise<void> => {
  const { firestore } = initializeFirebase();
  const existing = await getDocs(query(collection(firestore, 'qa_posts')));
  if (!existing.empty) return;

  const samplePosts: Omit<QAPost, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      category: 'question',
      text: 'هل يمكنني استخدام التطبيق اوفلاين ولا لازم انترنت دايماً؟',
      authorId: userId,
      authorName: userName,
      answer: 'حالياً التطبيق بيحتاج انترنت لبعض الخصائص، شغالين على نسخة أوفلاين قريباً.',
      answeredAt: new Date().toISOString(),
      answeredBy: 'المؤسس',
    },
    {
      category: 'request',
      text: 'ياريت تضيفوا قسم خاص بالكورسات الهندسية ضمن المكتبة.',
      authorId: userId,
      authorName: userName,
    }
  ];

  for (const post of samplePosts) {
    await addDoc(collection(firestore, 'qa_posts'), {
      ...post,
      createdAt: new Date().toISOString(),
    });
  }
};
