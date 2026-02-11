
'use client';

import { supabase } from './supabaseClient';
import { addNotification } from './notification-store';

export type LearningItemType = 'video' | 'audio' | 'file' | 'quiz_json';

export interface LearningItem {
  id: string;
  collectionId: string;
  title: string;
  type: LearningItemType;
  url?: string;
  quizData?: any;
  orderIndex: number;
  createdAt: string;
}

export interface Collection {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  orderIndex: number;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  allowedUserIds: string[] | null; // null means public
  createdAt: string;
}

export const getSubjects = async (userId?: string): Promise<Subject[]> => {
  const { data, error } = await supabase.from('subjects').select('*').order('name');
  if (error) {
    console.error('Error fetching subjects:', error.message);
    return [];
  }
  
  if (!userId) return data.filter(s => !s.allowedUserIds || s.allowedUserIds.length === 0);
  
  return data.filter(s => {
    if (!s.allowedUserIds || s.allowedUserIds.length === 0) return true;
    return s.allowedUserIds.includes(userId);
  });
};

export const addSubject = async (subject: Omit<Subject, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase.from('subjects').insert([subject]).select().single();
  if (error) console.error('Error adding subject:', error.message);
  return data;
};

export const deleteSubject = async (id: string) => {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) console.error('Error deleting subject:', error.message);
};

export const getCollections = async (subjectId: string): Promise<Collection[]> => {
  const { data, error } = await supabase.from('collections').select('*').eq('subjectId', subjectId).order('orderIndex');
  if (error) {
    console.error('Error fetching collections:', error.message);
    return [];
  }
  return data;
};

export const addCollection = async (collection: Omit<Collection, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase.from('collections').insert([collection]).select().single();
  if (error) console.error('Error adding collection:', error.message);
  return data;
};

export const getLearningItems = async (collectionId: string): Promise<LearningItem[]> => {
  const { data, error } = await supabase.from('learning_items').select('*').eq('collectionId', collectionId).order('orderIndex');
  if (error) {
    console.error('Error fetching items:', error.message);
    return [];
  }
  return data;
};

export const addLearningItem = async (item: Omit<LearningItem, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase.from('learning_items').insert([item]).select().single();
  if (error) console.error('Error adding learning item:', error.message);
  return data;
};

export const uploadLearningFile = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `learning-content/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('nexus-content')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError.message);
    return null;
  }

  const { data } = supabase.storage.from('nexus-content').getPublicUrl(filePath);
  return data.publicUrl;
};
