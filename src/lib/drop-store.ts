'use client';

import { initializeFirebase } from '@/firebase';
import {
    collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'firebase/firestore';

/**
 * [STABILITY_ANCHOR: DROP_STORE_V1.0]
 * نظام صناديق الإسقاط السري - يدير عمليات رفع الملفات الخاصة بكل مستخدم.
 */

export type DropStatus = 'pending' | 'approved' | 'rejected';

export interface DropItem {
    id: string;
    targetUserId: string;
    targetUsername: string;
    senderName: string;
    senderEmail?: string;
    title: string;
    fileUrl: string;
    fileType: string;
    message?: string;
    status: DropStatus;
    createdAt: string;
}

export const DROP_COST = 50; // سعر التفعيل بعملة EGC

/**
 * التحقق مما إذا كان لدى المستخدم صندوق الإسقاط مفعل.
 */
export const hasDropBoxEnabled = async (userId: string): Promise<boolean> => {
    const { firestore } = initializeFirebase();
    try {
        const userRef = doc(firestore, 'users', userId);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return false;
        return snap.data()?.dropBoxEnabled === true;
    } catch (e) {
        return false;
    }
};

/**
 * تفعيل صندوق الإسقاط للمستخدم بعد الدفع.
 */
export const enableDropBox = async (userId: string): Promise<void> => {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, { dropBoxEnabled: true });
};

/**
 * البحث عن مستخدم بالـ username للصفحة العامة.
 */
export const findUserByUsername = async (username: string): Promise<{ id: string; name: string; avatar_url?: string; dropBoxEnabled?: boolean } | null> => {
    const { firestore } = initializeFirebase();
    try {
        const q = query(collection(firestore, 'users'), where('username', '==', username), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) return null;
        const data = snap.docs[0];
        return {
            id: data.id,
            name: data.data().name,
            avatar_url: data.data().avatar_url,
            dropBoxEnabled: data.data().dropBoxEnabled
        };
    } catch (e) {
        return null;
    }
};

/**
 * تقديم ملف/رابط إلى صندوق مستخدم معين.
 */
export const submitDrop = async (data: {
    targetUserId: string;
    targetUsername: string;
    senderName: string;
    senderEmail?: string;
    title: string;
    fileUrl: string;
    fileType: string;
    message?: string;
}): Promise<string> => {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'drops'), {
        ...data,
        status: 'pending' as DropStatus,
        createdAt: new Date().toISOString()
    });
    return docRef.id;
};

/**
 * جلب الملفات المعلقة لصاحب الصندوق.
 */
export const getPendingDrops = async (userId: string): Promise<DropItem[]> => {
    const { firestore } = initializeFirebase();
    try {
        const q = query(
            collection(firestore, 'drops'),
            where('targetUserId', '==', userId),
            where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as DropItem));
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
        return [];
    }
};

/**
 * جلب كل الملفات (للأرشيف).
 */
export const getAllDrops = async (userId: string): Promise<DropItem[]> => {
    const { firestore } = initializeFirebase();
    try {
        const q = query(
            collection(firestore, 'drops'),
            where('targetUserId', '==', userId)
        );
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as DropItem));
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
        return [];
    }
};

/**
 * قبول ملف.
 */
export const approveDrop = async (dropId: string): Promise<void> => {
    const { firestore } = initializeFirebase();
    await updateDoc(doc(firestore, 'drops', dropId), { status: 'approved' });
};

/**
 * رفض وحذف ملف.
 */
export const rejectDrop = async (dropId: string): Promise<void> => {
    const { firestore } = initializeFirebase();
    await deleteDoc(doc(firestore, 'drops', dropId));
};
