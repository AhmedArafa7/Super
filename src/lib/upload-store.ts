
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

const uploadSingleFile = (file: File, onProgress: (prog: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/telegram', true);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress((e.loaded / e.total) * 100);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let response;
        try { response = JSON.parse(xhr.responseText); } catch (e) { }
        resolve(response?.fileId);
      } else {
        let err = "فشل الرفع لتيليجرام";
        try { err = JSON.parse(xhr.responseText).error || err; } catch (e) { }
        reject(new Error(err));
      }
    };
    xhr.onerror = () => reject(new Error("Network Error"));
    xhr.send(formData);
  });
};

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

    const CHUNK_SIZE = 40 * 1024 * 1024; // 40 MB chunks (Safe limit for 50MB Bot API)
    const isChunked = task.file.size > CHUNK_SIZE;

    try {
      if (!isChunked) {
        const fileId = await uploadSingleFile(task.file, (prog) => {
          set(state => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, progress: prog } : t) }));
        });

        if (!fileId) throw new Error("Invalid response from server");

        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, progress: 100, status: 'completed' } : t)
        }));

        if (task.type === 'video') {
          const { addVideo } = await import('./video-store');
          await addVideo({
            ...task.metadata,
            channelAvatar: task.metadata.channelAvatar || "",
            thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113",
            source: 'telegram',
            externalUrl: fileId
          });
        }
        toast({ title: "مزامنة ناجحة", description: `تم حفظ "${task.fileName}" في سحابة تليجرام.` });
        setTimeout(() => get().removeTask(id), 3000);

      } else {
        // Chunked upload
        const totalChunks = Math.ceil(task.file.size / CHUNK_SIZE);
        let chunksMeta: { id: string, size: number }[] = [];

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, task.file.size);
          const blob = task.file.slice(start, end);
          const chunkFile = new File([blob], `part_${i}.bin`);

          const fileId = await uploadSingleFile(chunkFile, (chunkProg) => {
            const overallProgress = ((i / totalChunks) * 100) + (chunkProg / totalChunks);
            set(state => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, progress: overallProgress } : t) }));
          });

          if (!fileId) throw new Error(`فشل رفع الجزء رقم ${i + 1}`);
          chunksMeta.push({ id: fileId, size: blob.size });
        }

        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, progress: 100, status: 'completed' } : t)
        }));

        if (task.type === 'video') {
          const { addVideo } = await import('./video-store');
          await addVideo({
            ...task.metadata,
            channelAvatar: task.metadata.channelAvatar || "",
            thumbnail: "", // Empty string to ensure no save thumbnail is assigned
            source: 'telegram',
            externalUrl: JSON.stringify(chunksMeta) // Store as JSON string for the backend stream reader
          });
        }
        toast({ title: "مزامنة ناجحة", description: `تم حفظ وتقسيم الملف (${totalChunks} أجزاء) بنجاح.` });
        setTimeout(() => get().removeTask(id), 3000);
      }

    } catch (err: any) {
      console.error("[Telegram Upload Error]:", err);
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'failed', error: err.message || "فشل الرفع" } : t)
      }));
      toast({
        variant: "destructive",
        title: "فشل الإرسال العصبي",
        description: err.message || "حدث اضطراب أثناء الاتصال بسحابة تيليجرام."
      });
    }
  }
}));
