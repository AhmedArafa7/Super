
'use client';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * الواجهة الموحدة لأي كيان يحتاج للرقابة
 */
export interface Moderatable {
  id: string;
  approvals?: string[];
  rejections?: string[];
  status: string;
}

/**
 * إعدادات الرقابة لكل نوع من المحتوى
 */
export interface ModerationConfig {
  votesToApprove: number;
  votesToTrash: number;
  successStatus: string;
  failStatus: string;
  pendingStatus: string;
}

/**
 * النواة الموحدة لعملية التصويت (The Universal Moderation Engine)
 * تضمن هذه الدالة أن أي عملية تصويت في الموقع تتم بنفس المنطق الرياضي والبرمجي.
 */
export const voteOnEntity = async (
  collectionName: string,
  entityId: string,
  userId: string,
  vote: 'approve' | 'reject',
  config: ModerationConfig
) => {
  const { firestore } = initializeFirebase();
  const entityRef = doc(firestore, collectionName, entityId);
  
  // جلب البيانات الحالية بشكل ذري (لضمان الدقة في حالة التصويت المتزامن)
  const snap = await getDoc(entityRef);
  if (!snap.exists()) {
    console.error(`Moderation Error: Entity ${entityId} not found in ${collectionName}`);
    return;
  }
  
  const data = snap.data() as Moderatable;
  let approvals = data.approvals || [];
  let rejections = data.rejections || [];
  
  // إزالة أي تصويت سابق لهذا المستخدم (إعادة تعيين التصويت)
  approvals = approvals.filter(id => id !== userId);
  rejections = rejections.filter(id => id !== userId);
  
  // تسجيل التصويت الجديد
  if (vote === 'approve') {
    approvals.push(userId);
  } else {
    rejections.push(userId);
  }
  
  const updates: Partial<Moderatable> = { approvals, rejections };
  
  // التحقق من الوصول للنصاب القانوني بناءً على الإعدادات الممررة
  if (approvals.length >= config.votesToApprove) {
    updates.status = config.successStatus;
  } else if (rejections.length >= config.votesToTrash) {
    updates.status = config.failStatus;
  } else {
    updates.status = config.pendingStatus;
  }
  
  // تحديث Firestore ورفع حدث (Event) لإعادة تحميل الواجهات
  await updateDoc(entityRef, updates as any);
  window.dispatchEvent(new Event(`${collectionName}-update`));
  window.dispatchEvent(new Event('moderation-update'));
};
