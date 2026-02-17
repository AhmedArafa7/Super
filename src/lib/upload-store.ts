
'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
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
      status: 'preparing',
      type,
      metadata
    };

    set(state => ({ tasks: [newTask, ...state.tasks] }));
    
    setTimeout(() => get().retryTask(id), 100);
    return id;
  },

  removeTask: (id) => {
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  retryTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'uploading', progress: 10 } : t)
    }));

    try {
      const bucketName = 'nexus-vault';
      const filePath = `${task.type}/${Date.now()}-${task.file.name}`;

      // ملاحظة: الرفع في Supabase عبر JS SDK لا يدعم Progress natively بشكل رائع مثل Firebase
      // لذا سنقوم بمحاكاتها أو استخدام الـ Storage API بشكل مباشر لاحقاً
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, task.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, progress: 100, status: 'completed' } : t)
      }));

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (task.type === 'video') {
        const { addVideo } = await import('./video-store');
        await addVideo({
          ...task.metadata,
          thumbnail: publicUrl,
          source: 'local'
        });
      }

      toast({ title: "مزامنة ناجحة", description: `تم رفع "${task.fileName}" عبر العقدة الخارجية.` });
      setTimeout(() => get().removeTask(id), 3000);

    } catch (err: any) {
      console.error("[External Sync Error]:", err);
      const errorMessage = err.message || "فشل الاتصال بالعقدة الخارجية.";
      
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: errorMessage } : t)
      }));
      
      toast({ 
        variant: "destructive", 
        title: "فشل الرفع الخارجي", 
        description: "تأكد من إعدادات URL و Key في العقدة الخارجية."
      });
    }
  }
}));
