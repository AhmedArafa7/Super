
'use client';

import React, { useEffect } from "react";
import { Clock, MapPin, Loader2, Zap, BellRing } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePrayerStore, PrayerTimings } from "@/lib/prayer-times-store";
import { cn } from "@/lib/utils";

export function PrayerTimesView() {
  const { timings, nextPrayer, isLoading, fetchTimings, calculateNextPrayer } = usePrayerStore();

  useEffect(() => {
    fetchTimings();
    const interval = setInterval(() => {
      calculateNextPrayer();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !timings) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">جاري مزامنة المواقيت مع القمر الصناعي...</p>
      </div>
    );
  }

  const PRAYERS = [
    { id: 'Fajr', label: 'الفجر' },
    { id: 'Dhuhr', label: 'الظهر' },
    { id: 'Asr', label: 'العصر' },
    { id: 'Maghrib', label: 'المغرب' },
    { id: 'Isha', label: 'العشاء' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* العداد التنازلي الرئيسي */}
      <Card className="glass border-primary/20 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl bg-primary/5">
        <div className="absolute top-0 right-0 size-64 bg-primary/10 blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-4 py-1 uppercase font-bold text-[10px] tracking-widest">
            Next Pulse: {nextPrayer?.name}
          </Badge>
          <h2 className="text-7xl font-black text-white tracking-tighter mb-2 font-mono">
            {nextPrayer?.remaining}
          </h2>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Clock className="size-4" /> متبقي على رفع الأذان
          </p>
        </div>
      </Card>

      {/* قائمة المواقيت */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pb-20">
        {PRAYERS.map((p) => {
          const isNext = nextPrayer?.name === p.label;
          return (
            <Card key={p.id} className={cn(
              "group glass border-white/5 rounded-[2rem] p-6 text-center transition-all duration-500",
              isNext ? "border-primary/40 bg-primary/5 scale-105 shadow-xl ring-1 ring-primary/20" : "hover:bg-white/5"
            )}>
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  "size-12 rounded-2xl flex items-center justify-center transition-all",
                  isNext ? "bg-primary text-white shadow-lg" : "bg-white/5 text-muted-foreground"
                )}>
                  {isNext ? <BellRing className="size-6 animate-bounce" /> : <Clock className="size-6" />}
                </div>
                <div>
                  <h3 className={cn("font-bold text-lg", isNext ? "text-white" : "text-slate-400")}>{p.label}</h3>
                  <p className={cn("text-2xl font-black font-mono mt-1", isNext ? "text-primary" : "text-white")}>
                    {timings ? timings[p.id as keyof PrayerTimings] : "--:--"}
                  </p>
                </div>
                {isNext && (
                  <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase">Upcoming</Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* معلومات العقدة */}
      <footer className="flex items-center justify-between border-t border-white/5 pt-6 opacity-40">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
          <MapPin className="size-3" />
          Location Synced via Geolocation
        </div>
        <p className="text-[10px] font-bold text-muted-foreground">Umm Al-Qura Calculation Method</p>
      </footer>
    </div>
  );
}
