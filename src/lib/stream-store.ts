
'use client';

import { create } from 'zustand';
import { Video } from './video-store';

interface StreamState {
  activeVideo: Video | null;
  isPlaying: boolean;
  isMinimized: boolean;
  quality: string;
  setActiveVideo: (video: Video | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  setQuality: (quality: string) => void;
}

/**
 * @fileOverview المحرك العالمي للبث - يضمن بقاء الفيديو يعمل حتى عند التنقل بين الأقسام.
 */
export const useStreamStore = create<StreamState>((set) => ({
  activeVideo: null,
  isPlaying: false,
  isMinimized: false,
  quality: typeof window !== 'undefined' ? localStorage.getItem("nexus_stream_quality") || "240" : "240",
  
  setActiveVideo: (video) => set({ 
    activeVideo: video, 
    isPlaying: !!video, 
    isMinimized: false 
  }),
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  setIsMinimized: (minimized) => set({ isMinimized: minimized }),
  
  setQuality: (q) => {
    if (typeof window !== 'undefined') localStorage.setItem("nexus_stream_quality", q);
    set({ quality: q });
  },
}));
