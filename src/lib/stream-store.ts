
'use client';

import { create } from 'zustand';
import { Video } from './video-store';

interface StreamState {
  activeVideo: Video | null;
  isPlaying: boolean;
  isMinimized: boolean;
  quality: string;
  currentTab: string;
  // إعدادات المستخدم
  backgroundPlayback: boolean;
  autoFloat: boolean;

  setActiveVideo: (video: Video | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMinimized: (minimized: boolean) => void;
  setQuality: (quality: string) => void;
  setCurrentTab: (tab: string) => void;
  setBackgroundPlayback: (enabled: boolean) => void;
  setAutoFloat: (enabled: boolean) => void;
}

/**
 * @fileOverview المحرك العالمي المطور للفيديو - يدعم الخصوصية وتفضيلات التشغيل.
 */
export const useStreamStore = create<StreamState>((set, get) => ({
  activeVideo: null,
  isPlaying: false,
  isMinimized: false,
  currentTab: 'dashboard',
  quality: typeof window !== 'undefined' ? localStorage.getItem("nexus_stream_quality") || "240" : "240",

  // تحميل الإعدادات من الذاكرة المحلية
  backgroundPlayback: typeof window !== 'undefined' ? localStorage.getItem("nexus_bg_playback") !== 'false' : true,
  autoFloat: typeof window !== 'undefined' ? localStorage.getItem("nexus_auto_float") === 'true' : false,

  setActiveVideo: (video) => {
    // [TEMPORARY LEGAL BYPASS]: Prevent internal YouTube playback. Redirect to external tab without proxy.
    if (video && video.source === 'youtube' && video.externalUrl) {
      if (typeof window !== 'undefined') {
        let directUrl = video.externalUrl;
        const proxyMatch = directUrl.match(/url=([^&]+)/);
        if (proxyMatch && proxyMatch[1]) {
           try {
              directUrl = decodeURIComponent(proxyMatch[1]);
           } catch (e) {
              console.error('Failed to decode proxy URL', e);
           }
        }
        window.open(directUrl, '_blank');
      }
      return; 
    }

    set({
      activeVideo: video,
      isPlaying: !!video,
      isMinimized: false
    });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setIsMinimized: (minimized) => set({ isMinimized: minimized }),

  setQuality: (q) => {
    if (typeof window !== 'undefined') localStorage.setItem("nexus_stream_quality", q);
    set({ quality: q });
  },

  setCurrentTab: (tab) => {
    const state = get();
    // إذا غادر المستخدم صفحة الستريم وكان التشغيل في الخلفية معطلاً
    if (state.currentTab === 'stream' && tab !== 'stream' && !state.backgroundPlayback) {
      set({ isPlaying: false });
    }
    set({ currentTab: tab });
  },

  setBackgroundPlayback: (enabled) => {
    if (typeof window !== 'undefined') localStorage.setItem("nexus_bg_playback", String(enabled));
    set({ backgroundPlayback: enabled });
  },

  setAutoFloat: (enabled) => {
    if (typeof window !== 'undefined') localStorage.setItem("nexus_auto_float", String(enabled));
    set({ autoFloat: enabled });
  }
}));
