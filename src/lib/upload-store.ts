
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
      const formData = new FormData();
      formData.append('file', task.file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload/telegram', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, progress } : t)
          }));
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            console.error("Failed to parse Telegram response", xhr.responseText);
          }

          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, progress: 100, status: 'completed' } : t)
          }));

          if (task.type === 'video' && response?.messageId) {
            const { addVideo } = await import('./video-store');
            await addVideo({
              ...task.metadata,
              thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113", // Mock thumbnail since telegram doesn't provide one via API immediately without downloading
              source: 'telegram',
              externalUrl: response.messageId.toString()
            });
          }

          toast({ title: "مزامنة ناجحة", description: `تم حفظ "${task.fileName}" في سحابة تليجرام.` });
          setTimeout(() => get().removeTask(id), 3000);
        } else {
          console.error("[Telegram Upload Error]:", xhr.responseText);
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: "فشل الرفع لتيليجرام" } : t)
          }));
          toast({
            variant: "destructive",
            title: "فشل الإرسال العصبي",
            description: "حدث اضطراب في الاتصال بحاوية التخزين (تيليجرام)."
          });
        }
      };

      xhr.onerror = () => {
        console.error("[Telegram Upload Request Error]");
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: "Network Error" } : t)
        }));
        toast({
          variant: "destructive",
          title: "فشل الإرسال العصبي",
          description: "خطأ في الشبكة أثناء الاتصال."
        });
      };

      xhr.send(formData);

    } catch (err: any) {
      console.error("[Critical Storage Failure]:", err);
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: err.message } : t)
      }));
    }
  }
}));
