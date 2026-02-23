'use client';

import React, { useState, useMemo } from "react";
import { 
  Search, Play, Pause, BookOpen, Heart, 
  Loader2, Music, ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useQuranStore, QuranSurah } from "@/lib/quran-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { SurahReader } from "./surah-reader";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * [STABILITY_ANCHOR: QURAN_VIEW_V3.6]
 * واجهة القرآن المحدثة - تم تمرير معرف السورة لضمان دقة معالجة البسملة في القارئ.
 */
export function QuranView() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [readingSurah, setReadingSurah] = useState<QuranSurah | null>(null);
  
  const { 
    surahs, currentSurah, isPlaying, currentReadingText, isReadingLoading,
    setCurrentSurah, setIsPlaying, fetchSurahText, toggleFavoriteSurah 
  } = useQuranStore();
  
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
      toast({ title: "بدأ البث والتحميل", description: `سورة ${s.name} قيد المزامنة الآن.` });
    }
  };

  const openReader = (s: QuranSurah) => {
    setReadingSurah(s);
    fetchSurahText(s.id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative max-w-3xl mx-auto mb-12">
        <Search className="absolute right-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
        <Input 
          dir="auto" 
          placeholder="ابحث عن سورة بالاسم..." 
          className="w-full h-16 bg-white/5 border border-white/10 rounded-[2.5rem] pr-16 pl-8 text-xl text-right shadow-2xl focus-visible:ring-primary text-white font-quran" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {filteredQuran.map((s) => {
          const asset = cachedAssets.find(a => a.id === `quran-${s.id}`);
          const isCached = !!asset;
          const isFavorite = asset?.isFavorite || false;
          const isActive = currentSurah?.id === s.id;

          return (
            <Card key={s.id} className={cn(
              "group glass border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-primary/40 relative",
              isActive && "ring-2 ring-primary/50 border-primary/20 bg-primary/5 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
            )}>
              <CardContent className="p-7">
                <div className="flex items-center justify-between mb-6 flex-row-reverse">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl shadow-inner border border-primary/10 group-hover:scale-110 transition-transform">
                      {s.id}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        toggleFavoriteSurah(s.id);
                        toast({ title: isFavorite ? "تم فك درع الحماية" : "تم التفعيل", description: isFavorite ? "الأصل متاح للحذف التلقائي." : "هذه السورة محمية من الحذف التلقائي." });
                      }}
                      className={cn("size-10 rounded-xl transition-all", isFavorite ? "text-red-500 bg-red-500/10 shadow-lg" : "text-muted-foreground hover:text-red-400")}
                    >
                      <Heart className={cn("size-5", isFavorite && "fill-current")} />
                    </Button>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[8px] uppercase font-black border-white/5 px-3 py-1", 
                    isCached ? (isFavorite ? "text-red-400 border-red-500/20" : "text-green-400 border-green-500/20") : "opacity-40"
                  )}>
                    {isCached ? (isFavorite ? "عقدة محمية (Shielded)" : "عقدة فيزيائية (Cached)") : "سحابي (Cloud)"}
                  </Badge>
                </div>

                <div className="text-right mb-8">
                  <h3 className="text-3xl font-bold text-white mb-1 group-hover:text-primary transition-colors font-quran">{s.name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest">{s.englishName} • {s.numberOfAyahs} AYAHS</p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5 flex-row-reverse">
                  <div className="flex gap-3 flex-row-reverse">
                    <Button onClick={() => handleTogglePlay(s)} className={cn("size-14 rounded-2xl shadow-xl transition-all", isActive && isPlaying ? "bg-red-500 scale-110" : "bg-primary hover:scale-105 active:scale-95")}>
                      {isActive && isPlaying ? <Pause className="size-6" /> : <Play className="size-6 ml-1" />}
                    </Button>
                    <Dialog open={!!readingSurah && readingSurah.id === s.id} onOpenChange={(open) => !open && setReadingSurah(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline"
                          onClick={() => openReader(s)}
                          className="size-14 rounded-2xl border border-white/10 text-indigo-400 hover:bg-white/10 shadow-lg transition-all hover:border-indigo-500/50"
                        >
                          <BookOpen className="size-6" />
                        </Button>
                      </DialogTrigger>
                      <SurahReader 
                        surahId={readingSurah?.id}
                        surahName={readingSurah?.name} 
                        englishName={readingSurah?.englishName} 
                        ayahs={currentReadingText} 
                        isLoading={isReadingLoading} 
                        onClose={() => setReadingSurah(null)}
                      />
                    </Dialog>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-muted-foreground block uppercase font-bold">{s.sizeMB} MB</span>
                    {isCached && <div className="flex items-center gap-1 justify-end mt-1 text-green-500"><ShieldCheck className="size-3" /><span className="text-[8px] font-black uppercase">Physical Node</span></div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}