
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Search, BookOpen, ChevronRight, RotateCcw, Copy, Check, Star, 
  Moon, Sun, Heart, Zap, Globe, ArrowLeft, Share2, Sparkles, 
  Fingerprint, Clock, Compass, Activity, ShieldCheck, RefreshCw,
  Calendar, Target, Shield, MapPin, Music, Play, Pause, Download, 
  Database, Trash2, HardDrive, Settings2, Volume2, Type, ZoomIn, ZoomOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { HISN_DATA, NAMES_OF_ALLAH, HisnCategory, ZikrItem } from "@/lib/hisn-store";
import { QURAN_DATA, useQuranStore, QuranSurah } from "@/lib/quran-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function HisnAlMuslim() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("quran");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HisnCategory | null>(null);
  const [readingSurah, setReadingSurah] = useState<QuranSurah | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  
  const { 
    currentSurah, isPlaying, downloadedAssets, storageLimitMB,
    setCurrentSurah, setIsPlaying, toggleFavorite, setStorageLimit, deleteAsset
  } = useQuranStore();

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
      else audioRef.current.pause();
    }
  }, [isPlaying, currentSurah]);

  const usedStorage = useMemo(() => 
    downloadedAssets.reduce((acc, a) => acc + a.size, 0), 
  [downloadedAssets]);

  const storagePercentage = Math.round((usedStorage / storageLimitMB) * 100);

  const filteredCategories = useMemo(() => {
    if (!search) return HISN_DATA;
    return HISN_DATA.filter(cat => 
      cat.title.includes(search) || cat.description.includes(search)
    );
  }, [search]);

  const filteredQuran = useMemo(() => {
    if (!search) return QURAN_DATA;
    return QURAN_DATA.filter(s => s.name.includes(search));
  }, [search]);

  const handleCount = (item: ZikrItem) => {
    const current = counts[item.id] ?? item.count;
    if (current > 0) {
      const nextValue = current - 1;
      setCounts(prev => ({ ...prev, [item.id]: nextValue }));
      if (nextValue === 0) {
        setCompletedItems(prev => { const n = new Set(prev); n.add(item.id); return n; });
        if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
      } else if ('vibrate' in navigator) navigator.vibrate(30);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ", description: "تم نسخ النص بنجاح للعقدة." });
  };

  // واجهة قراءة السورة
  if (readingSurah) {
    return (
      <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500 bg-slate-950">
        <header className="p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-4 flex-row-reverse">
            <Button variant="ghost" size="icon" onClick={() => setReadingSurah(null)} className="rounded-full text-white">
              <ArrowLeft className="size-5 rotate-180" />
            </Button>
            <div className="text-right">
              <h2 dir="auto" className="text-2xl font-bold text-white">سورة {readingSurah.name}</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">المصحف الرقمي</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <Button variant="ghost" size="icon" onClick={() => setFontSize(Math.min(fontSize + 2, 48))} className="size-8 text-white"><ZoomIn className="size-4" /></Button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <Button variant="ghost" size="icon" onClick={() => setFontSize(Math.max(fontSize - 2, 16))} className="size-8 text-white"><ZoomOut className="size-4" /></Button>
          </div>
        </header>
        <ScrollArea className="flex-1 p-8 md:p-12">
          <div className="max-w-4xl mx-auto glass border-white/5 rounded-[3rem] p-10 md:p-16 mb-24 shadow-2xl">
            <p 
              dir="rtl" 
              className="font-serif leading-[2.2] text-center text-slate-100 transition-all duration-300"
              style={{ fontSize: `${fontSize}px` }}
            >
              {readingSurah.text || "جاري تحميل النص من الشبكة..."}
            </p>
          </div>
        </ScrollArea>
        {/* شريط تشغيل مدمج عند القراءة */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
           <Button 
            onClick={() => setCurrentSurah(readingSurah)}
            className="h-14 px-8 rounded-full bg-primary shadow-2xl shadow-primary/40 gap-3 font-bold"
           >
             {currentSurah?.id === readingSurah.id && isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
             {currentSurah?.id === readingSurah.id && isPlaying ? "إيقاف الاستماع" : "بدء الاستماع"}
           </Button>
        </div>
      </div>
    );
  }

  if (selectedCategory) {
    const progressCount = selectedCategory.items.filter(i => completedItems.has(i.id)).length;
    const progress = Math.round((progressCount / selectedCategory.items.length) * 100);
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500">
        <header className="p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-4 flex-row-reverse">
            <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)} className="rounded-full text-white">
              <ArrowLeft className="size-5 rotate-180" />
            </Button>
            <div className="text-right">
              <h2 dir="auto" className="text-2xl font-bold text-white">{selectedCategory.title}</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{progress}% مكتمل</p>
            </div>
          </div>
        </header>
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6 pb-24">
            {selectedCategory.items.map((item) => (
              <Card key={item.id} className={cn("glass border-white/5 rounded-[2.5rem] transition-all", (counts[item.id] ?? item.count) === 0 && "opacity-50")}>
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between flex-row-reverse"><Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.text)}><Copy className="size-4" /></Button></div>
                  <p dir="auto" className="text-xl leading-relaxed text-right font-serif text-slate-100">{item.text}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5 flex-row-reverse">
                    <p className="text-xs text-muted-foreground">{item.reference}</p>
                    <Button onClick={() => handleCount(item)} disabled={(counts[item.id] ?? item.count) === 0} className="h-16 px-10 rounded-2xl text-2xl font-black">
                      {(counts[item.id] ?? item.count) === 0 ? <Check /> : (counts[item.id] ?? item.count)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse">
        <div className="text-right">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-4 py-1 uppercase font-bold text-[10px]">Neural Faith Hub</Badge>
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            عقدة الإيمان
            <Sparkles className="text-primary size-10" />
          </h2>
          <p className="text-muted-foreground mt-2 text-xl">تلاوة، استماع، وتخزين ذكي للقرآن الكريم.</p>
        </div>
        
        <div className="glass border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-4 min-w-[280px]">
          <div className="flex items-center justify-between flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              <HardDrive className="size-4 text-indigo-400" />
              <span className="text-[10px] uppercase font-bold text-white">الذاكرة العصبية</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-400">{usedStorage.toFixed(1)} / {storageLimitMB} MB</span>
          </div>
          <Progress value={storagePercentage} className="h-1.5 bg-white/5" />
          <div className="flex items-center justify-between text-[9px] text-muted-foreground flex-row-reverse">
            <span>{storagePercentage}% مستخدم</span>
            <span>تنظيف ذكي نشط</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-12 flex flex-wrap h-auto gap-1 flex-row-reverse">
          <TabsTrigger value="quran" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none">القرآن الكريم</TabsTrigger>
          <TabsTrigger value="azkar" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none">الأذكار</TabsTrigger>
          <TabsTrigger value="tasbih" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none">المسبحة</TabsTrigger>
          <TabsTrigger value="storage" className="rounded-xl px-8 py-3 data-[state=active]:bg-indigo-600 flex-1 sm:flex-none">إدارة الذاكرة</TabsTrigger>
        </TabsList>

        <TabsContent value="quran" className="space-y-8 animate-in fade-in duration-500">
          <div className="relative max-w-3xl mx-auto mb-12">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
            <Input dir="auto" placeholder="ابحث عن سورة..." className="w-full h-16 bg-white/5 border-white/10 rounded-[2rem] pr-16 pl-8 text-xl text-right" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuran.map((s) => {
              const isDownloaded = downloadedAssets.some(a => a.id === s.id);
              const isFav = downloadedAssets.find(a => a.id === s.id)?.isFavorite;
              const isCurrent = currentSurah?.id === s.id;

              return (
                <Card key={s.id} className={cn("group glass border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500", isCurrent && "ring-2 ring-primary border-primary/50")}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6 flex-row-reverse">
                      <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold">
                        {s.id}
                      </div>
                      <div className="flex gap-2">
                        {isDownloaded && (
                          <Button variant="ghost" size="icon" className={cn("size-8 rounded-full", isFav ? "text-amber-400" : "text-white/20")} onClick={() => toggleFavorite(s.id)}>
                            <Star className={cn("size-4", isFav && "fill-amber-400")} />
                          </Button>
                        )}
                        <Badge variant="outline" className="border-white/5 text-[8px] uppercase opacity-50">
                          {isDownloaded ? "عقدة محلية" : "سحابي"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-right mb-8">
                      <h3 className="text-2xl font-bold text-white mb-1">{s.name}</h3>
                      <p className="text-xs text-muted-foreground">{s.reciter}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 flex-row-reverse">
                      <div className="flex gap-2 flex-row-reverse">
                        <Button onClick={() => setCurrentSurah(s)} className={cn("size-12 rounded-full", isCurrent && isPlaying ? "bg-red-500" : "bg-primary")}>
                          {isCurrent && isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-1" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => setReadingSurah(s)}
                          className="size-12 rounded-full border border-white/10 hover:bg-white/5 text-indigo-400"
                        >
                          <BookOpen className="size-5" />
                        </Button>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-mono text-muted-foreground">{s.sizeMB} MB</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="storage" className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass border-white/5 rounded-[3rem] p-10 text-right">
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 justify-end">تخصيص الذاكرة العصبية <Settings2 className="text-indigo-400" /></h3>
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between flex-row-reverse">
                    <Label className="text-sm font-bold">الحد الأقصى للتخزين</Label>
                    <span className="text-indigo-400 font-mono font-bold">{storageLimitMB} MB</span>
                  </div>
                  <Slider value={[storageLimitMB]} min={50} max={2000} step={50} onValueChange={(v) => setStorageLimit(v[0])} className="py-4" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    * عند امتلاء هذه المساحة، سيقوم النظام تلقائياً بحذف أقدم الملفات (التي لم يتم تمييزها بنجمة) لتوفير مساحة للملفات الجديدة.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass border-white/5 rounded-[3rem] p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6 text-right">السور المحملة حالياً ({downloadedAssets.length})</h3>
              <ScrollArea className="flex-1 max-h-[400px]">
                <div className="space-y-3 pr-4">
                  {downloadedAssets.length === 0 ? (
                    <div className="py-20 text-center opacity-30 italic text-sm">لا توجد ملفات مخزنة محلياً بعد.</div>
                  ) : (
                    downloadedAssets.sort((a,b) => b.timestamp - a.timestamp).map(asset => {
                      const surah = QURAN_DATA.find(q => q.id === asset.id);
                      return (
                        <div key={asset.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between flex-row-reverse">
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">{surah?.name}</p>
                            <p className="text-[9px] text-muted-foreground">حجم الملف: {asset.size} MB</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className={cn("size-8", asset.isFavorite ? "text-amber-400" : "text-white/20")} onClick={() => toggleFavorite(asset.id)}>
                              <Star className={cn("size-4", asset.isFavorite && "fill-amber-400")} />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 text-red-400/40 hover:text-red-400" onClick={() => deleteAsset(asset.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="azkar" className="space-y-12">
          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
            <Input dir="auto" placeholder="ابحث عن ذكر أو تصنيف..." className="w-full h-16 bg-white/5 border-white/10 rounded-[2rem] pr-16 pl-8 text-xl text-right" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((cat) => {
              const CategoryIcon = cat.icon === 'Sun' ? Sun : cat.icon === 'Moon' ? Moon : cat.icon === 'Globe' ? Globe : BookOpen;
              return (
                <Card key={cat.id} className="group glass border-white/5 rounded-[3rem] overflow-hidden hover:border-primary/40 transition-all cursor-pointer shadow-2xl relative" onClick={() => setSelectedCategory(cat)}>
                  <div className="p-10 text-right">
                    <div className="size-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 mb-8 group-hover:bg-primary transition-all">
                      <CategoryIcon className="size-10 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 dir="auto" className="text-3xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{cat.title}</h3>
                    <p dir="auto" className="text-muted-foreground text-sm leading-relaxed mb-8">{cat.description}</p>
                    <div className="flex items-center justify-end gap-2 text-primary font-bold text-sm">بدء الورد <ChevronRight className="size-4 rotate-180" /></div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tasbih" className="animate-in zoom-in-95 duration-500">
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-12 py-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150 animate-pulse" />
              <button onClick={() => {}} className="relative size-72 bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-full flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-transform group-hover:border-primary/50">
                <span className="text-8xl font-black text-white tracking-tighter tabular-nums">0</span>
                <p className="text-muted-foreground mt-4 text-xs font-bold uppercase">اضغط للتسبيح</p>
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Mini Player */}
      {currentSurah && !readingSurah && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md glass border-primary/20 rounded-full p-2 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex items-center justify-between px-4 flex-row-reverse">
            <div className="flex items-center gap-3 flex-row-reverse">
              <div className="size-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Music className="size-5 text-white animate-pulse" />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-white truncate max-w-[120px]">{currentSurah.name}</p>
                <p className="text-[9px] text-muted-foreground truncate">{currentSurah.reciter}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause className="size-6" /> : <Play className="size-6 ml-1" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-500/10" onClick={() => setCurrentSurah(null)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <audio ref={audioRef} src={currentSurah.url} onEnded={() => setIsPlaying(false)} />
        </div>
      )}

      <div className="mt-20 p-12 glass rounded-[3.5rem] border-white/5 text-center relative overflow-hidden">
        <h3 className="text-2xl font-bold text-white mb-4 relative z-10">﴿أَلا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾</h3>
        <p className="text-muted-foreground text-sm relative z-10">تم تطوير "عقدة الإيمان" لتكون رفيقك الدائم في رحلة الصفاء الروحي عبر بروتوكول NexusAI.</p>
      </div>
    </div>
  );
}
