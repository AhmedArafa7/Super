'use client';

import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * [STABILITY_ANCHOR: AGENT_HISTORY_SERVICE_V1.0]
 * خدمة إدارة تاريخ المحادثات للمهندس العصبي عبر Firestore.
 */

const CONVERSATIONS_COLLECTION = 'agent_conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

export const createAgentConversation = async (userId: string, title: string, linkedRepo?: any) => {
  const { firestore } = initializeFirebase();
  const convRef = collection(firestore, 'users', userId, CONVERSATIONS_COLLECTION);
  
  const newConv = {
    title,
    linkedRepo: linkedRepo || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(convRef, newConv);
  return { id: docRef.id, ...newConv };
};

export const saveAgentMessage = async (userId: string, conversationId: string, message: any) => {
  const { firestore } = initializeFirebase();
  const messagesRef = collection(firestore, 'users', userId, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  
  // نستخدم الكائن المرسل مع استبدال أي قيم غير مدعومة
  const messageToSave = {
    role: message.role,
    content: message.content || "",
    image: message.image || null,
    files: message.files || [],
    engine: message.engine || null,
    timestamp: serverTimestamp(),
  };

  await addDoc(messagesRef, messageToSave);

  // تحديث وقت آخر نشاط في المحادثة
  const convDocRef = doc(firestore, 'users', userId, CONVERSATIONS_COLLECTION, conversationId);
  await updateDoc(convDocRef, { updatedAt: serverTimestamp() });
};

export const getAgentConversationsSnapshot = (userId: string, callback: (convs: any[]) => void) => {
  const { firestore } = initializeFirebase();
  const convRef = collection(firestore, 'users', userId, CONVERSATIONS_COLLECTION);
  const q = query(convRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const convs = snapshot.docs.map(d => {
      const data = d.data();
      return { 
        id: d.id, 
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
      };
    });
    callback(convs);
  });
};

export const getAgentMessagesSnapshot = (userId: string, conversationId: string, callback: (messages: any[]) => void) => {
  const { firestore } = initializeFirebase();
  const messagesRef = collection(firestore, 'users', userId, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(d => {
      const data = d.data();
      return { 
        id: d.id, 
        ...data,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp
      };
    });
    callback(msgs);
  });
};

export const deleteAgentConversation = async (userId: string, conversationId: string) => {
  const { firestore } = initializeFirebase();
  const convDocRef = doc(firestore, 'users', userId, CONVERSATIONS_COLLECTION, conversationId);
  await deleteDoc(convDocRef);
};
