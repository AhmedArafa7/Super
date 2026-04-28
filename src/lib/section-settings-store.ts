import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SectionAction = 'open' | 'settings' | 'design' | 'feature' | 'preload';

export interface StreamSettings {
  backgroundPlay: boolean;
  autoSync: boolean;
  defaultQuality: string;
  storageLimitGB: number;
}

interface SectionSettingsState {
  defaultActions: Record<string, SectionAction>;
  streamSettings: StreamSettings;
  
  setDefaultAction: (sectionId: string, action: SectionAction) => void;
  updateStreamSettings: (settings: Partial<StreamSettings>) => void;
}

export const useSectionSettingsStore = create<SectionSettingsState>()(
  persist(
    (set) => ({
      defaultActions: {},
      streamSettings: {
        backgroundPlay: false,
        autoSync: false,
        defaultQuality: 'Auto (720p)',
        storageLimitGB: 5,
      },
      
      setDefaultAction: (sectionId, action) => set((state) => ({
        defaultActions: { ...state.defaultActions, [sectionId]: action }
      })),

      updateStreamSettings: (settings) => set((state) => ({
        streamSettings: { ...state.streamSettings, ...settings }
      })),
    }),
    {
      name: 'nexus_section_settings_storage',
    }
  )
);
