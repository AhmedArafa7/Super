
'use client';

import { addNotification } from './notification-store';

export type MessageStatus = 'queued' | 'sent' | 'processing' | 'replied' | 'rejected';

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
  editedAt?: string;
}

const STORAGE_KEY = 'nexus_wizard_messages';

export const getStoredMessages = (userId?: string, isAdmin?: boolean): WizardMessage[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  const allMessages: WizardMessage[] = stored ? JSON.parse(stored) : [];
  
  if (isAdmin) return allMessages;
  if (userId) return allMessages.filter(m => m.userId === userId);
  return [];
};

export const saveMessages = (messages: WizardMessage[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  window.dispatchEvent(new Event('storage-update'));
};

export const addWizardMessage = (text: string, userId: string, userName: string): WizardMessage => {
  const messages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const newMessage: WizardMessage = {
    id: Math.random().toString(36).substring(2, 15),
    userId,
    userName,
    text,
    response: null,
    status: 'queued',
    timestamp: new Date().toISOString(),
  };
  saveMessages([...messages, newMessage]);
  return newMessage;
};

export const updateMessageStatus = (id: string, status: MessageStatus) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const messages: WizardMessage[] = stored ? JSON.parse(stored) : [];
  const updated = messages.map((m) =>
    m.id === id ? { ...m, status } : m
  );
  saveMessages(updated);
};

export const approveMessage = (id: string, response: string) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const messages: WizardMessage[] = stored ? JSON.parse(stored) : [];
  const updated = messages.map((m) =>
    m.id === id ? { ...m, response, status: 'replied' as const } : m
  );
  saveMessages(updated);
};

export const editMessage = (id: string, newResponse: string, reason: string) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const messages: WizardMessage[] = stored ? JSON.parse(stored) : [];
  let targetUserId = '';
  
  const updated = messages.map((m) => {
    if (m.id === id) {
      targetUserId = m.userId;
      return { 
        ...m, 
        response: newResponse, 
        isEdited: true, 
        editReason: reason, 
        editedAt: new Date().toISOString()
      };
    }
    return m;
  });
  
  saveMessages(updated);

  // Trigger centralized notification for the specific user
  addNotification({
    type: 'chat_correction',
    title: 'Transmission Corrected',
    message: `A message in your neural queue was adjusted: "${reason}"`,
    userId: targetUserId,
    metadata: { messageId: id, reason }
  });
};

export const rejectMessage = (id: string) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const messages: WizardMessage[] = stored ? JSON.parse(stored) : [];
  const updated = messages.map((m) =>
    m.id === id ? { ...m, status: 'rejected' as const } : m
  );
  saveMessages(updated);
};
