
'use client';

export type NotificationType = 'chat_correction' | 'system_broadcast' | 'content_new' | 'market_restock' | 'learning_reminder';
export type Priority = 'info' | 'warning' | 'critical';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority?: Priority;
  metadata?: {
    messageId?: string;
    courseId?: string;
    videoId?: string;
    productId?: string;
    reason?: string;
  };
}

const STORAGE_KEY = 'nexus_notifications';

export const getNotifications = (): AppNotification[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [
    {
      id: 'mock-1',
      type: 'system_broadcast',
      title: 'Neural Sync Upgrade',
      message: 'Nexus protocol version 4.2 has been deployed. Expect lower latency.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      priority: 'info'
    },
    {
      id: 'mock-2',
      type: 'market_restock',
      title: 'Quantum Headsets Back!',
      message: 'The Quantum Pro Series is now available in the TechMarket.',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isRead: false
    }
  ];
};

export const saveNotifications = (notifications: AppNotification[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event('notifications-update'));
};

export const addNotification = (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
  const notifications = getNotifications();
  const newNotification: AppNotification = {
    ...notification,
    id: Math.random().toString(36).substring(2, 15),
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  saveNotifications([newNotification, ...notifications]);
};

export const markNotificationAsRead = (id: string) => {
  const notifications = getNotifications();
  const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
  saveNotifications(updated);
};

export const markNotificationByMessageIdAsRead = (messageId: string) => {
  const notifications = getNotifications();
  const updated = notifications.map(n => 
    (n.type === 'chat_correction' && n.metadata?.messageId === messageId) 
    ? { ...n, isRead: true } 
    : n
  );
  saveNotifications(updated);
};

export const clearAllUnreadNotifications = () => {
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, isRead: true }));
  saveNotifications(updated);
};
