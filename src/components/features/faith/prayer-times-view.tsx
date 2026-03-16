
'use client';

import React, { useEffect } from "react";
import { Clock, MapPin, Loader2, Zap, BellRing, Settings2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrayerStore, PrayerTimings, CALCULATION_METHODS } from "@/lib/prayer-times-store";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: PRAYER_TIMES_V2]
 * واجهة المواقيت المحصنة - تدعم تغيير طريقة الحساب لتصحيح الأخطاء الزمنية.
 */
export function PrayerTimesView() {
  const { 
    timings, nextPrayer, isLoading, method, asrSchool, lastUpdated,
    fetchTimings, calculateNextPrayer, setMethod, setAsrSchool 
  } = usePrayerStore();

  useEffect(() => {
    fetchTimings();
    const interval = setInterval(() => {
      calculateNextPrayer();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const PRAYERS = [
    { id: 'Fajr', label: 'الفجر' },
    { id: 'Dhuhr', label: 'الظهر' },
    { id: 'Asr', label: 'العصر' },
    { id: 'Maghrib', label: 'المغرب' },
    { id: 'Isha', label: 'العشاء' },
  ];

  const formattedDate = lastUpdated 
    ? new Intl.DateTimeFormat('ar-EG', { 
        month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' 
      }).format(new Date(lastUpdated))
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* إعدادات المعايرة */}
      <div className="flex flex-col md:flex-row gap-4 flex-row-reverse mb-4">
        <div className="flex-1 space-y-2 text-right">
          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">طريقة الحساب</label>
          <Select value={method.toString()} onValueChange={(v) => setMethod(parseInt(v))}>
            <SelectTrigger className="bg-white/5 border-white/10 h-12 flex-row-reverse rounded-xl">
              <SelectValue placeholder="اختر طريقة الحساب" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-white/10 text-white">
              {CALCULATION_METHODS.map(m => (
                <SelectItem key={m.id} value={m.id.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48 space-y-2 text-right">
          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">المذهب (العصر)</label>
          <Select value={asrSchool.toString()} onValueChange={(v) => setAsrSchool(parseInt(v))}>
            <SelectTrigger className="bg-white/5 border-white/10 h-12 flex-row-reverse rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-white/10 text-white">
              <SelectItem value="0">شافعي / مالكي / حنبلي</SelectItem>
              <SelectItem value="1">حنفي</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* العداد التنازلي الرئيسي */}
      <Card className="glass border-primary/20 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl bg-primary/5">
        <div className="absolute top-0 right-0 size-64 bg-primary/10 blur-[100px] -mr-32 -mt-32" />
        
        {/* مؤشر التحيث في الخلفية */}
        {isLoading && timings && (
          <div className="absolute top-6 left-6 flex items-center gap-2 animate-pulse">
            <Loader2 className="size-3 animate-spin text-primary" />
            <span className="text-[8px] font-bold text-primary uppercase tracking-tighter">Updating Data...</span>
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center text-center">
          {isLoading && !timings ? (
            <div className="py-10 flex flex-col items-center gap-4">
              <Loader2 className="size-12 animate-spin text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">تحديد الموقع الزمني...</p>
            </div>
          ) : (
            <>
              <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-4 py-1 uppercase font-bold text-[10px] tracking-widest">
                Next Pulse: {nextPrayer?.name}
              </Badge>
              <h2 className="text-7xl font-black text-white tracking-tighter mb-2 font-mono">
                {nextPrayer?.remaining}
              </h2>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Clock className="size-4" /> متبقي على رفع الأذان
              </p>
              
              {formattedDate && (
                 <div className="mt-6 flex items-center gap-2 text-[10px] text-muted-foreground/60 font-medium">
                    <MapPin className="size-3" />
                    <span>آخر تحديث: {formattedDate}</span>
                 </div>
              )}
            </>
          )}
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
      {/*<footer className="flex items-center justify-between border-t border-white/5 pt-6 opacity-40 flex-row-reverse">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest flex-row-reverse">
          <MapPin className="size-3" />
          Location Synced via Aladhan API
        </div>
        <p className="text-[10px] font-bold text-muted-foreground">Calibration Mode Active</p>
      </footer>*/}
    </div>
  );
}
