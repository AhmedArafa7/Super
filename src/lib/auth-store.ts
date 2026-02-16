
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
  custom_tag?: string;
}

const SESSION_KEY = 'nexus_session';

export const mapUserFromDB = (u: any): User => {
  if (!u) return null as any;
  return {
    id: u.id,
    username: u.username,
    password: u.password,
    name: u.full_name || u.username || 'Unknown Node',
    role: u.role || 'user',
    avatar_url: u.avatar_url || '',
    custom_tag: u.custom_tag || ''
  };
};

export const getSession = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
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

export const getStoredUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapUserFromDB);
};

export const addUser = async (user: Omit<User, 'id'>) => {
  const payload = {
    username: user.username,
    password: user.password,
    full_name: user.name,
    role: user.role,
    avatar_url: user.avatar_url,
    custom_tag: user.custom_tag
  };

  const { data, error } = await supabase.from('users').insert([payload]).select().single();
  if (error) throw error;
  
  // Create a wallet for the new user automatically
  await supabase.from('wallets').insert([{ 
    user_id: data.id, 
    balance: 0, 
    frozen_balance: 0, 
    currency: 'Credits' 
  }]);

  window.dispatchEvent(new Event('auth-update'));
  return mapUserFromDB(data);
};

export const deleteUser = async (id: string) => {
  // First delete associated wallet and transactions due to FK constraints
  await supabase.from('transactions').delete().eq('wallet_id', id);
  await supabase.from('wallets').delete().eq('user_id', id);
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
  window.dispatchEvent(new Event('auth-update'));
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  const dbUpdates: any = {};
  if (updates.name) dbUpdates.full_name = updates.name;
  if (updates.role) dbUpdates.role = updates.role;
  if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
  if (updates.custom_tag !== undefined) dbUpdates.custom_tag = updates.custom_tag;

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
};
