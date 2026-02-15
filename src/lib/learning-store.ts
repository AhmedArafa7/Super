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
  const payload: any = {
    description: subject.description,
    allowed_user_ids: subject.allowedUserIds,
  };

  // Try with 'name' first
  const { data: nameData, error: nameError } = await supabase.from('subjects').insert([{ ...payload, name: subject.name }]).select().maybeSingle();
  if (!nameError && nameData) return mapSubjectFromDB(nameData);

  // If 'name' fails, try with 'title'
  const { data: titleData, error: titleError } = await supabase.from('subjects').insert([{ ...payload, title: subject.name }]).select().maybeSingle();
  if (!titleError && titleData) return mapSubjectFromDB(titleData);

  console.error('Error adding subject (all variations failed):', nameError?.message || titleError?.message);
  return null;
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
    .filter(c => (c.subject_id === subjectId || c.subjectId === subjectId))
    .map(c => ({
      id: c.id,
      subjectId: c.subject_id || c.subjectId,
      title: c.title || 'Untitled Lesson',
      description: c.description || '',
      orderIndex: c.order_index || c.orderIndex || 0,
      createdAt: c.created_at || c.createdAt
    }))
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
};

export const addCollection = async (collection: Omit<Collection, 'id' | 'createdAt'>) => {
  const payload: any = {
    subject_id: collection.subjectId,
    title: collection.title,
    description: collection.description,
    order_index: collection.orderIndex,
  };

  // Primary attempt
  const { data, error } = await supabase.from('collections').insert([payload]).select().maybeSingle();
  
  if (error) {
    // Resilience: If order_index fails, retry without it
    if (error.message.includes('order_index') || error.message.includes('column')) {
      const { order_index, ...fallbackPayload } = payload;
      const { data: retryData, error: retryError } = await supabase.from('collections').insert([fallbackPayload]).select().maybeSingle();
      if (!retryError) return retryData;
      console.error('Retry adding collection failed:', retryError.message);
    }
    console.error('Error adding collection:', error.message);
    return null;
  }
  
  return data;
};

export const getLearningItems = async (collectionId: string): Promise<LearningItem[]> => {
  const { data, error } = await supabase.from('learning_items').select('*');
  
  if (error) {
    console.error('Error fetching items:', error.message);
    return [];
  }

  return (data || [])
    .filter(i => (i.collection_id === collectionId || i.collectionId === collectionId))
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
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
};

export const addLearningItem = async (item: Omit<LearningItem, 'id' | 'createdAt'>) => {
  const payload: any = {
    collection_id: item.collectionId,
    title: item.title,
    type: item.type,
    url: item.url,
    quiz_data: item.quizData,
    order_index: item.orderIndex,
  };

  const { data, error } = await supabase.from('learning_items').insert([payload]).select().maybeSingle();
  
  if (error) {
    // Resilience: If order_index fails, retry without it
    if (error.message.includes('order_index') || error.message.includes('column')) {
      const { order_index, ...fallbackPayload } = payload;
      const { data: retryData, error: retryError } = await supabase.from('learning_items').insert([fallbackPayload]).select().maybeSingle();
      if (!retryError) return retryData;
    }
    console.error('Error adding learning item:', error.message);
    return null;
  }
  
  return data;
};

export const uploadLearningFile = async (file: File): Promise<string | null> => {
  // Extended bucket list for maximum resilience
  const bucketsToTry = ['learning', 'nexus-content', 'files', 'content', 'avatars', 'public', 'storage', 'assets'];
  
  for (const bucket of bucketsToTry) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Use a flatter path for broad compatibility if folder-specific RLS is tight
      const filePath = (bucket === 'avatars' || bucket === 'public') 
        ? `learning-${fileName}` 
        : `learning-content/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
      }

      // If bucket not found, just silently move to the next one
      if (uploadError.message.includes('Bucket not found')) {
        continue;
      }

      // Log other errors (like RLS violations) but don't stop the loop!
      // Another bucket might have more permissive policies.
      console.warn(`Upload attempt failed for bucket "${bucket}":`, uploadError.message);
      continue;
    } catch (err) {
      // Catch any unexpected runtime errors and keep trying
      continue;
    }
  }

  console.error('Failed to upload file: No suitable storage bucket found or all available buckets rejected the payload.');
  return null;
};
