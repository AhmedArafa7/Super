
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

// Resilient mapping with universal fallbacks for inconsistent schemas
const mapMessageFromDB = (m: any): WizardMessage => {
  try {
    const userId = m?.userId ?? m?.user_id ?? m?.userid ?? 'unknown';
    const userName = m?.userName ?? m?.user_name ?? m?.username ?? 'Anonymous Node';
    const timestamp = m?.timestamp ?? m?.created_at ?? m?.createdat ?? new Date().toISOString();
    const isEdited = m?.isEdited ?? m?.is_edited ?? m?.isedited ?? false;
    const isUserEdited = m?.isUserEdited ?? m?.is_user_edited ?? m?.isuseredited ?? false;
    const editReason = m?.editReason ?? m?.edit_reason ?? m?.editreason ?? '';
    const editedAt = m?.editedAt ?? m?.edited_at ?? m?.editedat ?? null;

    return {
      id: String(m?.id ?? Math.random()),
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
    return {
      id: 'error-' + Math.random(),
      userId: 'unknown',
      userName: 'Corrupted Packet',
      text: 'Message malformed',
      response: null,
      status: 'rejected',
      timestamp: new Date().toISOString()
    };
  }
};

export const getStoredMessages = async (userId?: string, isAdmin?: boolean): Promise<WizardMessage[]> => {
  try {
    const { data, error } = await supabase.from('messages').select('*');
    
    if (error) {
      console.warn('Chat fetch warning:', error.message);
      return [];
    }

    let messages = (data || []).map(mapMessageFromDB);

    // Defensive Filtering
    if (isAdmin) return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (userId) {
      return messages
        .filter(m => m.userId === userId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    return [];
  } catch (err) {
    console.error('Chat history subsystem failed:', err);
    return [];
  }
};

export const addWizardMessage = async (text: string, userId: string, userName: string, attachments?: Attachment[]): Promise<WizardMessage | null> => {
  if (!userId || !userName) return null;

  try {
    // Payload with both camel and snake for maximum table compatibility
    const payload = {
      userId,
      user_id: userId,
      userName,
      user_name: userName,
      text: text ?? '',
      status: 'sent',
      attachments: attachments ?? [],
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase.from('messages').insert([payload]).select().single();
    
    if (error) {
      console.error('Transmission failed:', error.message);
      throw error;
    }
    return mapMessageFromDB(data);
  } catch (err) {
    console.error('Message insertion failure:', err);
    throw err; // Let UI preserve input
  }
};

export const updateMessageStatus = async (id: string, status: MessageStatus) => {
  if (!id) return;
  try {
    const { error } = await supabase.from('messages').update({ status }).eq('id', id);
    if (error) console.warn('Status update warning:', error.message);
  } catch (err) {
    console.error('Status sync failure:', err);
  }
};

export const updateMessageText = async (id: string, text: string) => {
  if (!id) return;
  try {
    const { error } = await supabase.from('messages').update({ 
      text: text ?? '', 
      is_user_edited: true,
      isUserEdited: true
    }).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('Message text sync failure:', err);
    throw err;
  }
};

export const deleteMessage = async (id: string) => {
  if (!id) return;
  try {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) console.warn('Deletion warning:', error.message);
  } catch (err) {
    console.error('Message deletion failure:', err);
  }
};

export const approveMessage = async (id: string, response: string) => {
  if (!id) return;
  try {
    const { error } = await supabase.from('messages').update({ 
      response: response ?? '', 
      status: 'replied' 
    }).eq('id', id);
    
    if (error) throw error;
  } catch (err) {
    console.error('Message approval failure:', err);
  }
};

export const editMessage = async (id: string, newResponse: string, reason: string) => {
  if (!id) return;
  try {
    const { error: updateError } = await supabase.from('messages').update({
      response: newResponse ?? '',
      is_edited: true,
      isEdited: true,
      edit_reason: reason ?? '',
      editReason: reason ?? '',
      edited_at: new Date().toISOString(),
      editedAt: new Date().toISOString()
    }).eq('id', id);

    if (updateError) throw updateError;
  } catch (err) {
    console.error('Moderation adjustment failure:', err);
  }
};

export const rejectMessage = async (id: string) => {
  if (!id) return;
  try {
    const { error } = await supabase.from('messages').update({ status: 'rejected' }).eq('id', id);
    if (error) console.warn('Rejection warning:', error.message);
  } catch (err) {
    console.error('Rejection sync failure:', err);
  }
};
