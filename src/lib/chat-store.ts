
'use client';

import { create } from 'zustand';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, getDocs, collectionGroup, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { toast } from '@/hooks/use-toast';

export type MessageStatus = 'queued' | 'sent' | 'processing' | 'replied' | 'rejected';

export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'file';
  name: string;
  url: string; 
  size: string;
  mimeType: string;
}

export interface WizardMessage {
  id: string;
  userId: string;
  userName: string;
  text: string; // النص النهائي المستخدم
  originalText: string; // نص المستخدم الأصلي
  optimizedText?: string; // النص بعد تحسين الـ AI
  selectedModel?: string; // الموديل الذي تم استخدامه
  isAutoMode: boolean;
  response: string | null;
  engine?: string;
  status: MessageStatus;
  timestamp: string;
  attachments?: Attachment[];
  editReason?: string;
}

interface ChatState {
  messages: WizardMessage[];
  isLoading: boolean;
  isConnected: boolean;
  isSending: boolean;
  autoMode: boolean;
  selectedManualModel: string;
  loadMessages: (userId: string) => void;
  sendMessage: (text: string, userId: string, userName: string, attachments?: Attachment[]) => Promise<WizardMessage | null>;
  deleteMessage: (id: string, userId: string) => Promise<void>;
  updateMessageText: (id: string, userId: string, newText: string) => Promise<void>;
  setConnected: (status: boolean) => void;
  setAutoMode: (enabled: boolean) => void;
  setSelectedManualModel: (model: string) => void;
  provideAIResponse: (id: string, userId: string, data: { response: string, engine: string, optimizedText?: string, selectedModel?: string }) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  isConnected: true,
  isSending: false,
  autoMode: true,
  selectedManualModel: 'googleai/gemini-1.5-flash',

  setConnected: (status) => set({ isConnected: status }),
  setAutoMode: (autoMode) => set({ autoMode }),
  setSelectedManualModel: (selectedManualModel) => set({ selectedManualModel }),

  loadMessages: (userId) => {
    set({ isLoading: true });
    const { firestore } = initializeFirebase();
    
    const messagesRef = collection(firestore, 'users', userId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WizardMessage));
      set({ messages, isLoading: false, isConnected: true });
    }, (err) => {
      console.error("Firestore Listen Error:", err);
      set({ isLoading: false, isConnected: false });
    });
  },

  sendMessage: async (text, userId, userName, attachments) => {
    const { firestore } = initializeFirebase();
    const { autoMode, selectedManualModel } = get();
    set({ isSending: true });

    try {
      const msgData = {
        userId,
        userName,
        text,
        originalText: text,
        isAutoMode: autoMode,
        selectedModel: autoMode ? 'Auto Selecting...' : selectedManualModel,
        response: null,
        status: 'sent',
        timestamp: new Date().toISOString(),
        attachments: attachments ?? []
      };

      const docRef = await addDoc(collection(firestore, 'users', userId, 'messages'), msgData);
      set({ isSending: false });
      return { id: docRef.id, ...msgData } as WizardMessage;
    } catch (err) {
      toast({ variant: 'destructive', title: 'Transmission Error', description: 'Failed to sync with local node.' });
      set({ isSending: false });
      return null;
    }
  },

  deleteMessage: async (id, userId) => {
    const { firestore } = initializeFirebase();
    try {
      await deleteDoc(doc(firestore, 'users', userId, 'messages', id));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Action Failed', description: 'Could not retract request.' });
    }
  },

  updateMessageText: async (id, userId, newText) => {
    const { firestore } = initializeFirebase();
    try {
      await updateDoc(doc(firestore, 'users', userId, 'messages', id), { text: newText });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Action Failed', description: 'Could not update transmission.' });
    }
  },

  provideAIResponse: async (id, userId, data) => {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'users', userId, 'messages', id);
    
    // بناء كائن التحديث يدوياً لتجنب تمرير قيم undefined لـ Firestore
    const updates: any = {
      response: data.response || "عذراً، لم يتم توليد رد.",
      engine: data.engine || "System",
    };

    // نستخدم null بدلاً من undefined لضمان سلامة حقول Firestore
    if (data.optimizedText !== undefined) updates.optimizedText = data.optimizedText;
    if (data.selectedModel !== undefined) updates.selectedModel = data.selectedModel;

    await updateDoc(docRef, updates);
  }
}));

export const getStoredMessages = async (userId?: string, fetchAll = false): Promise<WizardMessage[]> => {
  const { firestore } = initializeFirebase();
  const allMessages: WizardMessage[] = [];
  
  if (fetchAll) {
    try {
      const q = query(collectionGroup(firestore, 'messages'));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const data = d.data();
        allMessages.push({ id: d.id, ...data } as WizardMessage);
      });
    } catch (e) {
      console.error("Admin Fetch Error:", e);
    }
  } else if (userId) {
    const q = query(collection(firestore, 'users', userId, 'messages'), orderBy('timestamp', 'asc'));
    const snap = await getDocs(q);
    snap.forEach(d => allMessages.push({ id: d.id, ...d.data(), userId } as WizardMessage));
  }
  
  return allMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const approveMessage = async (id: string, userId: string, response: string, engine?: string) => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, 'users', userId, 'messages', id);
  await updateDoc(docRef, {
    response,
    engine: engine || 'Nexus Control',
    status: 'replied'
  });
};

export const rejectMessage = async (id: string, userId: string) => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, 'users', userId, 'messages', id);
  await updateDoc(docRef, {
    status: 'rejected'
  });
};

export const editMessage = async (id: string, userId: string, newResponse: string, reason: string) => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, 'users', userId, 'messages', id);
  await updateDoc(docRef, {
    response: newResponse,
    editReason: reason,
    status: 'replied'
  });
};
