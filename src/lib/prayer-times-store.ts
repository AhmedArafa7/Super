
'use client';

import { create } from 'zustand';

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface PrayerState {
  timings: PrayerTimings | null;
  nextPrayer: { name: string; time: string; remaining: string } | null;
  location: { city: string; country: string } | null;
  isLoading: boolean;
  
  fetchTimings: () => Promise<void>;
  calculateNextPrayer: () => void;
}

export const usePrayerStore = create<PrayerState>((set, get) => ({
  timings: null,
  nextPrayer: null,
  location: null,
  isLoading: false,

  fetchTimings: async () => {
    set({ isLoading: true });
    try {
      // الحصول على الموقع الجغرافي
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=4`);
      const data = await res.json();

      if (data.code === 200) {
        set({ 
          timings: data.data.timings, 
          location: { city: data.data.meta.timezone, country: "" },
          isLoading: false 
        });
        get().calculateNextPrayer();
      }
    } catch (err) {
      // fallback to default if geo fails
      const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=4`);
      const data = await res.json();
      if (data.code === 200) {
        set({ timings: data.data.timings, isLoading: false });
        get().calculateNextPrayer();
      }
    }
  },

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

    // إذا انتهت صلوات اليوم، الصلاة القادمة هي فجر الغد
    if (!next) {
      next = { name: "الفجر", time: timings.Fajr, remaining: "غداً" };
    }

    set({ nextPrayer: next });
  }
}));

function formatMs(ms: number) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
