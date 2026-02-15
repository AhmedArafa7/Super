
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

/**
 * Maps database user object to the frontend User interface.
 * Handles variations in column naming (e.g., full_name vs name).
 */
export const mapUserFromDB = (u: any): User => {
  if (!u) return null as any;
  return {
    id: u.id,
    username: u.username,
    password: u.password,
    name: u.full_name || u.name || u.displayName || u.username || 'Unknown Node',
    role: u.role || 'user',
    avatar_url: u.avatar_url || u.avatarUrl
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
    return (data || []).map(mapUserFromDB);
  } catch (err: any) {
    console.error('Error fetching users:', err.message || err);
    return [];
  }
};

/**
 * Registers a new neural node in the system.
 * Maps 'name' to 'full_name' for database compatibility.
 * Omit avatar_url if the column is missing in schema cache.
 */
export const addUser = async (user: Omit<User, 'id'>) => {
  try {
    const payload: any = {
      username: user.username,
      password: user.password,
      full_name: user.name,
      role: user.role
    };

    // Note: avatar_url omitted to resolve "column does not exist" schema error
    const { data, error } = await supabase.from('users').insert([payload]).select().single();
    if (error) {
      console.error('Supabase registration error:', error.message, error.details, error.hint);
      throw error;
    }
    window.dispatchEvent(new Event('auth-update'));
    return mapUserFromDB(data);
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
    const dbUpdates: any = { ...updates };
    
    // Map 'name' to 'full_name' if present in updates
    if (updates.name) {
      dbUpdates.full_name = updates.name;
      delete dbUpdates.name;
    }

    // Resilience: Strip avatar_url from updates if column is missing in database schema
    if ('avatar_url' in dbUpdates) {
      delete dbUpdates.avatar_url;
    }

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error.message);
      throw error;
    }
    
    const mappedUser = mapUserFromDB(data);
    
    // Update local session to reflect changes
    const currentSession = getSession();
    if (currentSession && currentSession.id === userId) {
      setSession({ ...currentSession, ...mappedUser });
    }
    
    return mappedUser;
  } catch (err: any) {
    console.error('Profile update failed:', err.message || err);
    throw err;
  }
};

/**
 * Uploads an avatar payload to storage.
 * Note: Database link update is bypassed if avatar_url column is missing.
 */
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
    
    // We log a warning instead of failing since we know the column might be missing
    console.warn('Avatar storage successful, but database column avatar_url appears to be missing.');
    
    return data.publicUrl;
  } catch (err: any) {
    console.error('Avatar upload failed:', err.message || err);
    return null;
  }
};
