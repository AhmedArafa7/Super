
'use client';

export type NotificationType = 'chat_correction' | 'system_broadcast' | 'content_new' | 'market_restock' | 'learning_reminder';
export type Priority = 'info' | 'warning' | 'critical';

export interface AppNotification {
  id: string;
  userId?: string; // If undefined, it's a broadcast to all
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

export const getNotifications = (currentUserId?: string): AppNotification[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  const allNotifications: AppNotification[] = stored ? JSON.parse(stored) : [
    {
      id: 'mock-1',
      type: 'system_broadcast',
      title: 'Neural Sync Upgrade',
      message: 'Nexus protocol version 4.2 has been deployed. Expect lower latency.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      priority: 'info'
    }
  ];

  if (!currentUserId) return allNotifications;

  // Return notifications that are either broadcasts (no userId) or specifically for this user
  return allNotifications.filter(n => !n.userId || n.userId === currentUserId);
};

export const saveNotifications = (notifications: AppNotification[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event('notifications-update'));
};

export const addNotification = (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const notifications = stored ? JSON.parse(stored) : [];
  const newNotification: AppNotification = {
    ...notification,
    id: Math.random().toString(36).substring(2, 15),
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  saveNotifications([newNotification, ...notifications]);
};

export const markNotificationAsRead = (id: string) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const notifications: AppNotification[] = stored ? JSON.parse(stored) : [];
  const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
  saveNotifications(updated);
};

export const markNotificationByMessageIdAsRead = (messageId: string, userId: string) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const notifications: AppNotification[] = stored ? JSON.parse(stored) : [];
  const updated = notifications.map(n => 
    (n.type === 'chat_correction' && n.metadata?.messageId === messageId && n.userId === userId) 
    ? { ...n, isRead: true } 
    : n
  );
  saveNotifications(updated);
};

export const clearAllUnreadNotifications = (userId: string) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const notifications: AppNotification[] = stored ? JSON.parse(stored) : [];
  const updated = notifications.map(n => 
    (!n.userId || n.userId === userId) ? { ...n, isRead: true } : n
  );
  saveNotifications(updated);
};
