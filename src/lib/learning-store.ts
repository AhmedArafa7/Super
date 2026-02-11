
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
  allowedUserIds: s.allowedUserIds || s.allowed_user_ids || null,
  createdAt: s.createdAt || s.created_at || new Date().toISOString()
});

export const getSubjects = async (userId?: string): Promise<Subject[]> => {
  // Fetch without ordering to prevent "column does not exist" errors if schema differs
  const { data, error } = await supabase.from('subjects').select('*');
  
  if (error) {
    console.error('Error fetching subjects:', error.message);
    return [];
  }
  
  let subjects = (data || []).map(mapSubjectFromDB);
  
  // Filter in JS for security/RBAC
  const filtered = subjects.filter(s => {
    if (!s.allowedUserIds || s.allowedUserIds.length === 0) return true;
    return userId && s.allowedUserIds.includes(userId);
  });

  // Sort in JS
  return filtered.sort((a, b) => a.name.localeCompare(b.name));
};

export const addSubject = async (subject: Omit<Subject, 'id' | 'createdAt'>) => {
  // Support both common naming conventions
  const payload = {
    ...subject,
    title: subject.name, // fallback
    allowed_user_ids: subject.allowedUserIds, // fallback
  };

  const { data, error } = await supabase.from('subjects').insert([payload]).select().single();
  if (error) console.error('Error adding subject:', error.message);
  return data ? mapSubjectFromDB(data) : null;
};

export const deleteSubject = async (id: string) => {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) console.error('Error deleting subject:', error.message);
};

export const getCollections = async (subjectId: string): Promise<Collection[]> => {
  // Use a query that's resilient to subjectId vs subject_id
  const { data, error } = await supabase.from('collections').select('*');
  
  if (error) {
    console.error('Error fetching collections:', error.message);
    return [];
  }

  return (data || [])
    .filter(c => (c.subjectId === subjectId || c.subject_id === subjectId))
    .map(c => ({
      id: c.id,
      subjectId: c.subjectId || c.subject_id,
      title: c.title || 'Untitled Lesson',
      description: c.description || '',
      orderIndex: c.orderIndex || c.order_index || 0,
      createdAt: c.createdAt || c.created_at
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);
};

export const addCollection = async (collection: Omit<Collection, 'id' | 'createdAt'>) => {
  const payload = {
    ...collection,
    subject_id: collection.subjectId, // fallback
    order_index: collection.orderIndex, // fallback
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
      collectionId: i.collectionId || i.collection_id,
      title: i.title || 'Untitled Asset',
      type: i.type,
      url: i.url,
      quizData: i.quizData || i.quiz_data,
      orderIndex: i.orderIndex || i.order_index || 0,
      createdAt: i.createdAt || i.created_at
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);
};

export const addLearningItem = async (item: Omit<LearningItem, 'id' | 'createdAt'>) => {
  const payload = {
    ...item,
    collection_id: item.collectionId, // fallback
    quiz_data: item.quizData, // fallback
    order_index: item.orderIndex, // fallback
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
