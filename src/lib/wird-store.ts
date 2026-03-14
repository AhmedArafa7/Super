'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WirdType = 'read' | 'write' | 'listen';
export type WirdAmountType = 'surah' | 'verses' | 'juz';

interface WirdState {
  // User Preferences
  enabledTypes: WirdType[];
  amountType: WirdAmountType;
  verseRange: { start: number; end: number };
  juzNumber: number;
  
  // Current Progress State
  currentSurahId: number;
  lastCompletedDate: string | null;
  todayCompletedTypes: WirdType[];

  // Actions
  setWirdConfig: (types: WirdType[]) => void;
  setWirdAmount: (type: WirdAmountType, range?: { start: number; end: number }, juz?: number) => void;
  setCurrentSurah: (id: number) => void;
  markStepComplete: (type: WirdType) => void;
  resetTodayProgress: () => void;
}

export const useWirdStore = create<WirdState>()(
  persist(
    (set, get) => ({
      enabledTypes: ['read', 'listen', 'write'], // Default sequence
      amountType: 'surah',
      verseRange: { start: 1, end: 10 },
      juzNumber: 1,
      currentSurahId: 1, // Default starts at Al-Fatihah
      lastCompletedDate: null,
      todayCompletedTypes: [],

      setWirdConfig: (types) => set({ enabledTypes: types }),
      
      setWirdAmount: (amountType, verseRange, juzNumber) => set((state) => ({ 
        amountType, 
        verseRange: verseRange || state.verseRange,
        juzNumber: juzNumber || state.juzNumber
      })),

      setCurrentSurah: (id) => set({ currentSurahId: id, todayCompletedTypes: [] }), // Reset daily part if surah changes

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
