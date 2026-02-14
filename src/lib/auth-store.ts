
'use client';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
}

const STORAGE_KEY = 'nexus_users';
const SESSION_KEY = 'nexus_session';

const DEFAULT_ADMIN: User = {
  id: 'admin-id',
  username: 'admin',
  password: '123',
  name: 'Master Admin',
  role: 'admin',
};

export const getStoredUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [DEFAULT_ADMIN];
  } catch (e) {
    console.error('Auth store corruption:', e);
    return [DEFAULT_ADMIN];
  }
};

export const saveUsers = (users: User[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users ?? []));
  } catch (e) {
    console.error('Failed to save user registry:', e);
  }
};

export const addUser = (user: Omit<User, 'id'>) => {
  const users = getStoredUsers();
  const newUser: User = {
    ...user,
    id: Math.random().toString(36).substring(2, 15),
  };
  saveUsers([...users, newUser]);
  return newUser;
};

export const deleteUser = (id: string) => {
  if (id === 'admin-id') return;
  const users = getStoredUsers();
  saveUsers(users.filter(u => u.id !== id));
};

export const getSession = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('Session retrieval failure:', e);
    return null;
  }
};

export const setSession = (user: User | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    window.dispatchEvent(new Event('auth-update'));
  } catch (e) {
    console.error('Session update failure:', e);
  }
};
