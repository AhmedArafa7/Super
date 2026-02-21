
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
  size?: string;
}

export interface Collection {
  id: string;
  title: string;
  description?: string;
  status: ApprovalStatus;
  authorId: string;
  orderIndex: number;
  subjectId: string;
}

export interface Subject {
  id: string;
  title: string;
  description: string;
  status: ApprovalStatus;
  authorId: string;
  allowedUserIds: string[] | null;
}

const DRIVE_API_KEY = process.env.NEXT_PUBLIC_DRIVE_API_KEY || "";

/**
 * [STABILITY_ANCHOR: DRIVE_API_ORCHESTRATOR]
 * محرك الربط الحقيقي مع Google Drive API لضمان استقرار جلب البيانات.
 */

export const extractDriveId = (url: string) => {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
};

export const fetchDriveMetadata = async (fileId: string) => {
  if (!DRIVE_API_KEY) return null;
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,size,mimeType,thumbnailLink,iconLink&key=${DRIVE_API_KEY}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
  } catch (e) {
    console.error("Drive API Fetch Error:", e);
    return null;
  }
};

/**
 * جلب قائمة الملفات من مجلد معين في درايف باستخدام الـ API Key
 */
export const fetchDriveFolderFiles = async (folderId: string) => {
  if (!DRIVE_API_KEY) return [];
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size,webViewLink,iconLink,thumbnailLink)&key=${DRIVE_API_KEY}`);
    const data = await res.json();
    return data.files || [];
  } catch (e) {
    console.error("Folder Fetch Error:", e);
    return [];
  }
};

export const getSubjects = async (userId?: string, isAdmin = false): Promise<Subject[]> => {
  const { firestore } = initializeFirebase();
  try {
    const snap = await getDocs(collection(firestore, 'subjects'));
    const subjects = snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
    if (isAdmin) return subjects;
    return subjects.filter(s => s.status === 'approved' || s.authorId === userId);
  } catch (e) {
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
    return snap.docs.map(d => ({ id: d.id, ...d.data(), subjectId } as Collection))
      .filter(c => isAdmin || c.status === 'approved' || c.authorId === userId);
  } catch (e) {
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
    return snap.docs.map(d => ({ id: d.id, ...d.data(), collectionId, subjectId } as LearningItem))
      .filter(i => isAdmin || i.status === 'approved' || i.authorId === userId);
  } catch (e) {
    return [];
  }
};

export const addLearningItem = async (data: { subjectId: string, collectionId: string, title: string, type: LearningItemType, url: string, authorId: string, orderIndex: number }, isAdmin = false) => {
  const { firestore } = initializeFirebase();
  const { subjectId, collectionId, ...rest } = data;
  const itemsRef = collection(firestore, 'subjects', subjectId, 'collections', collectionId, 'learning_items');
  
  let size = "Unknown";
  const driveId = extractDriveId(data.url);
  if (driveId) {
    const meta = await fetchDriveMetadata(driveId);
    if (meta && meta.size) size = `${(parseInt(meta.size) / (1024 * 1024)).toFixed(1)} MB`;
  }

  await addDoc(itemsRef, {
    ...rest,
    size,
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
      (snapshot) => onProgress?.((snapshot.bytesTransferred / snapshot.totalBytes) * 100), 
      (error) => reject(error), 
      async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
    );
  });
};
