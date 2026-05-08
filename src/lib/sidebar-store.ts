'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavItemId = "chat" | "peer-chat" | "stream" | "market" | "features" | "admin" | "notifications" | "learning" | "wallet" | "dashboard" | "offers" | "hisn" | "launcher" | "lab" | "directory" | "agent-ai" | "ads" | "vault" | "downloads" | "time" | "deals" | "health" | "qa" | "micro-ide" | "library" | "settings" | "study-ai" | "arcade";

interface SidebarState {
  pinnedItems: NavItemId[];
  isCollapsed: boolean;
  isVisible: boolean;
  width: number;
  
  togglePin: (id: NavItemId) => void;
  isPinned: (id: NavItemId) => boolean;
  setCollapsed: (val: boolean) => void;
  setVisible: (val: boolean) => void;
  setWidth: (val: number) => void;
  toggleCollapsed: () => void;
  toggleVisible: () => void;
}

/**
 * [STABILITY_ANCHOR: SIDEBAR_STORE_V3.1]
 * محرك تخصيص القائمة الجانبية - يدعم الحالات الجديدة والعرض القابل للتخصيص.
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      pinnedItems: ["dashboard", "qa", "time", "health", "chat", "vault", "agent-ai", "deals", "peer-chat", "stream", "market", "arcade", "launcher", "lab", "ads", "downloads", "wallet"],
      isCollapsed: false,
      isVisible: true,
      width: 280,

      togglePin: (id) => {
        const { pinnedItems } = get();
        if (pinnedItems.includes(id)) {
          set({ pinnedItems: pinnedItems.filter(item => item !== id) });
        } else {
          set({ pinnedItems: [...pinnedItems, id] });
        }
      },

      isPinned: (id) => get().pinnedItems.includes(id),

      setCollapsed: (isCollapsed) => set({ isCollapsed }),
      setVisible: (isVisible) => set({ isVisible }),
      setWidth: (width) => set({ width }),
      
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      toggleVisible: () => set((state) => ({ isVisible: !state.isVisible })),
    }),
    {
      name: 'nexus-sidebar-prefs',
    }
  )
);
