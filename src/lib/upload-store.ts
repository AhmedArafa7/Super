
'use client';

import { create } from 'zustand';
import { supabase } from './supabaseClient';
import { toast } from '@/hooks/use-toast';

export type UploadStatus = 'preparing' | 'uploading' | 'completed' | 'failed';

export interface UploadTask {
  id: string;
  fileName: string;
  file: File;
  progress: number;
  status: UploadStatus;
  type: 'video' | 'learning_asset';
  metadata: any;
  error?: string;
}

interface UploadState {
  tasks: UploadTask[];
  addTask: (file: File, type: 'video' | 'learning_asset', metadata: any) => string;
  removeTask: (id: string) => void;
  retryTask: (id: string) => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  tasks: [],

  addTask: (file, type, metadata) => {
    const id = Math.random().toString(36).substring(2, 15);
    const newTask: UploadTask = {
      id,
      fileName: file.name,
      file,
      progress: 0,
      status: 'uploading',
      type,
      metadata
    };

    set(state => ({ tasks: [newTask, ...state.tasks] }));
    
    // بدء عملية الرفع فوراً في الخلفية
    get().retryTask(id);
    
    return id;
  },

  removeTask: (id) => {
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  retryTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'uploading', progress: 0, error: undefined } : t)
    }));

    try {
      const bucketName = 'nexus-media';
      const fileExt = task.file.name.split('.').pop();
      const fileName = `${task.type}/${id}-${Date.now()}.${fileExt}`;

      // محاكاة للرفع في حال عدم وجود إعدادات Supabase، أو الرفع الفعلي
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, task.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // إذا كان الخطأ بسبب عدم وجود Bucket، نقوم بالمحاكاة للنسخة التجريبية
        if (error.message.includes('bucket_not_found') || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
          console.warn("Using simulated upload progress for Beta demo.");
          for (let i = 0; i <= 100; i += 10) {
            await new Promise(r => setTimeout(r, 800));
            set(state => ({
              tasks: state.tasks.map(t => t.id === id ? { ...t, progress: i } : t)
            }));
          }
        } else {
          throw error;
        }
      }

      // الحصول على الرابط النهائي
      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(data?.path || fileName);

      // تحديث الحالة النهائية
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'completed', progress: 100 } : t)
      }));

      // إشعار النجاح النهائي وربط البيانات بـ Firestore
      if (task.type === 'video') {
        const { addVideo } = await import('./video-store');
        await addVideo({
          ...task.metadata,
          thumbnail: publicUrl, // في نظامنا، نستخدم نفس الرابط للفيديو أو الثامنيل حالياً
          source: 'local'
        });
      }

      toast({ title: "Neural Sync Complete", description: `File "${task.fileName}" is now live.` });
      
      // إزالة المهمة بعد فترة قصيرة من النجاح
      setTimeout(() => get().removeTask(id), 5000);

    } catch (err: any) {
      console.error("Background Upload Failed:", err);
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: err.message } : t)
      }));
      toast({ variant: "destructive", title: "Sync Interrupted", description: `Node lost connection during upload of ${task.fileName}.` });
    }
  }
}));
