
'use client';

import { supabase } from './supabaseClient';

export type LearningItemType = 'video' | 'audio' | 'file' | 'quiz_json' | 'text';

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
  title: string;
  description: string;
  icon?: string;
  allowedUserIds: string[] | null;
  createdAt: string;
}

export const getSubjects = async (userId?: string): Promise<Subject[]> => {
  const { data, error } = await supabase.from('subjects').select('*');
  if (error) return [];
  
  return (data || []).map(s => ({
    id: s.id,
    title: s.title,
    description: s.description || '',
    icon: s.icon || '',
    allowedUserIds: s.allowed_user_ids || null,
    createdAt: s.created_at
  })).filter(s => {
    if (!s.allowedUserIds || s.allowedUserIds.length === 0) return true;
    return userId && s.allowedUserIds.includes(userId);
  });
};

export const addSubject = async (subject: Omit<Subject, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase.from('subjects').insert([{
    title: subject.title,
    description: subject.description,
    icon: subject.icon,
    allowed_user_ids: subject.allowedUserIds
  }]).select().single();
  if (error) throw error;
  return data;
};

export const deleteSubject = async (id: string) => {
  await supabase.from('subjects').delete().eq('id', id);
};

export const getCollections = async (subjectId: string): Promise<Collection[]> => {
  const { data, error } = await supabase.from('collections')
    .select('*')
    .eq('subject_id', subjectId)
    .order('order_index', { ascending: true });
  
  if (error) return [];
  return (data || []).map(c => ({
    id: c.id,
    subjectId: c.subject_id,
    title: c.title,
    description: c.description || '',
    orderIndex: c.order_index || 0,
    createdAt: c.created_at
  }));
};

export const addCollection = async (collection: Omit<Collection, 'id' | 'createdAt'>) => {
  const payload = {
    subject_id: collection.subjectId,
    title: collection.title,
    description: collection.description,
    order_index: collection.orderIndex
  };
  const { data, error } = await supabase.from('collections').insert([payload]).select().single();
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
    type: i.type as LearningItemType,
    url: i.url,
    quizData: i.quiz_data,
    orderIndex: i.order_index || 0,
    createdAt: i.created_at
  }));
};

export const addLearningItem = async (item: Omit<LearningItem, 'id' | 'createdAt'>) => {
  const payload = {
    collection_id: item.collectionId,
    title: item.title,
    type: item.type,
    url: item.url,
    quiz_data: item.quizData,
    order_index: item.orderIndex
  };
  const { data, error } = await supabase.from('learning_items').insert([payload]).select().single();
  if (error) throw error;
  return data;
};

export const uploadLearningFile = async (
  file: File, 
  onProgress?: (percentage: number) => void
): Promise<string | null> => {
  const fileName = `${crypto.randomUUID()}-${file.name}`;
  // تم ترتيب المستودعات للبدء بـ 'learning' كأولوية قصوى
  const buckets = ['learning', 'nexus-content', 'files', 'assets', 'avatars'];
  let lastFailureReason = '';

  for (const bucket of buckets) {
    try {
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { 
          cacheControl: '3600', 
          upsert: false,
          // تفعيل مراقبة التقدم الحقيقي
          onUploadProgress: (progress) => {
            if (onProgress) {
              const percentage = (progress.loaded / progress.total) * 100;
              onProgress(Math.round(percentage));
            }
          }
        });

      if (uploadError) {
        lastFailureReason = uploadError.message;
        continue;
      }

      if (data) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return urlData.publicUrl;
      }
    } catch (e: any) {
      lastFailureReason = e.message;
    }
  }

  console.warn(`Storage Notification: All buckets checked. Final status: ${lastFailureReason || 'Bucket not found'}`);
  return null;
};
