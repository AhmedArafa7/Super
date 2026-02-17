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
      tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'uploading', progress: 0 } : t)
    }));

    try {
      const { storage } = initializeFirebase();
      // استخدام مسار نظيف لضمان عدم وجود مشاكل في الأذونات
      const storageRef = ref(storage, `${task.type}/${Date.now()}-${task.file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, task.file);

      console.log(`[Nexus Sync] Starting upload for: ${task.fileName}`);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, progress: isNaN(progress) ? 0 : progress } : t)
          }));
        }, 
        (error: any) => {
          console.error("[Neural Link Error Details]:", error);
          const errorMessage = error.code === 'storage/unauthorized' 
            ? "Access Denied: Check Firebase Storage Rules."
            : error.message;
          
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: errorMessage } : t)
          }));
          
          toast({ 
            variant: "destructive", 
            title: "Upload Failed", 
            description: errorMessage
          });
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'completed', progress: 100 } : t)
          }));

          if (task.type === 'video') {
            const { addVideo } = await import('./video-store');
            await addVideo({
              ...task.metadata,
              thumbnail: downloadURL,
              source: 'local'
            });
          }

          toast({ title: "Sync Successful", description: `File "${task.fileName}" is now live.` });
          setTimeout(() => get().removeTask(id), 3000);
        }
      );
    } catch (err: any) {
      console.error("[Upload Exception]:", err);
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: err.message } : t)
      }));
    }
  }
}));
