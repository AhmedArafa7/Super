
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
  const stored = localStorage.getItem(STORAGE_KEY);
  const users = stored ? JSON.parse(stored) : [DEFAULT_ADMIN];
  return users;
};

export const saveUsers = (users: User[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
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
  if (id === 'admin-id') return; // Protect master admin
  const users = getStoredUsers();
  saveUsers(users.filter(u => u.id !== id));
};

export const getSession = (): User | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const setSession = (user: User | null) => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
  window.dispatchEvent(new Event('auth-update'));
};
