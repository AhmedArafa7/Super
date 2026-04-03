import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { initializeFirebase } from '@/firebase';
import type { SubjectId, SubjectData, SectionType, SectionItem } from '@/components/features/learning-hub/learning-hub-store';

const SHARED_DOC_PATH = 'learning_hub/shared';

/**
 * [STABILITY_ANCHOR: LEARNING_SERVICE_V1.0]
 * جسر البيانات الذكي — Firebase Firestore & Cloud Sync
 */
export const learningService = {
  /**
   * جلب البيانات السحابية الحالية
   */
  async getCloudHub(): Promise<Record<SubjectId, SubjectData> | null> {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, SHARED_DOC_PATH);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      return snap.data() as Record<SubjectId, SubjectData>;
    }
    return null;
  },

  /**
   * الاشتراك في التغييرات السحابية للمزامنة اللحظية
   */
  subscribeToHub(onUpdate: (data: Record<SubjectId, SubjectData>) => void) {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, SHARED_DOC_PATH);
    
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as Record<SubjectId, SubjectData>);
      }
    });
  },

  /**
   * إضافة أو تحديث عنصر سحابي
   */
  async syncItem(subjectId: SubjectId, section: SectionType, item: SectionItem) {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, SHARED_DOC_PATH);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) {
      // إنشاء الدوكيومنت إذا لم يكن موجوداً
      const initialData: any = {};
      await setDoc(docRef, initialData);
    }
    
    const currentData = (snap.data() || {}) as Record<SubjectId, SubjectData>;
    const subject = currentData[subjectId] || { materials: [], recordings: [], assignments: [], quizzes: [], quizForms: [], questionBanks: [] };
    const arr = [...(subject[section] as any[])];
    
    const index = arr.findIndex(i => i.id === item.id);
    if (index >= 0) {
      arr[index] = { ...item, source: 'cloud' };
    } else {
      arr.push({ ...item, source: 'cloud' });
    }
    
    await updateDoc(docRef, {
      [`${subjectId}.${section}`]: arr
    });
    console.log(`[Cloud Sync] ${item.title} successfully synced to Firestore.`);
  },

  /**
   * محرك الرفع الذكي: يحاول الرفع لتليجرام أولاً (مجاني) ثم ينتقل لـ Firebase كاحتياطي.
   */
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
    console.log(`[Neural Storage] Initiating smart upload for: ${file.name}`);
    
    // محرك الخطوة 1: محاولة الرفع لتليجرام (Telegram Cloud)
    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      const telegramUrl = await new Promise<string>((resolve, reject) => {
        xhr.open('POST', '/api/upload/telegram', true);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress((e.loaded / e.total) * 100);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.success && res.fileId) {
                // تحويل معرف الملف لرابط بروكسي يعمل داخل التطبيق
                resolve(`/api/stream/telegram?fileId=${res.fileId}`);
              } else {
                reject(new Error("Telegram response missing fileId"));
              }
            } catch (e) {
              reject(new Error("Failed to parse Telegram response"));
            }
          } else {
            reject(new Error(`Telegram error: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network connection to Telegram API failed"));
        xhr.send(formData);
      });

      console.log(`[Neural Storage] Successfully vaulted to Telegram.`);
      return telegramUrl;

    } catch (telegramError) {
      console.warn(`[Neural Storage] Telegram upload failed, falling back to Firebase...`, telegramError);
      
      // إعادة تصفير الـ Progress للمحاولة الثانية
      if (onProgress) onProgress(0);

      // محرك الخطوة 2: المحاولة الاحتياطية عبر Firebase Storage
      try {
        const { storage } = initializeFirebase();
        const storageRef = ref(storage, `${SHARED_DOC_PATH}/assets/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              if (onProgress) onProgress(progress);
            }, 
            (error) => {
              console.error(`[Neural Storage] All storage providers failed.`);
              reject(error);
            }, 
            () => {
              getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                console.log(`[Neural Storage] Successfully saved to Firebase (Fallback).`);
                resolve(downloadURL);
              });
            }
          );
        });
      } catch (firebaseError) {
        throw new Error("فشلت جميع محاولات الرفع (Telegram & Firebase). تأكد من اتصالك بالإنترنت.");
      }
    }
  },

  /**
   * حذف عنصر من السحابة
   */
  async deleteItem(subjectId: SubjectId, section: SectionType, itemId: string) {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, SHARED_DOC_PATH);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const data = snap.data() as Record<SubjectId, SubjectData>;
      const arr = (data[subjectId]?.[section] as any[] || []).filter(i => i.id !== itemId);
      
      await updateDoc(docRef, {
        [`${subjectId}.${section}`]: arr
      });
    }
  }
};
