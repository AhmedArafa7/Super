
'use client';

import { supabase } from './supabaseClient';
import { addNotification } from './notification-store';

export type MessageStatus = 'queued' | 'sent' | 'processing' | 'replied' | 'rejected';

export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'file';
  name: string;
  url: string; // Base64 or CDN URL
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

// Helper to map DB columns to UI interface with fallbacks
const mapMessageFromDB = (m: any): WizardMessage => {
  try {
    const userId = m?.userId ?? m?.user_id ?? m?.userid ?? '';
    const userName = m?.userName ?? m?.user_name ?? m?.username ?? 'Unknown Node';
    const timestamp = m?.timestamp ?? m?.created_at ?? m?.createdat ?? new Date().toISOString();
    const isEdited = m?.isEdited ?? m?.is_edited ?? m?.isedited ?? false;
    const isUserEdited = m?.isUserEdited ?? m?.is_user_edited ?? m?.isuseredited ?? false;
    const editReason = m?.editReason ?? m?.edit_reason ?? m?.editreason ?? '';
    const editedAt = m?.editedAt ?? m?.edited_at ?? m?.editedat ?? null;

    return {
      id: m?.id ?? '',
      userId,
      userName,
      text: m?.text ?? '',
      response: m?.response ?? null,
      status: (m?.status as MessageStatus) ?? 'sent',
      timestamp,
      isEdited,
      isUserEdited,
      editReason,
      editedAt,
      attachments: m?.attachments ?? []
    };
  } catch (e) {
    console.error('Fatal mapping error in chat-store:', e);
    return {
      id: 'error',
      userId: '',
      userName: 'Error Node',
      text: 'Malformed message data',
      response: null,
      status: 'rejected',
      timestamp: new Date().toISOString()
    };
  }
};

export const getStoredMessages = async (userId?: string, isAdmin?: boolean): Promise<WizardMessage[]> => {
  try {
    const query = supabase.from('messages').select('*');
    const { data, error } = await query;
    
    if (error) {
      console.error('Database error fetching messages:', error.message);
      return [];
    }

    let messages = (data || []).map(mapMessageFromDB);

    if (!isAdmin && userId) {
      messages = messages.filter(m => m.userId === userId);
    } else if (!isAdmin && !userId) {
      return [];
    }

    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (err) {
    console.error('Unexpected crash in getStoredMessages:', err);
    return [];
  }
};

export const addWizardMessage = async (text: string, userId: string, userName: string, attachments?: Attachment[]): Promise<WizardMessage | null> => {
  if (!userId || !userName) return null;

  try {
    const newMessage = {
      userId,
      user_id: userId,
      userName,
      user_name: userName,
      text: text ?? '',
      response: null,
      status: 'sent',
      attachments: attachments ?? [],
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase.from('messages').insert([newMessage]).select().single();
    
    if (error) {
      console.error('Insertion failed:', error.message);
      throw error;
    }
    return mapMessageFromDB(data);
  } catch (err) {
    console.error('Critical failure in addWizardMessage:', err);
    throw err; // Re-throw to let component handle input persistence
  }
};

export const updateMessageStatus = async (id: string, status: MessageStatus) => {
  try {
    const { error } = await supabase.from('messages').update({ status }).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('Status update failed:', err);
  }
};

export const updateMessageText = async (id: string, text: string) => {
  try {
    const { error } = await supabase.from('messages').update({ 
      text: text ?? '', 
      isUserEdited: true,
      is_user_edited: true
    }).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('Text update failed:', err);
  }
};

export const deleteMessage = async (id: string) => {
  try {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('Deletion failed:', err);
  }
};

export const approveMessage = async (id: string, response: string) => {
  try {
    const { error } = await supabase.from('messages').update({ 
      response: response ?? '', 
      status: 'replied' 
    }).eq('id', id);
    
    if (error) throw error;
  } catch (err) {
    console.error('Approval failed:', err);
  }
};

export const editMessage = async (id: string, newResponse: string, reason: string) => {
  try {
    const { data: original, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !original) throw new Error('Original message not found');

    const mappedOriginal = mapMessageFromDB(original);

    const { error: updateError } = await supabase.from('messages').update({
      response: newResponse ?? '',
      isEdited: true,
      is_edited: true,
      editReason: reason ?? '',
      edit_reason: reason ?? '',
      editedAt: new Date().toISOString(),
      edited_at: new Date().toISOString()
    }).eq('id', id);

    if (updateError) throw updateError;

    addNotification({
      type: 'chat_correction',
      title: 'Transmission Corrected',
      message: `A message in your neural queue was adjusted: "${reason}"`,
      userId: mappedOriginal.userId,
      metadata: { messageId: id, reason }
    });
  } catch (err) {
    console.error('Response edit failed:', err);
  }
};

export const rejectMessage = async (id: string) => {
  try {
    const { error } = await supabase.from('messages').update({ status: 'rejected' }).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('Rejection failed:', err);
  }
};
