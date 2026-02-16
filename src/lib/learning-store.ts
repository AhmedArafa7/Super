'use client';

import { initializeFirebase } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export type LearningItemType = 'video' | 'audio' | 'file' | 'quiz_json' | 'text';

export interface LearningItem {
  id: string;
  collectionId: string;
  title: string;
  type: LearningItemType;
  url?: string;
  quizData?: any;
  orderIndex: number;
  createdAt?: string;
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
  try {
    const snap = await getDocs(collection(firestore, 'subjects'));
    const subjects = snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
    return subjects.filter(s => {
      if (!s.allowedUserIds || s.allowedUserIds.length === 0) return true;
      return userId && s.allowedUserIds.includes(userId);
    });
  } catch (e) {
    console.error("Fetch Subjects Error:", e);
    return [];
  }
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
  try {
    const colRef = collection(firestore, 'subjects', subjectId, 'collections');
    const q = query(colRef, orderBy('orderIndex', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Collection));
  } catch (e) {
    console.error("Fetch Collections Error:", e);
    return [];
  }
};

export const addCollection = async (data: { subjectId: string, title: string, description?: string, orderIndex: number }) => {
  const { firestore } = initializeFirebase();
  const { subjectId, ...rest } = data;
  const colRef = collection(firestore, 'subjects', subjectId, 'collections');
  await addDoc(colRef, rest);
};

export const getLearningItems = async (subjectId: string, collectionId: string): Promise<LearningItem[]> => {
  const { firestore } = initializeFirebase();
  try {
    const itemsRef = collection(firestore, 'subjects', subjectId, 'collections', collectionId, 'learning_items');
    const q = query(itemsRef, orderBy('orderIndex', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data(), collectionId } as LearningItem));
  } catch (e) {
    console.error("Fetch Learning Items Error:", e);
    return [];
  }
};

export const addLearningItem = async (data: { subjectId: string, collectionId: string, title: string, type: LearningItemType, url: string, orderIndex: number }) => {
  const { firestore } = initializeFirebase();
  const { subjectId, collectionId, ...rest } = data;
  const itemsRef = collection(firestore, 'subjects', subjectId, 'collections', collectionId, 'learning_items');
  await addDoc(itemsRef, {
    ...rest,
    createdAt: new Date().toISOString()
  });
};

export const uploadLearningFile = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
  const { storage } = initializeFirebase();
  const storageRef = ref(storage, `learning_assets/${Date.now()}-${file.name}`);
  
  try {
    // Note: Simple upload for immediate return, progress is handled via callback in store if needed
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    onProgress?.(100);
    return url;
  } catch (err) {
    console.error("Firebase Storage Upload Error:", err);
    throw err;
  }
};
