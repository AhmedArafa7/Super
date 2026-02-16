
'use client';

import { create } from 'zustand';
import { supabase } from './supabaseClient';
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
  text: string;
  response: string | null;
  status: MessageStatus;
  timestamp: string;
  isEdited?: boolean;
  editReason?: string;
  attachments?: Attachment[];
}

interface ChatState {
  messages: WizardMessage[];
  isLoading: boolean;
  isConnected: boolean;
  isSending: boolean;
  loadMessages: (userId: string, isAdmin: boolean) => Promise<void>;
  sendMessage: (text: string, userId: string, userName: string, attachments?: Attachment[]) => Promise<WizardMessage | null>;
  updateMessageText: (id: string, text: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  setConnected: (status: boolean) => void;
  approveMessage: (id: string, response: string) => Promise<void>;
  rejectMessage: (id: string) => Promise<void>;
  editMessage: (id: string, newResponse: string, reason: string) => Promise<void>;
}

const mapMessageFromDB = (m: any): WizardMessage => {
  return {
    id: m.id,
    userId: m.sender_id || 'unknown',
    userName: m.sender_name || 'Anonymous Node',
    text: m.text || '',
    response: m.response || null,
    status: (m.status as MessageStatus) || 'sent',
    timestamp: m.created_at || new Date().toISOString(),
    isEdited: m.is_edited || false,
    editReason: m.edit_reason || '',
    attachments: m.attachments || []
  };
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  isConnected: false,
  isSending: false,

  setConnected: (status) => set({ isConnected: status }),

  loadMessages: async (userId, isAdmin) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      
      let mapped = (data || []).map(mapMessageFromDB);
      if (!isAdmin && userId) {
        mapped = mapped.filter(m => m.userId === userId);
      }
      
      set({ messages: mapped, isLoading: false });
    } catch (err: any) {
      console.error('Failed to load chat history:', err.message);
      set({ isLoading: false });
    }
  },

  sendMessage: async (text, userId, userName, attachments) => {
    const optimisticId = crypto.randomUUID();
    const optimisticMsg: WizardMessage = {
      id: optimisticId,
      userId,
      userName,
      text,
      response: null,
      status: 'queued',
      timestamp: new Date().toISOString(),
      attachments: attachments ?? []
    };

    set(state => ({ 
      messages: [...state.messages, optimisticMsg],
      isSending: true 
    }));

    try {
      const payload = {
        sender_id: userId,
        sender_name: userName,
        text: text,
        status: 'sent',
        attachments: attachments ?? []
      };

      const { data, error } = await supabase.from('messages').insert([payload]).select().single();
      if (error) throw error;

      const savedMsg = mapMessageFromDB(data);
      set(state => ({
        messages: state.messages.map(m => m.id === optimisticId ? savedMsg : m),
        isSending: false
      }));
      return savedMsg;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Sync Error', description: 'Failed to transmit message.' });
      set(state => ({ 
        messages: state.messages.filter(m => m.id !== optimisticId),
        isSending: false 
      }));
      return null;
    }
  },

  updateMessageText: async (id, text) => {
    try {
      const { error } = await supabase.from('messages').update({ text }).eq('id', id);
      if (error) throw error;
      set(state => ({
        messages: state.messages.map(m => m.id === id ? { ...m, text } : m)
      }));
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Edit Error', description: err.message });
    }
  },

  deleteMessage: async (id) => {
    try {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) throw error;
      set(state => ({ messages: state.messages.filter(m => m.id !== id) }));
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Retract Error', description: err.message });
    }
  },

  approveMessage: async (id, response) => {
    try {
      const { error } = await supabase.from('messages').update({ response, status: 'replied' }).eq('id', id);
      if (error) throw error;
      set(state => ({
        messages: state.messages.map(m => m.id === id ? { ...m, response, status: 'replied' } : m)
      }));
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Admin Error', description: err.message });
    }
  },

  rejectMessage: async (id) => {
    try {
      const { error } = await supabase.from('messages').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      set(state => ({
        messages: state.messages.map(m => m.id === id ? { ...m, status: 'rejected' } : m)
      }));
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Admin Error', description: err.message });
    }
  },

  editMessage: async (id, newResponse, reason) => {
    try {
      const { error } = await supabase.from('messages').update({
        response: newResponse,
        is_edited: true,
        edit_reason: reason
      }).eq('id', id);
      if (error) throw error;
      set(state => ({
        messages: state.messages.map(m => m.id === id ? { 
          ...m, 
          response: newResponse, 
          isEdited: true, 
          editReason: reason
        } : m)
      }));
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Correction Error', description: err.message });
    }
  }
}));

export const getStoredMessages = async (userId?: string, isAdmin?: boolean) => {
  const store = useChatStore.getState();
  await store.loadMessages(userId || '', !!isAdmin);
  return useChatStore.getState().messages;
};

export const approveMessage = (id: string, response: string) => useChatStore.getState().approveMessage(id, response);
export const rejectMessage = (id: string) => useChatStore.getState().rejectMessage(id);
export const editMessage = (id: string, newResponse: string, reason: string) => useChatStore.getState().editMessage(id, newResponse, reason);
