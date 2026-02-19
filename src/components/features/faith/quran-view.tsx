
"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, Play, Pause, Download, Check, Loader2, 
  BookOpen, Heart, Info, X, Share2, Volume2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuranStore, QuranSurah } from "@/lib/quran-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * [STABILITY_ANCHOR: QURAN_VIEW_V2.5]
 * واجهة القرآن المجمعة - تدعم القراءة والاستماع مع نظام حماية المفضلات.
 */
export function QuranView() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [readingSurah, setReadingSurah] = useState<QuranSurah | null>(null);
  
  const { 
    surahs, currentSurah, isPlaying, isLoading, currentReadingText, isReadingLoading,
    setCurrentSurah, setIsPlaying, downloadToLocal, fetchSurahText, toggleFavoriteSurah 
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
      toast({ title: "بدأ البث العصبي", description: `جاري تشغيل سورة ${s.name} مع المزامنة الخلفية.` });
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
          className="w-full h-16 bg-white/5 border-white/10 rounded-[2rem] pr-16 pl-8 text-xl text-right shadow-2xl focus-visible:ring-primary" 
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
              isActive && "ring-2 ring-primary/50 border-primary/20"
            )}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6 flex-row-reverse">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg">{s.id}</div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleFavoriteSurah(s.id)}
                      className={cn("size-10 rounded-xl transition-all", isFavorite ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-red-400")}
                    >
                      <Heart className={cn("size-5", isFavorite && "fill-current")} />
                    </Button>
                  </div>
                  <Badge variant="outline" className={cn("text-[8px] uppercase font-bold border-white/5", isCached ? "text-green-400 opacity-100" : "opacity-50")}>
                    {isCached ? (isFavorite ? "عقدة مفضلة (Protected)" : "عقدة فيزيائية (Offline)") : "سحابي (Streaming)"}
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
                      variant="outline"
                      onClick={() => openReader(s)}
                      className="size-14 rounded-[1.25rem] border border-white/10 text-indigo-400 hover:bg-white/5"
                    >
                      <BookOpen className="size-6" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-muted-foreground block">{s.sizeMB} MB</span>
                    {isCached && <span className="text-[8px] text-green-500 font-bold uppercase">Ready Offline</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* نافذة القراءة العصبية */}
      <Dialog open={!!readingSurah} onOpenChange={(open) => !open && setReadingSurah(null)}>
        <DialogContent className="max-w-4xl h-[85vh] bg-slate-950 border-white/10 rounded-[3rem] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-8 border-b border-white/5 bg-slate-900/50 shrink-0">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <DialogTitle className="text-3xl font-black text-white">{readingSurah?.name}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{readingSurah?.englishName} • {readingSurah?.numberOfAyahs} آية</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="rounded-xl border-white/10"><Share2 className="size-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setReadingSurah(null)} className="rounded-xl"><X className="size-5" /></Button>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-8 md:p-12">
            <div className="max-w-2xl mx-auto space-y-12">
              {isReadingLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <Loader2 className="size-12 animate-spin text-primary" />
                  <p className="text-muted-foreground font-bold">جاري استدعاء النص من السجل السحابي...</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-3xl font-serif text-amber-200/80 mb-16">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                  <div className="space-y-10">
                    {currentReadingText?.map((ayah) => (
                      <div key={ayah.number} className="relative group">
                        <p className="text-3xl md:text-4xl text-white leading-[2.5] text-right font-serif transition-all group-hover:text-primary/90">
                          {ayah.text}
                          <span className="inline-flex items-center justify-center size-10 rounded-full border border-primary/20 text-xs font-bold text-primary ml-4 align-middle">
                            {ayah.numberInSurah}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <footer className="p-6 border-t border-white/5 bg-black/20 flex items-center justify-center gap-8 shrink-0">
             <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
               <Info className="size-3" /> التصفح مدعوم ببروتوكول القراءة السحابي
             </div>
          </footer>
        </DialogContent>
      </Dialog>
    </div>
  );
}
