'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

export type PomodoroMode = 'focus' | 'short' | 'long';

interface TimeState {
  tasks: Task[];
  pomodoroMode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  
  addTask: (title: string, priority: Task['priority']) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  setPomodoroMode: (mode: PomodoroMode) => void;
  tick: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
}

const MODES = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60
};

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      tasks: [],
      pomodoroMode: 'focus',
      timeLeft: MODES.focus,
      isRunning: false,

      addTask: (title, priority) => set((state) => ({
        tasks: [
          { id: Math.random().toString(36).substring(7), title, priority, completed: false, createdAt: Date.now() },
          ...state.tasks
        ]
      })),

      toggleTask: (id) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      })),

      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),

      setPomodoroMode: (mode) => set({ 
        pomodoroMode: mode, 
        timeLeft: MODES[mode], 
        isRunning: false 
      }),

      tick: () => set((state) => {
        if (state.timeLeft <= 0) return { isRunning: false, timeLeft: 0 };
        return { timeLeft: state.timeLeft - 1 };
      }),

      toggleTimer: () => set((state) => ({ isRunning: !state.isRunning })),

      resetTimer: () => {
        const mode = get().pomodoroMode;
        set({ timeLeft: MODES[mode], isRunning: false });
      }
    }),
    { name: 'nexus-time-registry' }
  )
);
