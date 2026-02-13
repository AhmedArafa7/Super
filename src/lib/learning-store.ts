
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

// Helper to map Subject from DB with fallbacks
const mapSubjectFromDB = (s: any): Subject => ({
  id: s.id,
  name: s.name || s.title || 'Untitled Subject',
  description: s.description || '',
  allowedUserIds: s.allowed_user_ids || s.allowedUserIds || null,
  createdAt: s.created_at || s.createdAt || new Date().toISOString()
});

export const getSubjects = async (userId?: string): Promise<Subject[]> => {
  const { data, error } = await supabase.from('subjects').select('*');
  
  if (error) {
    console.error('Error fetching subjects:', error.message);
    return [];
  }
  
  let subjects = (data || []).map(mapSubjectFromDB);
  
  const filtered = subjects.filter(s => {
    if (!s.allowedUserIds || s.allowedUserIds.length === 0) return true;
    return userId && s.allowedUserIds.includes(userId);
  });

  return filtered.sort((a, b) => a.name.localeCompare(b.name));
};

export const addSubject = async (subject: Omit<Subject, 'id' | 'createdAt'>) => {
  // We use snake_case for the database payload to match standard Supabase conventions
  // We avoid spreading the 'subject' object to prevent sending 'allowedUserIds' which caused errors
  const payload = {
    name: subject.name,
    description: subject.description,
    allowed_user_ids: subject.allowedUserIds,
  };

  const { data, error } = await supabase.from('subjects').insert([payload]).select().single();
  
  if (error) {
    console.error('Error adding subject:', error.message);
    // Fallback attempt with 'title' instead of 'name' if that was the issue
    const fallbackPayload = {
      title: subject.name,
      description: subject.description,
      allowed_user_ids: subject.allowedUserIds
    };
    const { data: retryData, error: retryError } = await supabase.from('subjects').insert([fallbackPayload]).select().single();
    if (retryError) return null;
    return mapSubjectFromDB(retryData);
  }
  
  return data ? mapSubjectFromDB(data) : null;
};

export const deleteSubject = async (id: string) => {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) console.error('Error deleting subject:', error.message);
};

export const getCollections = async (subjectId: string): Promise<Collection[]> => {
  const { data, error } = await supabase.from('collections').select('*');
  
  if (error) {
    console.error('Error fetching collections:', error.message);
    return [];
  }

  return (data || [])
    .filter(c => (c.subjectId === subjectId || c.subject_id === subjectId))
    .map(c => ({
      id: c.id,
      subjectId: c.subject_id || c.subjectId,
      title: c.title || 'Untitled Lesson',
      description: c.description || '',
      orderIndex: c.order_index || c.orderIndex || 0,
      createdAt: c.created_at || c.createdAt
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);
};

export const addCollection = async (collection: Omit<Collection, 'id' | 'createdAt'>) => {
  const payload = {
    subject_id: collection.subjectId,
    title: collection.title,
    description: collection.description,
    order_index: collection.orderIndex,
  };
  const { data, error } = await supabase.from('collections').insert([payload]).select().single();
  if (error) console.error('Error adding collection:', error.message);
  return data;
};

export const getLearningItems = async (collectionId: string): Promise<LearningItem[]> => {
  const { data, error } = await supabase.from('learning_items').select('*');
  
  if (error) {
    console.error('Error fetching items:', error.message);
    return [];
  }

  return (data || [])
    .filter(i => (i.collectionId === collectionId || i.collection_id === collectionId))
    .map(i => ({
      id: i.id,
      collectionId: i.collection_id || i.collectionId,
      title: i.title || 'Untitled Asset',
      type: i.type,
      url: i.url,
      quizData: i.quiz_data || i.quizData,
      orderIndex: i.order_index || i.orderIndex || 0,
      createdAt: i.created_at || i.createdAt
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);
};

export const addLearningItem = async (item: Omit<LearningItem, 'id' | 'createdAt'>) => {
  const payload = {
    collection_id: item.collectionId,
    title: item.title,
    type: item.type,
    url: item.url,
    quiz_data: item.quizData,
    order_index: item.orderIndex,
  };
  const { data, error } = await supabase.from('learning_items').insert([payload]).select().single();
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
