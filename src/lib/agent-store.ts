
'use client';

import { create } from 'zustand';

export interface AgentFile {
  path: string;
  content: string;
  language: string;
}

export interface AgentConversation {
  id: string;
  title: string;
  linkedRepo?: GitHubRepo | null;
  updatedAt: string;
  createdAt: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
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
  preferredAI: 'gemini' | 'groq';
  autoFallback: boolean;
  
  // GitHub Integration State
  githubToken: string | null;
  linkedRepo: GitHubRepo | null;
  repoTree: any[] | null;

  // History State
  conversations: AgentConversation[];
  activeConversationId: string | null;

  // Proactive Context (Entry Files)
  coreFileContents: Record<string, string>;
  
  setFiles: (files: AgentFile[]) => void;
  updateFile: (path: string, content: string) => void;
  setActiveFile: (path: string | null) => void;
  addLog: (text: string, type?: AgentLog['type']) => void;
  clearWorkspace: () => void;
  setIsProcessing: (val: boolean) => void;
  setPreferredAI: (ai: 'gemini' | 'groq') => void;
  setAutoFallback: (val: boolean) => void;
  setGithubToken: (token: string | null) => void;
  setLinkedRepo: (repo: GitHubRepo | null) => void;
  setRepoTree: (tree: any[] | null) => void;
  
  // History Setters
  setConversations: (convs: AgentConversation[]) => void;
  setActiveConversationId: (id: string | null) => void;

  setCoreFileContents: (contents: Record<string, string>) => void;
  addCoreFileContent: (path: string, content: string) => void;
}

export const useAgentStore = create<AgentAIState>((set) => ({
  files: [],
  activeFilePath: null,
  logs: [],
  isProcessing: false,
  preferredAI: 'gemini',
  autoFallback: false,
  githubToken: null,
  linkedRepo: null,
  repoTree: null,
  conversations: [],
  activeConversationId: null,
  coreFileContents: {},

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
    }].slice(-50)
  })),

  clearWorkspace: () => set({ files: [], activeFilePath: null, logs: [] }),
  
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  
  setPreferredAI: (preferredAI) => set({ preferredAI }),
  
  setAutoFallback: (autoFallback) => set({ autoFallback }),

  setGithubToken: (githubToken) => set({ githubToken }),

  setLinkedRepo: (linkedRepo) => set({ linkedRepo, repoTree: null }),

  setRepoTree: (repoTree) => set({ repoTree }),

  setConversations: (conversations) => set({ conversations }),

  setActiveConversationId: (activeConversationId) => set({ activeConversationId }),

  setCoreFileContents: (coreFileContents) => set({ coreFileContents }),

  addCoreFileContent: (path, content) => set((state) => ({
    coreFileContents: { ...state.coreFileContents, [path]: content }
  }))
}));
