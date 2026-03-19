
'use client';

/**
 * [STABILITY_ANCHOR: WETUBE_PRO_CACHE_MANAGER_V1.0]
 * نظام التخزين الذكي (Smart Cache) لـ WeTube Pro.
 * يستخدم IndexedDB لتخزين أجزاء الفيديو (Chunks) بحد أقصى 1 جيجابايت.
 */

const DB_NAME = 'wetube-pro-cache';
const STORE_NAME = 'chunks';
const MAX_CACHE_SIZE_BYTES = 1024 * 1024 * 1024; // 1GB

export const initCacheDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e: any) => reject(e.target.error);
  });
};

export const saveChunk = async (videoId: string, quality: string, chunkIndex: number, data: ArrayBuffer) => {
  const db = await initCacheDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  const id = `${videoId}_${quality}_${chunkIndex}`;
  await store.put({ id, videoId, quality, chunkIndex, data, timestamp: Date.now(), size: data.byteLength });
  
  // التحقق من الحجم الكلي وحذف الأجزاء القديمة إذا لزم الأمر
  checkAndCleanCache();
};

export const getChunk = async (videoId: string, quality: string, chunkIndex: number): Promise<ArrayBuffer | null> => {
  const db = await initCacheDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  
  const id = `${videoId}_${quality}_${chunkIndex}`;
  const request = store.get(id);
  
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => resolve(null);
  });
};

export const checkAndCleanCache = async () => {
  const db = await initCacheDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  const request = store.getAll();
  
  request.onsuccess = () => {
    const items = request.result;
    let totalSize = items.reduce((acc, item) => acc + (item.size || 0), 0);
    
    if (totalSize > MAX_CACHE_SIZE_BYTES) {
      // ترتيب الأجزاء من الأقدم للأحدث وحذف الأقدم
      items.sort((a, b) => a.timestamp - b.timestamp);
      
      let i = 0;
      while (totalSize > MAX_CACHE_SIZE_BYTES * 0.8 && i < items.length) {
        store.delete(items[i].id);
        totalSize -= items[i].size || 0;
        i++;
      }
      console.log(`Smart Cache Cleaned: Removed ${i} old chunks.`);
    }
  };
};
