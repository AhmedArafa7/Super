
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

// Helper to map DB snake_case to UI camelCase
const mapMessageFromDB = (m: any): WizardMessage => ({
  id: m.id,
  userId: m.user_id,
  userName: m.user_name,
  text: m.text,
  response: m.response,
  status: m.status,
  timestamp: m.created_at,
  isEdited: m.is_edited,
  isUserEdited: m.is_user_edited,
  editReason: m.edit_reason,
  editedAt: m.edited_at,
  attachments: m.attachments || []
});

export const getStoredMessages = async (userId?: string, isAdmin?: boolean): Promise<WizardMessage[]> => {
  // Ordering by created_at as requested for Supabase compatibility
  let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
  
  if (!isAdmin && userId) {
    query = query.eq('user_id', userId);
  } else if (!isAdmin && !userId) {
    return [];
  }

  const { data, error } = await query;
  if (error) {
    // Better error logging for debugging schema issues
    console.error('Error fetching messages:', error.message, error.details);
    return [];
  }
  return (data || []).map(mapMessageFromDB);
};

export const addWizardMessage = async (text: string, userId: string, userName: string, attachments?: Attachment[]): Promise<WizardMessage | null> => {
  const newMessage = {
    user_id: userId,
    user_name: userName,
    text,
    response: null,
    status: 'sent',
    attachments: attachments || [],
  };

  const { data, error } = await supabase.from('messages').insert([newMessage]).select().single();
  
  if (error) {
    console.error('Error adding message:', error.message);
    return null;
  }
  return mapMessageFromDB(data);
};

export const updateMessageStatus = async (id: string, status: MessageStatus) => {
  const { error } = await supabase.from('messages').update({ status }).eq('id', id);
  if (error) console.error('Error updating status:', error.message);
};

export const updateMessageText = async (id: string, text: string) => {
  const { error } = await supabase.from('messages').update({ 
    text, 
    is_user_edited: true 
  }).eq('id', id);
  if (error) console.error('Error updating text:', error.message);
};

export const deleteMessage = async (id: string) => {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) console.error('Error deleting message:', error.message);
};

export const approveMessage = async (id: string, response: string) => {
  const { error } = await supabase.from('messages').update({ 
    response, 
    status: 'replied' 
  }).eq('id', id);
  
  if (error) console.error('Error approving message:', error.message);
};

export const editMessage = async (id: string, newResponse: string, reason: string) => {
  const { data: original, error: fetchError } = await supabase
    .from('messages')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError) return;

  const { error: updateError } = await supabase.from('messages').update({
    response: newResponse,
    is_edited: true,
    edit_reason: reason,
    edited_at: new Date().toISOString()
  }).eq('id', id);

  if (updateError) {
    console.error('Error editing response:', updateError.message);
    return;
  }

  addNotification({
    type: 'chat_correction',
    title: 'Transmission Corrected',
    message: `A message in your neural queue was adjusted: "${reason}"`,
    userId: (original as any).user_id,
    metadata: { messageId: id, reason }
  });
};

export const rejectMessage = async (id: string) => {
  const { error } = await supabase.from('messages').update({ status: 'rejected' }).eq('id', id);
  if (error) console.error('Error rejecting message:', error.message);
};
