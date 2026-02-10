
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

export const getStoredMessages = async (userId?: string, isAdmin?: boolean): Promise<WizardMessage[]> => {
  let query = supabase.from('messages').select('*').order('timestamp', { ascending: true });
  
  if (!isAdmin && userId) {
    query = query.eq('userId', userId);
  } else if (!isAdmin && !userId) {
    return [];
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return data as WizardMessage[];
};

export const addWizardMessage = async (text: string, userId: string, userName: string, attachments?: Attachment[]): Promise<WizardMessage | null> => {
  const newMessage: Omit<WizardMessage, 'id'> = {
    userId,
    userName,
    text,
    response: null,
    status: 'sent', // Since we're going direct to Supabase now
    timestamp: new Date().toISOString(),
    attachments: attachments || [],
  };

  const { data, error } = await supabase.from('messages').insert([newMessage]).select().single();
  
  if (error) {
    console.error('Error adding message:', error);
    return null;
  }
  return data as WizardMessage;
};

export const updateMessageStatus = async (id: string, status: MessageStatus) => {
  const { error } = await supabase.from('messages').update({ status }).eq('id', id);
  if (error) console.error('Error updating status:', error);
};

export const updateMessageText = async (id: string, text: string) => {
  const { error } = await supabase.from('messages').update({ text, isUserEdited: true }).eq('id', id);
  if (error) console.error('Error updating text:', error);
};

export const deleteMessage = async (id: string) => {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) console.error('Error deleting message:', error);
};

export const approveMessage = async (id: string, response: string) => {
  const { error } = await supabase.from('messages').update({ 
    response, 
    status: 'replied' 
  }).eq('id', id);
  
  if (error) console.error('Error approving message:', error);
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
    console.error('Error editing response:', updateError);
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
  if (error) console.error('Error rejecting message:', error);
};
