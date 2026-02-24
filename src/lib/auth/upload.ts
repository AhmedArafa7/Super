'use client';

import { initializeFirebase } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getSession } from './session';

/**
 * [STABILITY_ANCHOR: AUTH_UPLOAD_V1.5]
 */

const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; 
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('فشل ضغط الصورة عصبياً.'));
          },
          'image/jpeg',
          0.7 
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

export const uploadAvatar = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
  const { storage } = initializeFirebase();
  const session = getSession();
  if (!session) throw new Error("No active session");

  onProgress?.(5);
  const compressedBlob = await compressImage(file);
  
  const filePath = `avatars/${session.id}/${Date.now()}-${file.name.split('.')[0]}.jpg`;
  const storageRef = ref(storage, filePath);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, compressedBlob, {
      contentType: 'image/jpeg'
    });

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(10 + (progress * 0.9));
      }, 
      (error) => reject(error), 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};
