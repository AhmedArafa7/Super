
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, addDoc, deleteDoc, where } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export type LearningItemType = 'video' | 'audio' | 'file' | 'quiz_json' | 'text';
export type ApprovalStatus = 'approved' | 'pending';

export interface LearningItem {
  id: string;
  collectionId: string;
  subjectId: string;
  title: string;
  type: LearningItemType;
  url?: string;
  status: ApprovalStatus;
  authorId: string;
  orderIndex: number;
  createdAt?: string;
}

export interface Collection {
  id: string;
  title: string;
  description?: string;
  status: ApprovalStatus;
  authorId: string;
  orderIndex: number;
}

export interface Subject {
  id: string;
  title: string;
  description: string;
  status: ApprovalStatus;
  authorId: string;
  allowedUserIds: string[] | null;
}

// مفتاح API لجوجل درايف (يجب إضافته في .env)
const DRIVE_API_KEY = process.env.NEXT_PUBLIC_DRIVE_API_KEY || "";

/**
 * جلب المواد التعليمية مع مراعاة حالة الموافقة.
 */
export const getSubjects = async (userId?: string, isAdmin = false): Promise<Subject[]> => {
  const { firestore } = initializeFirebase();
  try {
    const snap = await getDocs(collection(firestore, 'subjects'));
    const subjects = snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
    
    if (isAdmin) return subjects;

    // المستخدم العادي يرى المعتمد فقط أو ما يخصه إذا كان ينتظر المراجعة
    return subjects.filter(s => {
      const isApproved = s.status === 'approved';
      const isMine = s.authorId === userId;
      if (!isApproved && !isMine) return false;
      
      if (!s.allowedUserIds || s.allowedUserIds.length === 0) return true;
      return userId && s.allowedUserIds.includes(userId);
    });
  } catch (e) {
    console.error("Fetch Subjects Error:", e);
    return [];
  }
};

export const addSubject = async (subject: Omit<Subject, 'id' | 'status'>, isAdmin = false) => {
  const { firestore } = initializeFirebase();
  const docRef = await addDoc(collection(firestore, 'subjects'), {
    ...subject,
    status: isAdmin ? 'approved' : 'pending'
  });
  return docRef.id;
};

export const approveSubject = async (id: string) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'subjects', id), { status: 'approved' });
};

export const updateSubject = async (id: string, updates: Partial<Subject>) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'subjects', id), updates);
};

export const deleteSubject = async (id: string) => {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'subjects', id));
};

export const getCollections = async (subjectId: string, userId?: string, isAdmin = false): Promise<Collection[]> => {
  const { firestore } = initializeFirebase();
  try {
    const colRef = collection(firestore, 'subjects', subjectId, 'collections');
    const q = query(colRef, orderBy('orderIndex', 'asc'));
    const snap = await getDocs(q);
    const cols = snap.docs.map(d => ({ id: d.id, ...d.data() } as Collection));
    
    if (isAdmin) return cols;
    return cols.filter(c => c.status === 'approved' || c.authorId === userId);
  } catch (e) {
    console.error("Fetch Collections Error:", e);
    return [];
  }
};

export const addCollection = async (data: { subjectId: string, title: string, authorId: string, description?: string, orderIndex: number }, isAdmin = false) => {
  const { firestore } = initializeFirebase();
  const { subjectId, ...rest } = data;
  const colRef = collection(firestore, 'subjects', subjectId, 'collections');
  await addDoc(colRef, {
    ...rest,
    status: isAdmin ? 'approved' : 'pending'
  });
};

export const approveCollection = async (subjectId: string, collectionId: string) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'subjects', subjectId, 'collections', collectionId), { status: 'approved' });
};

export const deleteCollection = async (subjectId: string, collectionId: string) => {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'subjects', subjectId, 'collections', collectionId));
};

export const getLearningItems = async (subjectId: string, collectionId: string, userId?: string, isAdmin = false): Promise<LearningItem[]> => {
  const { firestore } = initializeFirebase();
  try {
    const itemsRef = collection(firestore, 'subjects', subjectId, 'collections', collectionId, 'learning_items');
    const q = query(itemsRef, orderBy('orderIndex', 'asc'));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data(), collectionId, subjectId } as LearningItem));
    
    if (isAdmin) return items;
    return items.filter(i => i.status === 'approved' || i.authorId === userId);
  } catch (e) {
    console.error("Fetch Learning Items Error:", e);
    return [];
  }
};

export const addLearningItem = async (data: { subjectId: string, collectionId: string, title: string, type: LearningItemType, url: string, authorId: string, orderIndex: number }, isAdmin = false) => {
  const { firestore } = initializeFirebase();
  const { subjectId, collectionId, ...rest } = data;
  const itemsRef = collection(firestore, 'subjects', subjectId, 'collections', collectionId, 'learning_items');
  
  await addDoc(itemsRef, {
    ...rest,
    status: isAdmin ? 'approved' : 'pending',
    createdAt: new Date().toISOString()
  });
};

export const approveLearningItem = async (subjectId: string, collectionId: string, itemId: string) => {
  const { firestore } = initializeFirebase();
  await updateDoc(doc(firestore, 'subjects', subjectId, 'collections', collectionId, 'learning_items', itemId), { status: 'approved' });
};

export const deleteLearningItem = async (subjectId: string, collectionId: string, itemId: string) => {
  const { firestore } = initializeFirebase();
  await deleteDoc(doc(firestore, 'subjects', subjectId, 'collections', collectionId, 'learning_items', itemId));
};

export const uploadLearningFile = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
  const { storage } = initializeFirebase();
  const filePath = `learning/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      }, 
      (error) => {
        console.error("Firebase Storage Upload Error:", error);
        reject(error);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};
