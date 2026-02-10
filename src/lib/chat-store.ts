
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

// Helper to map DB columns to UI interface
const mapMessageFromDB = (m: any): WizardMessage => ({
  id: m.id,
  userId: m.userId,
  userName: m.userName,
  text: m.text,
  response: m.response,
  status: m.status,
  timestamp: m.timestamp || m.created_at,
  isEdited: m.isEdited,
  isUserEdited: m.isUserEdited,
  editReason: m.editReason,
  editedAt: m.editedAt,
  attachments: m.attachments || []
});

export const getStoredMessages = async (userId?: string, isAdmin?: boolean): Promise<WizardMessage[]> => {
  // Select all columns and order by timestamp
  let query = supabase.from('messages').select('*').order('timestamp', { ascending: true });
  
  if (!isAdmin && userId) {
    // Corrected to use camelCase 'userId' to match typical JS-to-Supabase migrations
    query = query.eq('userId', userId);
  } else if (!isAdmin && !userId) {
    return [];
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching messages:', error.message, error.details);
    return [];
  }
  return (data || []).map(mapMessageFromDB);
};

export const addWizardMessage = async (text: string, userId: string, userName: string, attachments?: Attachment[]): Promise<WizardMessage | null> => {
  const newMessage = {
    userId,
    userName,
    text,
    response: null,
    status: 'sent',
    attachments: attachments || [],
    timestamp: new Date().toISOString()
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
    isUserEdited: true 
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
    .select('userId')
    .eq('id', id)
    .single();

  if (fetchError) return;

  const { error: updateError } = await supabase.from('messages').update({
    response: newResponse,
    isEdited: true,
    editReason: reason,
    editedAt: new Date().toISOString()
  }).eq('id', id);

  if (updateError) {
    console.error('Error editing response:', updateError.message);
    return;
  }

  addNotification({
    type: 'chat_correction',
    title: 'Transmission Corrected',
    message: `A message in your neural queue was adjusted: "${reason}"`,
    userId: (original as any).userId,
    metadata: { messageId: id, reason }
  });
};

export const rejectMessage = async (id: string) => {
  const { error } = await supabase.from('messages').update({ status: 'rejected' }).eq('id', id);
  if (error) console.error('Error rejecting message:', error.message);
};
