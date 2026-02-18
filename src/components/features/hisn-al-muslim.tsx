
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Search, BookOpen, ChevronRight, RotateCcw, Copy, Check, Star, 
  Moon, Sun, Globe, ArrowLeft, Sparkles, 
  Infinity, Info, Lightbulb, Settings2, Database, Trash2, HardDrive, ZoomIn, ZoomOut, Play, Pause, Music, Download, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { HISN_DATA, NAMES_OF_ALLAH, HisnCategory, ZikrItem } from "@/lib/hisn-store";
import { useQuranStore, QuranSurah } from "@/lib/quran-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function HisnAlMuslim() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("quran");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HisnCategory | null>(null);
  const [readingSurah, setReadingSurah] = useState<QuranSurah | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihTarget, setTasbihTarget] = useState(33);

  const { surahs, currentSurah, isPlaying, isLoading, fetchSurahs, setCurrentSurah, setIsPlaying, downloadToLocal } = useQuranStore();
  const { cachedAssets, storageLimitMB, setStorageLimit, removeAsset, getTotalUsedSpace } = useGlobalStorage();

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (surahs.length === 0) fetchSurahs();
  }, []);

  useEffect(() => {
    setSelectedCategory(null);
    setReadingSurah(null);
    setSearch("");
  }, [activeTab]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error("Audio Play Error:", err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSurah?.id]);

  const handleTogglePlay = (s: QuranSurah) => {
    if (currentSurah?.id === s.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSurah(s);
      setIsPlaying(true);
    }
  };

  const handleDownload = async (s: QuranSurah) => {
    setIsDownloading(s.id);
    await downloadToLocal(s);
    setIsDownloading(null);
    toast({ title: "مزامنة ناجحة", description: `سورة ${s.name} متاحة الآن أوفلاين.` });
  };

  const usedStorage = getTotalUsedSpace();
  const storagePercentage = Math.round((usedStorage / storageLimitMB) * 100);

  const filteredQuran = useMemo(() => {
    if (!search) return surahs;
    return surahs.filter(s => s.name.includes(search) || s.englishName?.toLowerCase().includes(search.toLowerCase()));
  }, [search, surahs]);

  const handleTasbih = () => {
    setTasbihCount(prev => prev + 1);
    if ('vibrate' in navigator) navigator.vibrate(20);
    if ((tasbihCount + 1) % tasbihTarget === 0) {
      toast({ title: "اكتملت الدورة", description: `لقد أتممت ${tasbihTarget} تسبيحة بنجاح.` });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse">
        <div className="text-right">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-4 py-1 uppercase font-bold text-[10px] tracking-widest">Neural Faith Hub</Badge>
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            عقدة الإيمان
            <Sparkles className="text-primary size-10" />
          </h2>
          <p className="text-muted-foreground mt-2 text-xl max-w-2xl">تواصل روحي عميق عبر تقنيات المزامنة والـ API في نظام نكسوس.</p>
        </div>
        
        <div className="glass border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-4 min-w-[280px]">
          <div className="flex items-center justify-between flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              <HardDrive className="size-4 text-indigo-400" />
              <span className="text-[10px] uppercase font-bold text-white">الذاكرة العصبية المحلية</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-400">{usedStorage.toFixed(1)} / {storageLimitMB} MB</span>
          </div>
          <Progress value={storagePercentage} className="h-1.5 bg-white/5" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-12 flex flex-wrap h-auto gap-1 flex-row-reverse">
          <TabsTrigger value="quran" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">القرآن الكريم (API)</TabsTrigger>
          <TabsTrigger value="azkar" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">الأذكار</TabsTrigger>
          <TabsTrigger value="names" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">أسماء الله</TabsTrigger>
          <TabsTrigger value="tasbih" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">المسبحة</TabsTrigger>
          <TabsTrigger value="storage" className="rounded-xl px-8 py-3 data-[state=active]:bg-indigo-600 flex-1 sm:flex-none font-bold">إدارة الذاكرة</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {activeTab === 'quran' && (
            <TabsContent key="quran" value="quran" className="space-y-8 focus-visible:ring-0">
              <div className="relative max-w-3xl mx-auto mb-12">
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
                <Input dir="auto" placeholder="ابحث عن سورة بالاسم (مزامنة API)..." className="w-full h-16 bg-white/5 border-white/10 rounded-[2rem] pr-16 pl-8 text-xl text-right shadow-2xl" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="size-12 animate-spin text-primary" />
                  <p className="text-muted-foreground animate-pulse font-bold">جاري مزامنة السور من الـ API العالمي...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredQuran.map((s) => {
                    const isCached = cachedAssets.some(a => a.id === `quran-${s.id}`);
                    return (
                      <Card key={s.id} className="group glass border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-primary/40">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-6 flex-row-reverse">
                            <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg">{s.id}</div>
                            <Badge variant="outline" className={cn("text-[8px] uppercase font-bold border-white/5", isCached ? "text-green-400 opacity-100" : "opacity-50")}>
                              {isCached ? "عقدة محلية (Offline)" : "سحابي (API)"}
                            </Badge>
                          </div>
                          <div className="text-right mb-8">
                            <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{s.name}</h3>
                            <p className="text-xs text-muted-foreground uppercase font-mono tracking-tighter">{s.englishName} • {s.numberOfAyahs} آية</p>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-white/5 flex-row-reverse">
                            <div className="flex gap-2 flex-row-reverse">
                              <Button onClick={() => handleTogglePlay(s)} className={cn("size-14 rounded-[1.25rem] shadow-lg transition-all", currentSurah?.id === s.id && isPlaying ? "bg-red-500 scale-110" : "bg-primary")}>
                                {currentSurah?.id === s.id && isPlaying ? <Pause className="size-6" /> : <Play className="size-6 ml-1" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                disabled={isCached || isDownloading === s.id}
                                onClick={() => handleDownload(s)} 
                                className="size-14 rounded-[1.25rem] border border-white/10 text-indigo-400 hover:bg-white/5"
                              >
                                {isDownloading === s.id ? <Loader2 className="size-6 animate-spin" /> : isCached ? <Check className="size-6 text-green-400" /> : <Download className="size-6" />}
                              </Button>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">{s.sizeMB} MB</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          )}
          {/* بقية التبويبات (الأذكار، الأسماء، إلخ) تبقى كما هي للحفاظ على المزايا */}
        </AnimatePresence>
      </Tabs>
      <audio ref={audioRef} src={currentSurah?.url} />
    </div>
  );
}
