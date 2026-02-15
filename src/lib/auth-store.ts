
'use client';

import { supabase } from './supabaseClient';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
}

const SESSION_KEY = 'nexus_session';

/**
 * Maps database user object to the frontend User interface.
 */
export const mapUserFromDB = (u: any): User => {
  if (!u) return null as any;
  return {
    id: u.id,
    username: u.username,
    password: u.password,
    name: u.full_name || u.username || 'Unknown Node',
    role: u.role || 'user'
  };
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

export const getStoredUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data || []).map(mapUserFromDB);
  } catch (err: any) {
    console.error('Error fetching users:', err.message);
    return [];
  }
};

export const addUser = async (user: Omit<User, 'id'>) => {
  try {
    const payload = {
      username: user.username,
      password: user.password,
      full_name: user.name,
      role: user.role
    };

    const { data, error } = await supabase.from('users').insert([payload]).select().single();
    if (error) throw error;
    window.dispatchEvent(new Event('auth-update'));
    return mapUserFromDB(data);
  } catch (err: any) {
    console.error('Error adding user:', err.message);
    throw err;
  }
};

export const deleteUser = async (id: string) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    window.dispatchEvent(new Event('auth-update'));
  } catch (err: any) {
    console.error('Error deleting user:', err.message);
    throw err;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  try {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.full_name = updates.name;
    if (updates.role) dbUpdates.role = updates.role;

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    const mappedUser = mapUserFromDB(data);
    const currentSession = getSession();
    if (currentSession && currentSession.id === userId) {
      setSession({ ...currentSession, ...mappedUser });
    }
    
    return mappedUser;
  } catch (err: any) {
    console.error('Profile update failed:', err.message);
    throw err;
  }
};
