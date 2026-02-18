
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
      tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'uploading', progress: 5 } : t)
    }));

    try {
      const { storage } = initializeFirebase();
      const filePath = `${task.type}/${Date.now()}-${task.file.name}`;
      const storageRef = ref(storage, filePath);
      
      const uploadTask = uploadBytesResumable(storageRef, task.file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, progress } : t)
          }));
        }, 
        (error) => {
          console.error("[Neural Link Drop]:", error);
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: error.message } : t)
          }));
          toast({ 
            variant: "destructive", 
            title: "فشل الإرسال العصبي", 
            description: "حدث اضطراب في الاتصال بحاوية التخزين."
          });
        }, 
        async () => {
          const publicUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, progress: 100, status: 'completed' } : t)
          }));

          if (task.type === 'video') {
            const { addVideo } = await import('./video-store');
            await addVideo({
              ...task.metadata,
              thumbnail: publicUrl,
              source: 'local'
            });
          }

          toast({ title: "مزامنة ناجحة", description: `تم رفع "${task.fileName}" إلى النخاع.` });
          setTimeout(() => get().removeTask(id), 3000);
        }
      );

    } catch (err: any) {
      console.error("[Critical Storage Failure]:", err);
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: err.message } : t)
      }));
    }
  }
}));
