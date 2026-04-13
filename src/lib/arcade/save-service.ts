
"use client";

import { initializeFirebase } from "@/firebase";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  listAll, 
  getMetadata,
  FullMetadata
} from "firebase/storage";

/**
 * [STABILITY_ANCHOR: ARCADE_SAVE_SERVICE_V1.0]
 * Professional storage service for Nexus Arcade game saves.
 * Adheres to Nexus Engineering Standards (Strict Typing, Real Metrics).
 */

export interface GameSaveMetadata {
  id: string;
  name: string;
  size: number;
  updatedAt: string;
  downloadUrl: string;
}

/**
 * Uploads a game save file (.msav) to the user's dedicated cloud directory.
 */
export async function uploadGameSave(
  userId: string, 
  gameId: string, 
  file: File, 
  onProgress?: (pct: number) => void
): Promise<string> {
  const { storage } = initializeFirebase();
  
  // Validation: Only allow specific extensions for safety
  const allowedExtensions = ['.msav', '.zip', '.json'];
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error(`[SAVE_SERVICE_ERR] Unsupported file type: ${fileExtension}`);
  }

  const filePath = `arcade/saves/${userId}/${gameId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on(
      'state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      }, 
      (error) => {
        console.error("[SAVE_UPLOAD_ERR]", error);
        reject(new Error(`Failed to upload save: ${error.message}`));
      }, 
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadUrl);
      }
    );
  });
}

/**
 * Lists all saves for a specific user and game.
 */
export async function listGameSaves(userId: string, gameId: string): Promise<GameSaveMetadata[]> {
  const { storage } = initializeFirebase();
  const listRef = ref(storage, `arcade/saves/${userId}/${gameId}`);
  
  try {
    const res = await listAll(listRef);
    const savePromises = res.items.map(async (item) => {
      const [url, meta] = await Promise.all([
        getDownloadURL(item),
        getMetadata(item)
      ]);
      
      return {
        id: item.name,
        name: item.name.split('-').slice(1).join('-'), // Remove timestamp prefix for UI
        size: meta.size,
        updatedAt: meta.updatedAt,
        downloadUrl: url
      };
    });
    
    const saves = await Promise.all(savePromises);
    // Sort by most recent first
    return saves.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error("[SAVE_LIST_ERR]", error);
    return [];
  }
}
