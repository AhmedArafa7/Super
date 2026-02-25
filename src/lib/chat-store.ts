'use client';

import { create } from 'zustand';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, getDocs, collectionGroup } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
  text: string; 
  originalText: string;
  optimizedText?: string;
  selectedModel?: string;
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
  updateMessageRequest: (id: string, userId: string, newText: string) => Promise<boolean>;
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
  selectedManualModel: 'googleai/gemini-1.5-flash-latest',

  setConnected: (status) => set({ isConnected: status }),
  setAutoMode: (autoMode) => set({ autoMode }),
  setSelectedManualModel: (selectedManualModel) => set({ selectedManualModel }),

  loadMessages: (userId) => {
    set({ isLoading: true });
    const { firestore } = initializeFirebase();
    
    const messagesRef = collection(firestore, 'users', userId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, 
      (snapshot) => {
        const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WizardMessage));
        set({ messages, isLoading: false, isConnected: true });
      }, 
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: messagesRef.path,
          operation: 'list',
        } satisfies SecurityRuleContext);
        
        errorEmitter.emit('permission-error', permissionError);
        set({ isLoading: false, isConnected: false });
      }
    );
  },

  sendMessage: async (text, userId, userName, attachments) => {
    const { firestore } = initializeFirebase();
    const { autoMode, selectedManualModel } = get();
    set({ isSending: true });

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

    const messagesRef = collection(firestore, 'users', userId, 'messages');
    
    addDoc(messagesRef, msgData)
      .then((docRef) => {
        set({ isSending: false });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: messagesRef.path,
          operation: 'create',
          requestResourceData: msgData,
        } satisfies SecurityRuleContext);
        
        errorEmitter.emit('permission-error', permissionError);
        set({ isSending: false });
      });

    return { id: 'temp-' + Date.now(), ...msgData } as WizardMessage;
  },

  updateMessageRequest: async (id, userId, newText) => {
    const { firestore } = initializeFirebase();
    const { autoMode, selectedManualModel } = get();
    set({ isSending: true });

    const docRef = doc(firestore, 'users', userId, 'messages', id);
    const updates = {
      text: newText,
      originalText: newText,
      isAutoMode: autoMode,
      selectedModel: autoMode ? 'Auto Selecting...' : selectedManualModel,
      response: null, 
      optimizedText: null, 
      status: 'sent', 
      timestamp: new Date().toISOString()
    };

    updateDoc(docRef, updates)
      .then(() => set({ isSending: false }))
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: updates,
        } satisfies SecurityRuleContext);
        
        errorEmitter.emit('permission-error', permissionError);
        set({ isSending: false });
      });

    return true;
  },

  deleteMessage: async (id, userId) => {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'users', userId, 'messages', id);
    
    deleteDoc(docRef).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      } satisfies SecurityRuleContext);
      
      errorEmitter.emit('permission-error', permissionError);
    });
  },

  updateMessageText: async (id, userId, newText) => {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'users', userId, 'messages', id);
    
    updateDoc(docRef, { text: newText }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: { text: newText },
      } satisfies SecurityRuleContext);
      
      errorEmitter.emit('permission-error', permissionError);
    });
  },

  provideAIResponse: async (id, userId, data) => {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'users', userId, 'messages', id);
    
    const updates: any = {
      response: data.response || "عذراً، لم يتم توليد رد.",
      engine: data.engine || "System",
      optimizedText: data.optimizedText || null,
      selectedModel: data.selectedModel || null,
      status: 'replied' 
    };

    updateDoc(docRef, updates).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: updates,
      } satisfies SecurityRuleContext);
      
      errorEmitter.emit('permission-error', permissionError);
    });
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

export const approveMessage = async (id: string, userId: string, response: string, optimizedText?: string) => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, 'users', userId, 'messages', id);
  const updates: any = {
    response,
    status: 'replied'
  };
  if (optimizedText) updates.optimizedText = optimizedText;
  
  updateDoc(docRef, updates).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: updates,
    } satisfies SecurityRuleContext);
    
    errorEmitter.emit('permission-error', permissionError);
  });
};

export const rejectMessage = async (id: string, userId: string) => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, 'users', userId, 'messages', id);
  updateDoc(docRef, { status: 'rejected' }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { status: 'rejected' },
    } satisfies SecurityRuleContext);
    
    errorEmitter.emit('permission-error', permissionError);
  });
};