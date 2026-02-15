
'use client';

import { supabase } from './supabaseClient';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
}

const SESSION_KEY = 'nexus_session';

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

/**
 * Fetches all registered nodes from the Supabase database.
 */
export const getStoredUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Supabase query error (users):', error.message, error.details);
      throw error;
    }
    return data || [];
  } catch (err: any) {
    console.error('Error fetching users:', err.message || err);
    return [];
  }
};

/**
 * Registers a new neural node in the system.
 */
export const addUser = async (user: Omit<User, 'id'>) => {
  try {
    const { data, error } = await supabase.from('users').insert([user]).select().single();
    if (error) {
      console.error('Supabase registration error:', error.message, error.details, error.hint);
      throw error;
    }
    window.dispatchEvent(new Event('auth-update'));
    return data;
  } catch (err: any) {
    console.error('Error adding user:', err.message || err);
    throw err;
  }
};

/**
 * Permanently deactivates a neural node and its link.
 */
export const deleteUser = async (id: string) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error('Supabase deletion error:', error.message);
      throw error;
    }
    window.dispatchEvent(new Event('auth-update'));
  } catch (err: any) {
    console.error('Error deleting user:', err.message || err);
    throw err;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error.message);
      throw error;
    }
    
    // Update local session to reflect changes
    const currentSession = getSession();
    if (currentSession && currentSession.id === userId) {
      setSession({ ...currentSession, ...data });
    }
    
    return data;
  } catch (err: any) {
    console.error('Profile update failed:', err.message || err);
    throw err;
  }
};

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err: any) {
    console.error('Avatar upload failed:', err.message || err);
    return null;
  }
};
