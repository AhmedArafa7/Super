'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavItemId = "chat" | "peer-chat" | "stream" | "market" | "features" | "admin" | "notifications" | "learning" | "wallet" | "dashboard" | "offers" | "hisn" | "launcher" | "lab" | "directory" | "agent-ai" | "ads" | "vault" | "downloads" | "time";

interface SidebarState {
  pinnedItems: NavItemId[];
  togglePin: (id: NavItemId) => void;
  isPinned: (id: NavItemId) => boolean;
}

/**
 * @fileOverview محرك تخصيص القائمة الجانبية - تم إضافة قسم الوقت للقائمة الافتراضية.
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      pinnedItems: ["dashboard", "time", "chat", "vault", "agent-ai", "peer-chat", "stream", "market", "launcher", "lab", "ads", "downloads", "wallet"],

      togglePin: (id) => {
        const { pinnedItems } = get();
        if (pinnedItems.includes(id)) {
          if (id === 'dashboard') return;
          set({ pinnedItems: pinnedItems.filter(item => item !== id) });
        } else {
          set({ pinnedItems: [...pinnedItems, id] });
        }
      },

      isPinned: (id) => get().pinnedItems.includes(id)
    }),
    {
      name: 'nexus-sidebar-prefs',
    }
  )
);
