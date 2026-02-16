'use client';

import { create } from 'zustand';
import { initializeFirebase } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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
    
    // بدء الرفع فوراً
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
      tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'uploading', progress: 0 } : t)
    }));

    try {
      const { storage } = initializeFirebase();
      // إنشاء مرجع فريد للملف لتجنب التداخل
      const storageRef = ref(storage, `${task.type}/${Date.now()}-${task.file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, task.file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          console.log(`[Neural Sync] ${task.fileName}: ${progress}% (${snapshot.bytesTransferred}/${snapshot.totalBytes})`);
          
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, progress, status: 'uploading' } : t)
          }));
        }, 
        (error) => {
          console.error("[Neural Link Failure]:", error);
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: error.message } : t)
          }));
          toast({ 
            variant: "destructive", 
            title: "فشل المزامنة", 
            description: "تأكد من إعدادات Firebase Storage وصلاحيات الرفع للملفات الكبيرة." 
          });
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`[Neural Sync] Complete: ${downloadURL}`);
          
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'completed', progress: 100 } : t)
          }));

          if (task.type === 'video') {
            const { addVideo } = await import('./video-store');
            await addVideo({
              ...task.metadata,
              thumbnail: downloadURL, // نستخدم الرابط المرفوع كـ Source للفيديو
              source: 'local'
            });
          }

          toast({ title: "اكتملت المزامنة العصبية", description: `الملف "${task.fileName}" أصبح متاحاً الآن على الشبكة.` });
          
          // إزالة المهمة بعد نجاحها بـ 10 ثوانٍ
          setTimeout(() => get().removeTask(id), 10000);
        }
      );
    } catch (err: any) {
      console.error("[Upload Init Error]:", err);
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: err.message } : t)
      }));
    }
  }
}));