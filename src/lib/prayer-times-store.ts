
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export const CALCULATION_METHODS = [
  { id: 3, label: 'رابطة العالم الإسلامي' },
  { id: 4, label: 'جامعة أم القرى (مكة)' },
  { id: 5, label: 'الهيئة المصرية العامة للمساحة' },
  { id: 2, label: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)' },
  { id: 1, label: 'جامعة العلوم الإسلامية بكراتشي' },
  { id: 8, label: 'الخليج العربي' },
  { id: 10, label: 'قطر' },
  { id: 12, label: 'فرنسا (UOIF - 12 degrees)' },
];

interface PrayerState {
  timings: PrayerTimings | null;
  nextPrayer: { name: string; time: string; remaining: string } | null;
  method: number;
  asrSchool: number; // 0 for Shafi/Standard, 1 for Hanafi
  location: { city: string; country: string } | null;
  lastUpdated: string | null;
  isLoading: boolean;
  reminderMinutes: number;
  lastNotifiedPrayer: string | null;
  
  setMethod: (method: number) => void;
  setAsrSchool: (school: number) => void;
  fetchTimings: () => Promise<void>;
  calculateNextPrayer: () => void;
  setReminderMinutes: (minutes: number) => void;
}

export const usePrayerStore = create<PrayerState>()(
  persist(
    (set, get) => ({
      timings: null,
      nextPrayer: null,
      method: 5, // Default to Egyptian Survey Authority
      asrSchool: 0,
      location: null,
      lastUpdated: null,
      isLoading: false,
      reminderMinutes: 0,
      lastNotifiedPrayer: null,

      setMethod: (method) => {
        set({ method });
        get().fetchTimings();
      },

      setAsrSchool: (asrSchool) => {
        set({ asrSchool });
        get().fetchTimings();
      },

      fetchTimings: async () => {
        const { timings, method, asrSchool } = get();
        
        // Show loading only if we have no cached data
        if (!timings) {
          set({ isLoading: true });
        } else {
          // If we have data, mark as loading but keep the UI informative
          set({ isLoading: true });
        }

        try {
          // محاولة الحصول على الموقع الجغرافي
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { 
              timeout: 10000,
              enableHighAccuracy: false // Use faster positioning for background refresh
            });
          });

          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${asrSchool}`);
          const data = await res.json();

          if (data.code === 200) {
            set({ 
              timings: data.data.timings, 
              location: { city: data.data.meta.timezone, country: "" },
              lastUpdated: new Date().toISOString(),
              isLoading: false 
            });
            get().calculateNextPrayer();
          }
        } catch (err) {
          console.warn("Geolocation failed, falling back to Cairo:", err);
          // العودة للإعداد الافتراضي (القاهرة) إذا فشل تحديد الموقع
          const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=${method}&school=${asrSchool}`);
          const data = await res.json();
          if (data.code === 200) {
            set({ 
              timings: data.data.timings, 
              lastUpdated: new Date().toISOString(),
              isLoading: false 
            });
            get().calculateNextPrayer();
          }
        } finally {
          set({ isLoading: false });
        }
      },

      setReminderMinutes: (reminderMinutes) => set({ reminderMinutes }),

      calculateNextPrayer: () => {
        const { timings } = get();
        if (!timings) return;

        const now = new Date();
        const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
        const arabicNames: Record<string, string> = {
          Fajr: "الفجر", Dhuhr: "الظهر", Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء"
        };

        let next = null;

        for (const name of prayerNames) {
          const [hours, minutes] = timings[name as keyof PrayerTimings].split(':');
          const prayerTime = new Date();
          prayerTime.setHours(parseInt(hours), parseInt(minutes), 0);

          if (prayerTime > now) {
            const diff = prayerTime.getTime() - now.getTime();
            next = {
              name: arabicNames[name],
              time: timings[name as keyof PrayerTimings],
              remaining: formatMs(diff)
            };
            break;
          }
        }

        if (!next) {
          next = { name: "الفجر", time: timings.Fajr, remaining: "غداً" };
        }

        // Logic for pre-adhan reminder
        const { reminderMinutes, lastNotifiedPrayer } = get();
        if (reminderMinutes > 0 && next.name !== "الفجر") { // Skip "غداً" case for now
          const [h, m] = next.time.split(':');
          const pTime = new Date();
          pTime.setHours(parseInt(h), parseInt(m), 0);
          const diffMin = (pTime.getTime() - now.getTime()) / 60000;
          
          if (diffMin <= reminderMinutes && diffMin > 0 && lastNotifiedPrayer !== next.name) {
            // Trigger actual notification hook (will be caught by UI)
            set({ lastNotifiedPrayer: next.name });
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`اقترب وقت ${next.name}`, {
                body: `بقي ${Math.round(diffMin)} دقائق على رفع الأذان`,
                icon: '/icons/faith-icon.png'
              });
            }
          }
        }
        
        // Reset notification lock if prayer passed
        if (lastNotifiedPrayer && lastNotifiedPrayer !== next.name) {
           set({ lastNotifiedPrayer: null });
        }

        set({ nextPrayer: next });
      }
    }),
    {
      name: 'nexus-prayer-settings',
      partialize: (state) => ({ 
        method: state.method, 
        asrSchool: state.asrSchool,
        timings: state.timings,
        location: state.location,
        lastUpdated: state.lastUpdated,
        reminderMinutes: state.reminderMinutes
      }),
    }
  )
);

function formatMs(ms: number) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
