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

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
}

export interface LinkedAccount {
  platform: 'youtube' | 'tiktok' | 'facebook' | 'instagram' | 'whatsapp';
  platformUserId: string;
  username: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  linkedAt: string;
  scopes: string[];
}

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
  customThemeDef?: {
    slug: string;
    layoutEngine: 'Si-Neuro' | 'dulms';
    customColors?: {
      primary?: string;
      background?: string;
    };
  };
  linkedYouTubeChannel?: {
    id: string;
    title: string;
    avatarUrl: string;
    customUrl?: string;
    linkedAt: string;
  };
  linkedAccounts?: LinkedAccount[];
  githubToken?: string;
  linkedRepo?: GitHubRepo | null;
  repoTree?: any[] | null;
}
