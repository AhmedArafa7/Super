
'use client';

import { addNotification } from './notification-store';

export type MessageStatus = 'queued' | 'sent' | 'processing' | 'replied' | 'rejected';

export interface WizardMessage {
  id: string;
  text: string;
  response: string | null;
  status: MessageStatus;
  timestamp: string;
  isEdited?: boolean;
  editReason?: string;
  editedAt?: string;
}

const STORAGE_KEY = 'nexus_wizard_messages';

export const getStoredMessages = (): WizardMessage[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveMessages = (messages: WizardMessage[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  window.dispatchEvent(new Event('storage-update'));
};

export const addWizardMessage = (text: string): WizardMessage => {
  const messages = getStoredMessages();
  const newMessage: WizardMessage = {
    id: Math.random().toString(36).substring(2, 15),
    text,
    response: null,
    status: 'queued',
    timestamp: new Date().toISOString(),
  };
  saveMessages([...messages, newMessage]);
  return newMessage;
};

export const updateMessageStatus = (id: string, status: MessageStatus) => {
  const messages = getStoredMessages();
  const updated = messages.map((m) =>
    m.id === id ? { ...m, status } : m
  );
  saveMessages(updated);
};

export const approveMessage = (id: string, response: string) => {
  const messages = getStoredMessages();
  const updated = messages.map((m) =>
    m.id === id ? { ...m, response, status: 'replied' as const } : m
  );
  saveMessages(updated);
};

export const editMessage = (id: string, newResponse: string, reason: string) => {
  const messages = getStoredMessages();
  const updated = messages.map((m) =>
    m.id === id ? { 
      ...m, 
      response: newResponse, 
      isEdited: true, 
      editReason: reason, 
      editedAt: new Date().toISOString()
    } : m
  );
  saveMessages(updated);

  // Trigger centralized notification
  addNotification({
    type: 'chat_correction',
    title: 'Transmission Corrected',
    message: `A message in your neural queue was adjusted: "${reason}"`,
    metadata: { messageId: id, reason }
  });
};

export const rejectMessage = (id: string) => {
  const messages = getStoredMessages();
  const updated = messages.map((m) =>
    m.id === id ? { ...m, status: 'rejected' as const } : m
  );
  saveMessages(updated);
};
