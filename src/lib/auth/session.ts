'use client';

import { User } from './types';

/**
 * [STABILITY_ANCHOR: SESSION_MANAGER_V1.0]
 */

const SESSION_KEY = 'nexus_session';

export const getSession = (): User | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const setSession = (user: User | null) => {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('auth-update'));
};
