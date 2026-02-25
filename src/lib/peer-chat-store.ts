'use client';

import { create } from 'zustand';
import { collection, addDoc, query, orderBy, onSnapshot, where, Timestamp, limit, updateDoc, doc, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export type MessageType = 'text' | 'image' | 'file';

export interface PeerMessage {
  id: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  type: MessageType;
  isRead: boolean;
  timestamp: any;
}

interface PeerChatState {
  messages: PeerMessage[];
  isLoading: boolean;
  activeChatId: string | null;
  loadMessages: (currentUserId: string, targetUserId: string) => () => void;
  sendMessage: (senderId: string, targetUserId: string, data: { text?: string, imageUrl?: string, type: MessageType }) => Promise<void>;
  markAsRead: (chatId: string, messageId: string) => Promise<void>;
}

export const usePeerChatStore = create<PeerChatState>((set) => ({
  messages: [],
  isLoading: false,
  activeChatId: null,

  loadMessages: (currentUserId, targetUserId) => {
    set({ isLoading: true, messages: [] });
    const { firestore } = initializeFirebase();
    
    // معرف الدردشة الموحد (ترتيب المعرفات أبجدياً لضمان غرفة واحدة)
    const chatId = [currentUserId, targetUserId].sort().join('_');
    
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));

    return onSnapshot(q, 
      (snapshot) => {
        const messages = snapshot.docs.map(d => ({ 
          id: d.id, 
          ...d.data() 
        } as PeerMessage));
        set({ messages, isLoading: false, activeChatId: chatId });
      },
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: messagesRef.path,
          operation: 'list',
        } satisfies SecurityRuleContext);
        
        errorEmitter.emit('permission-error', permissionError);
        set({ isLoading: false });
      }
    );
  },

  sendMessage: async (senderId, targetUserId, data) => {
    if (!data.text?.trim() && !data.imageUrl) return;
    const { firestore } = initializeFirebase();
    const chatId = [senderId, targetUserId].sort().join('_');
    
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const payload = {
      senderId,
      text: data.text || "",
      imageUrl: data.imageUrl || null,
      type: data.type,
      isRead: false,
      timestamp: Timestamp.now()
    };

    addDoc(messagesRef, payload).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: messagesRef.path,
        operation: 'create',
        requestResourceData: payload,
      } satisfies SecurityRuleContext);
      
      errorEmitter.emit('permission-error', permissionError);
    });
  },

  markAsRead: async (chatId, messageId) => {
    const { firestore } = initializeFirebase();
    const msgRef = doc(firestore, 'chats', chatId, 'messages', messageId);
    
    updateDoc(msgRef, { isRead: true }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: msgRef.path,
        operation: 'update',
        requestResourceData: { isRead: true },
      } satisfies SecurityRuleContext);
      
      errorEmitter.emit('permission-error', permissionError);
    });
  }
}));