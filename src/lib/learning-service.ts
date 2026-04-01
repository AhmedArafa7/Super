import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
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
