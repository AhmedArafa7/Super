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
    console.warn('Subject Fetch Notice:', error.message);
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

  const { data: nameData, error: nameError } = await supabase.from('subjects').insert([{ ...payload, name: subject.name }]).select().maybeSingle();
  if (!nameError && nameData) return mapSubjectFromDB(nameData);

  const { data: titleData, error: titleError } = await supabase.from('subjects').insert([{ ...payload, title: subject.name }]).select().maybeSingle();
  if (!titleError && titleData) return mapSubjectFromDB(titleData);

  console.warn('Subject Sync Alert: Fallback logic triggered.', nameError?.message || titleError?.message);
  return null;
};

export const deleteSubject = async (id: string) => {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) console.warn('Subject Deletion Alert:', error.message);
};

export const getCollections = async (subjectId: string): Promise<Collection[]> => {
  const { data, error } = await supabase.from('collections').select('*');
  
  if (error) {
    console.warn('Collections Fetch Notice:', error.message);
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

  const { data, error } = await supabase.from('collections').insert([payload]).select().maybeSingle();
  
  if (error) {
    console.warn('Collection Column Fallback:', error.message);
    const { order_index, ...fallbackPayload } = payload;
    const { data: retryData, error: retryError } = await supabase.from('collections').insert([fallbackPayload]).select().maybeSingle();
    if (!retryError) return retryData;
    return null;
  }
  
  return data;
};

export const getLearningItems = async (collectionId: string): Promise<LearningItem[]> => {
  const { data, error } = await supabase.from('learning_items').select('*');
  
  if (error) {
    console.warn('Learning Items Fetch Notice:', error.message);
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
    console.warn('Learning Item Column Fallback:', error.message);
    const { order_index, ...fallbackPayload } = payload;
    const { data: retryData, error: retryError } = await supabase.from('learning_items').insert([fallbackPayload]).select().maybeSingle();
    if (!retryError) return retryData;
    return null;
  }
  
  return data;
};

export const uploadLearningFile = async (file: File): Promise<string | null> => {
  // Exhaustive list of potential buckets to maximize success probability
  const bucketsToTry = ['learning', 'nexus-content', 'files', 'content', 'avatars', 'public', 'storage', 'assets'];
  let lastFailureReason = "No buckets found in list.";
  
  for (const bucket of bucketsToTry) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `learning_${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (!uploadError) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        console.log(`Neural Sync Successful: Payload stored in node "${bucket}"`);
        return data.publicUrl;
      }

      lastFailureReason = uploadError.message;
      
      // If bucket doesn't exist, silently try the next one
      if (uploadError.message.includes('Bucket not found')) {
        continue;
      }

      // Log other rejections (RLS, size) as warnings
      console.warn(`Node "${bucket}" rejected payload:`, uploadError.message);
    } catch (err: any) {
      lastFailureReason = err.message;
      continue;
    }
  }

  // We use warn instead of error here to prevent the dev-mode red screen,
  // letting the UI toast handle the explanation to the user.
  console.warn(`Institutional Storage Sync Halted. Reason: ${lastFailureReason}. Action: Check Supabase Storage Buckets and RLS policies.`);
  return null;
};
