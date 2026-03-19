import { create } from 'zustand';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export interface SectionSettings {
  isBeta: boolean;
}

export interface VoiceSettings {
  preferredVoice: string;
  rate: number;
  pitch: number;
  isEmergencyOnly: boolean;
}

export interface GeneralSettings {
  language: 'ar' | 'en';
  theme: 'dark' | 'light' | 'neural';
}

export interface AppSettings {
  sections: Record<string, SectionSettings>;
  voice: VoiceSettings;
  general: GeneralSettings;
}

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  initSettingsListener: () => () => void;
  updateSectionBeta: (sectionId: string, isBeta: boolean) => Promise<void>;
  updateVoiceSettings: (voice: Partial<VoiceSettings>) => Promise<void>;
  updateGeneralSettings: (general: Partial<GeneralSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { 
    sections: {}, 
    voice: { preferredVoice: '', rate: 1, pitch: 1, isEmergencyOnly: false },
    general: { language: 'ar', theme: 'dark' }
  },
  isLoading: true,

  initSettingsListener: () => {
    const { firestore } = initializeFirebase();
    const settingsRef = doc(firestore, 'app_settings', 'sections');

    set({ isLoading: true });

    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({ 
          settings: { 
            sections: data.sections || {},
            voice: data.voice || { preferredVoice: '', rate: 1, pitch: 1, isEmergencyOnly: false },
            general: data.general || { language: 'ar', theme: 'dark' }
          }, 
          isLoading: false 
        });
      } else {
        // Initialize default empty document if not exists
        const defaults = {
           sections: {},
           voice: { preferredVoice: '', rate: 1, pitch: 1, isEmergencyOnly: false },
           general: { language: 'ar', theme: 'dark' }
        };
        setDoc(settingsRef, defaults);
        set({ settings: defaults, isLoading: false });
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
        sections: { [sectionId]: { isBeta } }
      }, { merge: true });
    } catch (error) {
      console.error("Error updating section beta:", error);
      // Revert in case of failure
      set({ settings: { ...get().settings, sections: currentSections } });
      throw error;
    }
  },

  updateVoiceSettings: async (voice) => {
    const { firestore } = initializeFirebase();
    const settingsRef = doc(firestore, 'app_settings', 'sections');
    const current = get().settings;
    const newVoice = { ...current.voice, ...voice };

    set({ settings: { ...current, voice: newVoice } });

    try {
      await setDoc(settingsRef, { voice: newVoice }, { merge: true });
    } catch (err) {
      console.error("Update Voice Error", err);
      set({ settings: current });
    }
  },

  updateGeneralSettings: async (general) => {
    const { firestore } = initializeFirebase();
    const settingsRef = doc(firestore, 'app_settings', 'sections');
    const current = get().settings;
    const newGeneral = { ...current.general, ...general };

    set({ settings: { ...current, general: newGeneral } });

    try {
      await setDoc(settingsRef, { general: newGeneral }, { merge: true });
    } catch (err) {
      console.error("Update General Error", err);
      set({ settings: current });
    }
  }
}));
