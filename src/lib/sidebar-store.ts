
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavItemId = "chat" | "stream" | "market" | "features" | "admin" | "notifications" | "learning" | "wallet" | "dashboard" | "offers" | "hisn" | "launcher";

interface SidebarState {
  pinnedItems: NavItemId[];
  togglePin: (id: NavItemId) => void;
  isPinned: (id: NavItemId) => boolean;
}

/**
 * @fileOverview محرك تخصيص القائمة الجانبية - يسمح للمستخدم باختيار الأقسام التي تظهر في قائمته الرئيسية.
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      // الأقسام الافتراضية المثبتة
      pinnedItems: ["dashboard", "chat", "stream", "market", "wallet"],

      togglePin: (id) => {
        const { pinnedItems } = get();
        if (pinnedItems.includes(id)) {
          // لا يمكن إلغاء تثبيت الداشبورد لضمان سهولة الوصول
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
