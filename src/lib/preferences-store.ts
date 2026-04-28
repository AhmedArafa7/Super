import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  hiddenVideos: string[];
  hiddenChannels: string[];
  hideVideo: (id: string) => void;
  hideChannel: (id: string) => void;
  unhideVideo: (id: string) => void;
  unhideChannel: (id: string) => void;
  clearHiddenContent: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      hiddenVideos: [],
      hiddenChannels: [],
      
      hideVideo: (id: string) => set((state) => ({
        hiddenVideos: state.hiddenVideos.includes(id) ? state.hiddenVideos : [...state.hiddenVideos, id]
      })),
      
      hideChannel: (id: string) => set((state) => ({
        hiddenChannels: state.hiddenChannels.includes(id) ? state.hiddenChannels : [...state.hiddenChannels, id]
      })),

      unhideVideo: (id: string) => set((state) => ({
        hiddenVideos: state.hiddenVideos.filter(vId => vId !== id)
      })),

      unhideChannel: (id: string) => set((state) => ({
        hiddenChannels: state.hiddenChannels.filter(cId => cId !== id)
      })),

      clearHiddenContent: () => set({ hiddenVideos: [], hiddenChannels: [] }),
    }),
    {
      name: 'nexus_preferences_storage',
    }
  )
);
