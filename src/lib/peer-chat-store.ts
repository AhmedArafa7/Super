
'use client';

import { create } from 'zustand';
import { collection, addDoc, query, orderBy, onSnapshot, where, Timestamp, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export interface PeerMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
}

interface PeerChatState {
  messages: PeerMessage[];
  isLoading: boolean;
  activeChatId: string | null;
  loadMessages: (currentUserId: string, targetUserId: string) => () => void;
  sendMessage: (senderId: string, targetUserId: string, text: string) => Promise<void>;
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

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      } as PeerMessage));
      set({ messages, isLoading: false, activeChatId: chatId });
    });
  },

  sendMessage: async (senderId, targetUserId, text) => {
    if (!text.trim()) return;
    const { firestore } = initializeFirebase();
    const chatId = [senderId, targetUserId].sort().join('_');
    
    await addDoc(collection(firestore, 'chats', chatId, 'messages'), {
      senderId,
      text,
      timestamp: Timestamp.now()
    });
  }
}));
