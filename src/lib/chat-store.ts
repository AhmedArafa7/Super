'use client';

export type MessageStatus = 'queued' | 'sent' | 'processing' | 'replied' | 'rejected';

export interface WizardMessage {
  id: string;
  text: string;
  response: string | null;
  status: MessageStatus;
  timestamp: string;
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
  // Dispatch custom event for same-window updates
  window.dispatchEvent(new Event('storage-update'));
};

export const addWizardMessage = (text: string): WizardMessage => {
  const messages = getStoredMessages();
  const newMessage: WizardMessage = {
    id: Math.random().toString(36).substring(2, 15),
    text,
    response: null,
    status: 'queued', // Starts in the local queue
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

export const rejectMessage = (id: string) => {
  const messages = getStoredMessages();
  const updated = messages.map((m) =>
    m.id === id ? { ...m, status: 'rejected' as const } : m
  );
  saveMessages(updated);
};
