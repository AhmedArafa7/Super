'use client';

/**
 * [STABILITY_ANCHOR: AUTH_TYPES_V1.0]
 */

export type UserRole =
  | 'founder'
  | 'cofounder'
  | 'admin'
  | 'management'
  | 'investor'
  | 'task_executor'
  | 'free'
  | 'external_user';

export type UserClassification = 'none' | 'freelancer' | 'investor' | 'manager';
export type OnlineStatus = 'online' | 'offline' | 'away';
export type ConsentStatus = 'none' | 'agreed' | 'declined';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  classification?: UserClassification;
  proResponsesRemaining?: number;
  proTTSRemaining?: number;
  avatar_url?: string;
  customTag?: string;
  canManageCredits?: boolean;
  status?: OnlineStatus;
  lastSeen?: string;
  dataConsent: ConsentStatus;
  ownedThemes?: string[];
  activeTheme?: string;
  themeMode?: 'light' | 'dark';
  linkedYouTubeChannel?: {
    id: string;
    title: string;
    avatarUrl: string;
    customUrl?: string;
    linkedAt: string;
  };
}
