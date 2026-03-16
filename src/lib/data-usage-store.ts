
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * [STABILITY_ANCHOR: DATA_USAGE_STORE_V1.0]
 * مخزن تتبع استهلاك البيانات الموحد.
 * يقوم بتسجيل حجم البيانات الفعلي (API) والتقديري (Video).
 */

interface DataUsage {
  sessionBytes: number;
  dailyBytes: number;
  totalBytes: number;
  videoEstimatedBytes: number;
  lastResetDate: string; // YYYY-MM-DD
}

interface DataUsageState extends DataUsage {
  recordUsage: (bytes: number, type: 'api' | 'video') => void;
  resetSession: () => void;
  checkAndResetDaily: () => void;
}

export const useDataUsageStore = create<DataUsageState>()(
  persist(
    (set, get) => ({
      sessionBytes: 0,
      dailyBytes: 0,
      totalBytes: 0,
      videoEstimatedBytes: 0,
      lastResetDate: new Date().toISOString().split('T')[0],

      recordUsage: (bytes, type) => {
        get().checkAndResetDaily();
        
        set((state) => ({
          sessionBytes: state.sessionBytes + bytes,
          dailyBytes: state.dailyBytes + bytes,
          totalBytes: state.totalBytes + bytes,
          videoEstimatedBytes: type === 'video' ? state.videoEstimatedBytes + bytes : state.videoEstimatedBytes
        }));
      },

      resetSession: () => set({ sessionBytes: 0 }),

      checkAndResetDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        if (get().lastResetDate !== today) {
          set({
            dailyBytes: 0,
            lastResetDate: today
          });
        }
      }
    }),
    {
      name: 'nexus-data-usage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dailyBytes: state.dailyBytes,
        totalBytes: state.totalBytes,
        videoEstimatedBytes: state.videoEstimatedBytes,
        lastResetDate: state.lastResetDate
      })
    }
  )
);
