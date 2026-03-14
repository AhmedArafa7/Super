'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WirdType = 'read' | 'write' | 'listen';

interface WirdState {
  // User Preferences
  enabledTypes: WirdType[];
  
  // Current Progress State
  currentSurahId: number;
  lastCompletedDate: string | null;
  todayCompletedTypes: WirdType[];

  // Actions
  setWirdConfig: (types: WirdType[]) => void;
  setCurrentSurah: (id: number) => void;
  markStepComplete: (type: WirdType) => void;
  resetTodayProgress: () => void;
}

export const useWirdStore = create<WirdState>()(
  persist(
    (set, get) => ({
      enabledTypes: ['read', 'listen', 'write'], // Default sequence
      currentSurahId: 1, // Default starts at Al-Fatihah
      lastCompletedDate: null,
      todayCompletedTypes: [],

      setWirdConfig: (types) => set({ enabledTypes: types }),
      
      setCurrentSurah: (id) => set({ currentSurahId: id }),

      markStepComplete: (type) => {
        const { todayCompletedTypes, enabledTypes, currentSurahId } = get();
        
        // Prevent duplicate completions
        if (todayCompletedTypes.includes(type)) return;

        const updatedCompleted = [...todayCompletedTypes, type];
        
        // Check if all enabled steps are done for today
        const isFullyComplete = enabledTypes.every(t => updatedCompleted.includes(t));

        if (isFullyComplete) {
          const todayString = new Date().toISOString().split('T')[0];
          set({
            todayCompletedTypes: [],
            lastCompletedDate: todayString,
            currentSurahId: currentSurahId < 114 ? currentSurahId + 1 : 1 // Move to next surah
          });
        } else {
          set({ todayCompletedTypes: updatedCompleted });
        }
      },

      resetTodayProgress: () => {
        const todayString = new Date().toISOString().split('T')[0];
        const { lastCompletedDate } = get();
        
        // If it's a new day, clear the temporary daily progress
        if (lastCompletedDate !== todayString) {
          set({ todayCompletedTypes: [] });
        }
      }
    }),
    {
      name: 'nexus-wird-store-v1',
    }
  )
);
