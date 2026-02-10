
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

// Helper to map DB columns to UI interface with fallbacks for different casing
const mapMessageFromDB = (m: any): WizardMessage => {
  // Handle both camelCase and snake_case from DB
  const userId = m.userId || m.user_id || m.userid || '';
  const userName = m.userName || m.user_name || m.username || 'Unknown Node';
  const timestamp = m.timestamp || m.created_at || m.createdat || new Date().toISOString();
  const isEdited = m.isEdited || m.is_edited || m.isedited || false;
  const isUserEdited = m.isUserEdited || m.is_user_edited || m.isuseredited || false;
  const editReason = m.editReason || m.edit_reason || m.editreason || '';
  const editedAt = m.editedAt || m.edited_at || m.editedat || null;

  return {
    id: m.id,
    userId,
    userName,
    text: m.text || '',
    response: m.response || null,
    status: m.status || 'sent',
    timestamp,
    isEdited,
    isUserEdited,
    editReason,
    editedAt,
    attachments: m.attachments || []
  };
};

export const getStoredMessages = async (userId?: string, isAdmin?: boolean): Promise<WizardMessage[]> => {
  // We fetch without the column-specific filter initially to avoid "column does not exist" errors
  // We prioritize created_at for ordering as it's the Supabase default
  let query = supabase.from('messages').select('*');
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching messages:', error.message, error.details);
    return [];
  }

  let messages = (data || []).map(mapMessageFromDB);

  // Apply filtering in JS to be resilient to DB column naming (userId vs user_id vs userid)
  if (!isAdmin && userId) {
    messages = messages.filter(m => m.userId === userId);
  } else if (!isAdmin && !userId) {
    return [];
  }

  // Sort by timestamp/created_at
  return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const addWizardMessage = async (text: string, userId: string, userName: string, attachments?: Attachment[]): Promise<WizardMessage | null> => {
  // Use a flexible payload that attempts to satisfy common naming conventions
  const newMessage = {
    userId,
    user_id: userId, // fallback for snake_case
    userName,
    user_name: userName, // fallback for snake_case
    text,
    response: null,
    status: 'sent',
    attachments: attachments || [],
    timestamp: new Date().toISOString()
  };

  const { data, error } = await supabase.from('messages').insert([newMessage]).select().single();
  
  if (error) {
    console.error('Error adding message:', error.message);
    // If double column insertion fails, try a minimal set
    const fallbackMessage = { userId, userName, text, status: 'sent', timestamp: new Date().toISOString() };
    const { data: retryData, error: retryError } = await supabase.from('messages').insert([fallbackMessage]).select().single();
    if (retryError) return null;
    return mapMessageFromDB(retryData);
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
    isUserEdited: true,
    is_user_edited: true // snake_case fallback
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
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !original) return;

  const mappedOriginal = mapMessageFromDB(original);

  const { error: updateError } = await supabase.from('messages').update({
    response: newResponse,
    isEdited: true,
    is_edited: true, // snake_case fallback
    editReason: reason,
    edit_reason: reason, // snake_case fallback
    editedAt: new Date().toISOString(),
    edited_at: new Date().toISOString() // snake_case fallback
  }).eq('id', id);

  if (updateError) {
    console.error('Error editing response:', updateError.message);
    return;
  }

  addNotification({
    type: 'chat_correction',
    title: 'Transmission Corrected',
    message: `A message in your neural queue was adjusted: "${reason}"`,
    userId: mappedOriginal.userId,
    metadata: { messageId: id, reason }
  });
};

export const rejectMessage = async (id: string) => {
  const { error } = await supabase.from('messages').update({ status: 'rejected' }).eq('id', id);
  if (error) console.error('Error rejecting message:', error.message);
};
