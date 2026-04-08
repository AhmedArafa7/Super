
'use client';

import { initializeFirebase } from '@/firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { CategoryRequest, MainCategory } from './types';
import { voteOnEntity, ModerationConfig } from '../moderation-core';

export const requestNewCategory = async (userId: string, userName: string, suggestedName: string, parent: MainCategory) => {
  const { firestore } = initializeFirebase();
  await addDoc(collection(firestore, 'category_requests'), {
    userId,
    userName,
    suggestedName,
    parentCategory: parent,
    status: 'pending',
    createdAt: new Date().toISOString(),
    approvals: [],
    rejections: []
  });
};

export const getCategoryRequests = async (): Promise<CategoryRequest[]> => {
  const { firestore } = initializeFirebase();
  const snap = await getDocs(query(collection(firestore, 'category_requests'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryRequest));
};

/**
 * التصويت الجماعي لطلبات التصنيف
 */
export const voteOnCategoryRequest = async (
  requestId: string, 
  userId: string, 
  vote: 'approve' | 'reject', 
  thresholds: { votesToApprove: number, votesToTrash: number }
) => {
  const config: ModerationConfig = {
    votesToApprove: thresholds.votesToApprove,
    votesToTrash: thresholds.votesToTrash,
    successStatus: 'approved',
    failStatus: 'rejected',
    pendingStatus: 'pending'
  };

  await voteOnEntity('category_requests', requestId, userId, vote, config);
};
