import { create } from 'zustand';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export interface SectionSettings {
  isBeta: boolean;
}

export interface AppSettings {
  sections: Record<string, SectionSettings>;
}

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  initSettingsListener: () => () => void;
  updateSectionBeta: (sectionId: string, isBeta: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { sections: {} },
  isLoading: true,

  initSettingsListener: () => {
    const { firestore } = initializeFirebase();
    const settingsRef = doc(firestore, 'app_settings', 'sections');

    set({ isLoading: true });

    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        set({ settings: { sections: docSnap.data() as Record<string, SectionSettings> }, isLoading: false });
      } else {
        // Initialize default empty document if not exists
        setDoc(settingsRef, {});
        set({ settings: { sections: {} }, isLoading: false });
      }
    }, (error) => {
      console.error("Error listening to settings:", error);
      set({ isLoading: false });
    });

    return unsubscribe;
  },

  updateSectionBeta: async (sectionId: string, isBeta: boolean) => {
    const { firestore } = initializeFirebase();
    const settingsRef = doc(firestore, 'app_settings', 'sections');
    
    // Optimistic UI update
    const currentSections = get().settings.sections;
    set({
      settings: {
        sections: {
          ...currentSections,
          [sectionId]: { isBeta }
        }
      }
    });

    try {
      await setDoc(settingsRef, {
        [sectionId]: { isBeta }
      }, { merge: true });
    } catch (error) {
      console.error("Error updating section beta:", error);
      // Revert in case of failure
      set({ settings: { sections: currentSections } });
      throw error;
    }
  }
}));
