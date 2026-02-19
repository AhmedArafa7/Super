
'use client';

import { create } from 'zustand';

export interface AgentFile {
  path: string;
  content: string;
  language: string;
}

export interface AgentLog {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'neural';
  timestamp: string;
}

interface AgentAIState {
  files: AgentFile[];
  activeFilePath: string | null;
  logs: AgentLog[];
  isProcessing: boolean;
  
  setFiles: (files: AgentFile[]) => void;
  updateFile: (path: string, content: string) => void;
  setActiveFile: (path: string | null) => void;
  addLog: (text: string, type?: AgentLog['type']) => void;
  clearWorkspace: () => void;
  setIsProcessing: (val: boolean) => void;
}

export const useAgentStore = create<AgentAIState>((set) => ({
  files: [],
  activeFilePath: null,
  logs: [],
  isProcessing: false,

  setFiles: (files) => set({ files, activeFilePath: files[0]?.path || null }),
  
  updateFile: (path, content) => set((state) => ({
    files: state.files.map(f => f.path === path ? { ...f, content } : f)
  })),

  setActiveFile: (activeFilePath) => set({ activeFilePath }),

  addLog: (text, type = 'info') => set((state) => ({
    logs: [...state.logs, {
      id: Math.random().toString(36).substring(7),
      text,
      type,
      timestamp: new Date().toLocaleTimeString()
    }].slice(-50) // الاحتفاظ بآخر 50 سجل فقط
  })),

  clearWorkspace: () => set({ files: [], activeFilePath: null, logs: [] }),
  
  setIsProcessing: (isProcessing) => set({ isProcessing })
}));
