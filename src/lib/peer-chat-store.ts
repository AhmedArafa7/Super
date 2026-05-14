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
  loadMessages: (currentUserId: string, targetUserId: string, platform?: string) => () => void;
  sendMessage: (senderId: string, targetUserId: string, data: { text?: string, imageUrl?: string, type: MessageType }, platform?: string) => Promise<void>;
  markAsRead: (chatId: string, messageId: string, platform?: string, userId?: string) => Promise<void>;
}

export const usePeerChatStore = create<PeerChatState>((set) => ({
  messages: [],
  isLoading: false,
  activeChatId: null,

  loadMessages: (currentUserId, targetUserId, platform = 'nexus') => {
    set({ isLoading: true, messages: [] });
    const { firestore } = initializeFirebase();
    
    if (platform === 'whatsapp') {
      const messagesRef = collection(firestore, 'users', currentUserId, 'messages');
      const q = query(
        messagesRef, 
        where('from', 'in', [targetUserId, 'me']), // 'me' للرسائل المرسلة مني
        orderBy('timestamp', 'asc'), 
        limit(100)
      );

      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            senderId: data.type === 'outgoing' ? currentUserId : targetUserId,
            text: data.text,
            type: data.msgType || 'text',
            isRead: data.status === 'read',
            timestamp: data.timestamp
          } as PeerMessage;
        });
        set({ messages, isLoading: false, activeChatId: `wa_${targetUserId}` });
      });
    }

    // الوضع الافتراضي (Nexus P2P)
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
        console.error("Firestore Error:", serverError);
        set({ isLoading: false });
      }
    );
  },

  sendMessage: async (senderId, targetUserId, data, platform = 'nexus') => {
    if (!data.text?.trim() && !data.imageUrl) return;
    const { firestore } = initializeFirebase();
    
    if (platform === 'whatsapp') {
      // 1. حفظ في Firestore كرسالة مرسلة
      const messagesRef = collection(firestore, 'users', senderId, 'messages');
      await addDoc(messagesRef, {
        from: targetUserId,
        text: data.text || "",
        type: 'outgoing',
        msgType: data.type,
        timestamp: Timestamp.now(),
        status: 'sent',
        source: 'whatsapp'
      });

      // 2. إرسال حقيقي عبر الـ API
      fetch('/api/auth/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: senderId,
          to: targetUserId,
          text: data.text
        })
      }).catch(err => console.error("WhatsApp Send API Failed:", err));
      
      return;
    }

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

    addDoc(messagesRef, payload).catch(err => console.error("Send Error:", err));
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