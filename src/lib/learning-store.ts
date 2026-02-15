
'use client';

import { supabase } from './supabaseClient';

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
  createdAt: string;
}

export interface Subject {
  id: string;
  title: string;
  description: string;
  icon?: string;
  allowedUserIds: string[] | null;
  createdAt: string;
}

const mapSubjectFromDB = (s: any): Subject => ({
  id: s.id,
  title: s.title || 'Untitled Subject',
  description: s.description || '',
  icon: s.icon || '',
  allowedUserIds: s.allowed_user_ids || null,
  createdAt: s.created_at || new Date().toISOString()
});

export const getSubjects = async (userId?: string): Promise<Subject[]> => {
  const { data, error } = await supabase.from('subjects').select('*');
  if (error) return [];
  
  let subjects = (data || []).map(mapSubjectFromDB);
  return subjects.filter(s => {
    if (!s.allowedUserIds || s.allowedUserIds.length === 0) return true;
    return userId && s.allowedUserIds.includes(userId);
  }).sort((a, b) => a.title.localeCompare(b.title));
};

export const addSubject = async (subject: Omit<Subject, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase.from('subjects').insert([{
    title: subject.title,
    description: subject.description,
    icon: subject.icon,
    allowed_user_ids: subject.allowedUserIds
  }]).select().single();
  
  if (error) throw error;
  return mapSubjectFromDB(data);
};

export const deleteSubject = async (id: string) => {
  await supabase.from('subjects').delete().eq('id', id);
};

export const getCollections = async (subjectId: string): Promise<Collection[]> => {
  const { data, error } = await supabase.from('collections')
    .select('*')
    .eq('subject_id', subjectId);
  
  if (error) return [];
  return (data || []).map(c => ({
    id: c.id,
    subjectId: c.subject_id,
    title: c.title,
    description: c.description || '',
    createdAt: c.created_at
  }));
};

export const addCollection = async (collection: Omit<Collection, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase.from('collections').insert([{
    subject_id: collection.subjectId,
    title: collection.title,
    description: collection.description
  }]).select().single();
  
  if (error) throw error;
  return data;
};

export const getLearningItems = async (collectionId: string): Promise<LearningItem[]> => {
  const { data, error } = await supabase.from('learning_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('order_index', { ascending: true });
  
  if (error) return [];
  return (data || []).map(i => ({
    id: i.id,
    collectionId: i.collection_id,
    title: i.title,
    type: i.type,
    url: i.url,
    quizData: i.quiz_data,
    orderIndex: i.order_index || 0,
    createdAt: i.created_at
  }));
};

export const addLearningItem = async (item: Omit<LearningItem, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase.from('learning_items').insert([{
    collection_id: item.collectionId,
    title: item.title,
    type: item.type,
    url: item.url,
    quiz_data: item.quizData,
    order_index: item.orderIndex
  }]).select().single();
  
  if (error) throw error;
  return data;
};

export const uploadLearningFile = async (file: File): Promise<string | null> => {
  const bucketsToTry = ['learning', 'nexus-content', 'avatars', 'public'];
  for (const bucket of bucketsToTry) {
    try {
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return urlData.publicUrl;
      }
    } catch (err) {}
  }
  return null;
};
