
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuranStore } from "@/lib/quran-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { QuranView } from "./faith/quran-view";
import { AzkarView } from "./faith/azkar-view";
import { TasbihView } from "./faith/tasbih-view";
import { StorageView } from "./faith/storage-view";
import { NamesView } from "./faith/names-view";
import { PrayerTimesView } from "./faith/prayer-times-view";
import { AnimatePresence } from "framer-motion";

/**
 * [STABILITY_ANCHOR: FAITH_HUB_ORCHESTRATOR_V3]
 * المكون المركزي لحصن المسلم. تم إضافة نظام مواقيت الصلاة المباشر.
 */
export function HisnAlMuslim() {
  const [activeTab, setActiveTab] = useState("quran");
  const { currentSurah, isPlaying, fetchSurahs, setIsPlaying, setPlaybackPosition, setDuration, seekToCommand, clearSeekCommand, savedPositions } = useQuranStore();
  const { getTotalUsedSpace, storageLimitMB } = useGlobalStorage();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSurahs();
  }, []);

  // [STABILITY_ANCHOR: GLOBAL_AUDIO_SYNC]
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsPlaying(false);
      
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) setPlaybackPosition(audioRef.current.currentTime);
      };
      
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
      };
    }
    
    const audio = audioRef.current;
    if (currentSurah) {
      if (audio.src !== currentSurah.url) {
        audio.src = currentSurah.url;
        // Restore saved position if available
        const savedPos = savedPositions[currentSurah.id] || 0;
        audio.currentTime = savedPos;
      }
      
      if (isPlaying) {
        audio.play().catch((err) => {
          console.error("Audio playback failed:", err);
          setIsPlaying(false);
        });
      } else {
        audio.pause();
      }
    }
    
    return () => { if (audio) audio.pause(); };
  }, [isPlaying, currentSurah, savedPositions, setIsPlaying, setPlaybackPosition, setDuration]);

  // Handle seeking commands
  useEffect(() => {
    if (seekToCommand !== null && audioRef.current) {
      audioRef.current.currentTime = seekToCommand;
      clearSeekCommand();
    }
  }, [seekToCommand, clearSeekCommand]);

  const usedStorage = getTotalUsedSpace();
  const storagePercentage = Math.round((usedStorage / storageLimitMB) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse">
        <div className="text-right">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-4 py-1 uppercase font-bold text-[10px] tracking-widest">Neural Faith Hub</Badge>
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            حصن المسلم
            <Sparkles className="text-primary size-10" />
          </h2>
          <p className="text-muted-foreground mt-2 text-xl max-w-2xl text-right">تواصل روحي عميق عبر بروتوكولات المزامنة والـ API .</p>
        </div>

        <div className="glass border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-4 min-w-[280px]">
          <div className="flex items-center justify-between flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              <HardDrive className="size-4 text-indigo-400" />
              <span className="text-[10px] uppercase font-bold text-white">الذاكرة الفيزيائية المحلية</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-400">{usedStorage.toFixed(1)} / {storageLimitMB} MB</span>
          </div>
          <Progress value={storagePercentage} className="h-1.5 bg-white/5" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-12 flex flex-wrap h-auto gap-1 flex-row-reverse">
          <TabsTrigger value="quran" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">القرآن الكريم</TabsTrigger>
          <TabsTrigger value="prayers" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">مواقيت الصلاة</TabsTrigger>
          <TabsTrigger value="azkar" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">الأذكار</TabsTrigger>
          <TabsTrigger value="names" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">أسماء الله</TabsTrigger>
          <TabsTrigger value="tasbih" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">المسبحة</TabsTrigger>
          <TabsTrigger value="storage" className="rounded-xl px-8 py-3 data-[state=active]:bg-indigo-600 flex-1 sm:flex-none font-bold">إدارة الذاكرة</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent key="quran-content" value="quran"><QuranView /></TabsContent>
          <TabsContent key="prayers-content" value="prayers"><PrayerTimesView /></TabsContent>
          <TabsContent key="azkar-content" value="azkar"><AzkarView /></TabsContent>
          <TabsContent key="names-content" value="names"><NamesView /></TabsContent>
          <TabsContent key="tasbih-content" value="tasbih"><TasbihView /></TabsContent>
          <TabsContent key="storage-content" value="storage"><StorageView /></TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
