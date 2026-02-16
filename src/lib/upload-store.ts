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
      status: 'uploading',
      type,
      metadata
    };

    set(state => ({ tasks: [newTask, ...state.tasks] }));
    get().retryTask(id);
    return id;
  },

  removeTask: (id) => {
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  retryTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    const { storage } = initializeFirebase();
    const storageRef = ref(storage, `${task.type}/${id}-${task.file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, task.file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, progress, status: 'uploading' } : t)
        }));
      }, 
      (error) => {
        console.error("Firebase Storage Error:", error);
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: error.message } : t)
        }));
        toast({ variant: "destructive", title: "Transmission Failed", description: error.message });
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
        } else if (task.type === 'learning_asset') {
          // Additional logic for learning assets can be added here
        }

        toast({ title: "Neural Sync Complete", description: `"${task.fileName}" is now live on the network.` });
        setTimeout(() => get().removeTask(id), 5000);
      }
    );
  }
}));
