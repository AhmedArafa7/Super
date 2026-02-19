
"use client";

import React, { useState, useMemo } from "react";
import { Search, Play, Pause, Download, Check, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuranStore, QuranSurah } from "@/lib/quran-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * [STABILITY_ANCHOR: QURAN_VIEW_COMPONENT]
 * مكون مستقل لعرض سور القرآن الكريم والمزامنة مع الذاكرة المحلية.
 */
export function QuranView() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  
  const { surahs, currentSurah, isPlaying, isLoading, setCurrentSurah, setIsPlaying, downloadToLocal } = useQuranStore();
  const { cachedAssets } = useGlobalStorage();

  const filteredQuran = useMemo(() => {
    if (!search) return surahs;
    return surahs.filter(s => s.name.includes(search) || s.englishName?.toLowerCase().includes(search.toLowerCase()));
  }, [search, surahs]);

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
    try {
      await downloadToLocal(s);
      toast({ title: "مزامنة فيزيائية ناجحة", description: `سورة ${s.name} محفوظة الآن أوفلاين.` });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل المزامنة", description: "تعذر تحميل الملف الصوتي." });
    } finally {
      setIsDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-bold">جاري مزامنة السور من الـ API العالمي...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative max-w-3xl mx-auto mb-12">
        <Search className="absolute right-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
        <Input 
          dir="auto" 
          placeholder="ابحث عن سورة بالاسم..." 
          className="w-full h-16 bg-white/5 border-white/10 rounded-[2rem] pr-16 pl-8 text-xl text-right shadow-2xl focus-visible:ring-primary" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {filteredQuran.map((s) => {
          const isCached = cachedAssets.some(a => a.id === `quran-${s.id}`);
          const isActive = currentSurah?.id === s.id;
          return (
            <Card key={s.id} className={cn("group glass border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-primary/40", isActive && "ring-2 ring-primary/50 border-primary/20")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6 flex-row-reverse">
                  <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg">{s.id}</div>
                  <Badge variant="outline" className={cn("text-[8px] uppercase font-bold border-white/5", isCached ? "text-green-400 opacity-100" : "opacity-50")}>
                    {isCached ? "عقدة فيزيائية (Offline)" : "سحابي (Streaming)"}
                  </Badge>
                </div>
                <div className="text-right mb-8">
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{s.name}</h3>
                  <p className="text-xs text-muted-foreground uppercase font-mono tracking-tighter">{s.englishName} • {s.numberOfAyahs} آية</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5 flex-row-reverse">
                  <div className="flex gap-2 flex-row-reverse">
                    <Button onClick={() => handleTogglePlay(s)} className={cn("size-14 rounded-[1.25rem] shadow-lg transition-all", isActive && isPlaying ? "bg-red-500 scale-110" : "bg-primary")}>
                      {isActive && isPlaying ? <Pause className="size-6" /> : <Play className="size-6 ml-1" />}
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
    </div>
  );
}
