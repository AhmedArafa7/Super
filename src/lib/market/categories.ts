
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { CategoryRequest, MainCategory } from './types';

export const requestNewCategory = async (userId: string, userName: string, suggestedName: string, parent: MainCategory) => {
  const { firestore } = initializeFirebase();
  await addDoc(collection(firestore, 'category_requests'), {
    userId,
    userName,
    suggestedName,
    parentCategory: parent,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
};

export const getCategoryRequests = async (): Promise<CategoryRequest[]> => {
  const { firestore } = initializeFirebase();
  const snap = await getDocs(query(collection(firestore, 'category_requests'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryRequest));
};
