
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, addDoc, deleteDoc } from 'firebase/firestore';

export type LearningItemType = 'video' | 'audio' | 'file' | 'quiz_json' | 'text';

export interface LearningItem {
  id: string;
  title: string;
  type: LearningItemType;
  url?: string;
  quizData?: any;
  orderIndex: number;
}

export interface Collection {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
}

export interface Subject {
  id: string;
  title: string;
  description: string;
  allowedUserIds: string[] | null;
}

export const getSubjects = async (userId?: string): Promise<Subject[]> => {
  const { firestore } = initializeFirebase();
  const snap = await getDocs(collection(firestore, 'subjects'));
  const subjects = snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
  
  return subjects.filter(s => {
    if (!s.allowedUserIds || s.allowedUserIds.length === 0) return true;
    return userId && s.allowedUserIds.includes(userId);
  });
};

export const addSubject = async (subject: Omit<Subject, 'id'>) => {
  const { firestore } = initializeFirebase();
  const docRef = await addDoc(collection(firestore, 'subjects'), subject);
  return docRef.id;
};

export const deleteSubject = async (id: string) => {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'subjects', id));
};

export const getCollections = async (subjectId: string): Promise<Collection[]> => {
  const { firestore } = initializeFirebase();
  const snap = await getDocs(query(collection(firestore, 'subjects', subjectId, 'collections'), orderBy('orderIndex', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Collection));
};

export const addCollection = async (data: { subjectId: string, title: string, description?: string, orderIndex: number }) => {
  const { firestore } = initializeFirebase();
  const { subjectId, ...rest } = data;
  await addDoc(collection(firestore, 'subjects', subjectId, 'collections'), rest);
};

export const getLearningItems = async (subjectId: string, collectionId: string): Promise<LearningItem[]> => {
  const { firestore } = initializeFirebase();
  const snap = await getDocs(query(collection(firestore, 'subjects', subjectId, 'collections', collectionId, 'learning_items'), orderBy('orderIndex', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as LearningItem));
};

export const addLearningItem = async (data: { subjectId: string, collectionId: string, title: string, type: LearningItemType, url: string, orderIndex: number }) => {
  const { firestore } = initializeFirebase();
  const { subjectId, collectionId, ...rest } = data;
  await addDoc(collection(firestore, 'subjects', subjectId, 'collections', collectionId, 'learning_items'), rest);
};

export const uploadLearningFile = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress?.(progress);
      }
    };
    reader.onload = () => {
      onProgress?.(100);
      resolve(reader.result as string);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};
