
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
  isUserEdited?: boolean;
  editReason?: string;
  editedAt?: string;
  attachments?: Attachment[];
}

interface ChatState {
  messages: WizardMessage[];
  isLoading: boolean;
  isConnected: boolean;
  isSending: boolean;
  loadMessages: (userId: string, isAdmin: boolean) => Promise<void>;
  sendMessage: (text: string, userId: string, userName: string, attachments?: Attachment[]) => Promise<void>;
  updateMessageText: (id: string, text: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  setConnected: (status: boolean) => void;
  // Admin actions
  approveMessage: (id: string, response: string) => Promise<void>;
  rejectMessage: (id: string) => Promise<void>;
  editMessage: (id: string, newResponse: string, reason: string) => Promise<void>;
}

const mapMessageFromDB = (m: any): WizardMessage => {
  return {
    id: String(m?.id ?? Math.random()),
    userId: m?.userId ?? m?.user_id ?? 'unknown',
    userName: m?.userName ?? m?.user_name ?? 'Anonymous Node',
    text: m?.text ?? '',
    response: m?.response ?? null,
    status: (m?.status as MessageStatus) ?? 'sent',
    timestamp: m?.timestamp ?? m?.created_at ?? new Date().toISOString(),
    isEdited: m?.isEdited ?? m?.is_edited ?? false,
    isUserEdited: m?.isUserEdited ?? m?.is_user_edited ?? false,
    editReason: m?.editReason ?? m?.edit_reason ?? '',
    editedAt: m?.editedAt ?? m?.edited_at ?? null,
    attachments: m?.attachments ?? []
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
      const { data, error } = await supabase.from('messages').select('*');
      if (error) throw error;
      
      let mapped = (data || []).map(mapMessageFromDB);
      if (!isAdmin) {
        mapped = mapped.filter(m => m.userId === userId);
      }
      
      set({ 
        messages: mapped.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        isLoading: false 
      });
    } catch (err) {
      console.error('Failed to load chat history:', err);
      set({ isLoading: false });
    }
  },

  sendMessage: async (text, userId, userName, attachments) => {
    const optimisticId = `opt-${Math.random()}`;
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
        user_id: userId,
        user_name: userName,
        text: text ?? '',
        status: 'sent',
        attachments: attachments ?? [],
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase.from('messages').insert([payload]).select().single();
      if (error) throw error;

      // Replace optimistic message with actual data
      set(state => ({
        messages: state.messages.map(m => m.id === optimisticId ? mapMessageFromDB(data) : m),
        isSending: false
      }));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Sync Error', description: 'Failed to transmit message.' });
      set(state => ({ 
        messages: state.messages.filter(m => m.id !== optimisticId),
        isSending: false 
      }));
      throw err;
    }
  },

  updateMessageText: async (id, text) => {
    try {
      const { error } = await supabase.from('messages').update({ 
        text, 
        is_user_edited: true 
      }).eq('id', id);
      if (error) throw error;
      
      set(state => ({
        messages: state.messages.map(m => m.id === id ? { ...m, text, isUserEdited: true } : m)
      }));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Edit Error', description: 'Failed to update request.' });
    }
  },

  deleteMessage: async (id) => {
    try {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) throw error;
      set(state => ({ messages: state.messages.filter(m => m.id !== id) }));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Sync Error', description: 'Failed to retract message.' });
    }
  },

  approveMessage: async (id, response) => {
    try {
      const { error } = await supabase.from('messages').update({ response, status: 'replied' }).eq('id', id);
      if (error) throw error;
      set(state => ({
        messages: state.messages.map(m => m.id === id ? { ...m, response, status: 'replied' } : m)
      }));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Admin Error', description: 'Failed to approve message.' });
    }
  },

  rejectMessage: async (id) => {
    try {
      const { error } = await supabase.from('messages').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      set(state => ({
        messages: state.messages.map(m => m.id === id ? { ...m, status: 'rejected' } : m)
      }));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Admin Error', description: 'Failed to reject message.' });
    }
  },

  editMessage: async (id, newResponse, reason) => {
    try {
      const { error } = await supabase.from('messages').update({
        response: newResponse,
        is_edited: true,
        edit_reason: reason,
        edited_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      set(state => ({
        messages: state.messages.map(m => m.id === id ? { 
          ...m, 
          response: newResponse, 
          isEdited: true, 
          editReason: reason, 
          editedAt: new Date().toISOString() 
        } : m)
      }));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Admin Error', description: 'Failed to correct response.' });
    }
  }
}));

// Backward compatibility exports for components that haven't migrated to useChatStore hook yet
export const getStoredMessages = async (userId?: string, isAdmin?: boolean) => {
  const store = useChatStore.getState();
  await store.loadMessages(userId || '', !!isAdmin);
  return useChatStore.getState().messages;
};

export const addWizardMessage = (text: string, userId: string, userName: string, attachments?: Attachment[]) => {
  return useChatStore.getState().sendMessage(text, userId, userName, attachments);
};

export const updateMessageStatus = async (id: string, status: MessageStatus) => {
  // Simple status update
  await supabase.from('messages').update({ status }).eq('id', id);
};

export const deleteMessage = (id: string) => useChatStore.getState().deleteMessage(id);
export const approveMessage = (id: string, response: string) => useChatStore.getState().approveMessage(id, response);
export const editMessage = (id: string, newResponse: string, reason: string) => useChatStore.getState().editMessage(id, newResponse, reason);
export const rejectMessage = (id: string) => useChatStore.getState().rejectMessage(id);
export const updateMessageText = (id: string, text: string) => useChatStore.getState().updateMessageText(id, text);
