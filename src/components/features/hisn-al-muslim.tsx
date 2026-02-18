
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Search, BookOpen, ChevronRight, RotateCcw, Copy, Check, Star, 
  Moon, Sun, Globe, ArrowLeft, Sparkles, 
  Infinity, Info, Lightbulb, Settings2, Database, Trash2, HardDrive, ZoomIn, ZoomOut, Play, Pause, Music
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
import { QURAN_DATA, useQuranStore, QuranSurah } from "@/lib/quran-store";
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
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihTarget, setTasbihTarget] = useState(33);

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
  }, [isPlaying, currentSurah, setIsPlaying]);

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

  const handleTasbih = () => {
    setTasbihCount(prev => prev + 1);
    if ('vibrate' in navigator) navigator.vibrate(20);
    if ((tasbihCount + 1) % tasbihTarget === 0) {
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      toast({ title: "اكتملت الدورة", description: `لقد أتممت ${tasbihTarget} تسبيحة بنجاح.` });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ", description: "تم نسخ النص بنجاح للعقدة." });
  };

  if (readingSurah) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full bg-slate-950"
      >
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
           <Button 
            onClick={() => setCurrentSurah(readingSurah)}
            className="h-14 px-8 rounded-full bg-primary shadow-2xl shadow-primary/40 gap-3 font-bold"
           >
             {currentSurah?.id === readingSurah.id && isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
             {currentSurah?.id === readingSurah.id && isPlaying ? "إيقاف الاستماع" : "بدء الاستماع"}
           </Button>
        </div>
      </motion.div>
    );
  }

  if (selectedCategory) {
    const progressCount = selectedCategory.items.filter(i => completedItems.has(i.id)).length;
    const progress = Math.round((progressCount / selectedCategory.items.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col h-full"
      >
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
          <div className="max-w-4xl mx-auto space-y-6 pb-24 text-right">
            {selectedCategory.items.map((item) => (
              <Card key={item.id} className={cn("glass border-white/5 rounded-[2.5rem] transition-all", (counts[item.id] ?? item.count) === 0 && "opacity-50 grayscale")}>
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between flex-row-reverse">
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.text)} className="size-10 rounded-xl hover:bg-white/5">
                      <Copy className="size-4 text-indigo-400" />
                    </Button>
                    {item.description && (
                      <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 gap-1.5 h-7">
                        <Info className="size-3" /> {item.description}
                      </Badge>
                    )}
                  </div>
                  <p dir="auto" className="text-2xl leading-relaxed text-right font-serif text-slate-100 font-medium">
                    {item.text}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5 flex-row-reverse">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground italic">{item.reference}</p>
                    </div>
                    <Button 
                      onClick={() => handleCount(item)} 
                      disabled={(counts[item.id] ?? item.count) === 0} 
                      className={cn(
                        "h-20 w-20 rounded-[2rem] text-3xl font-black shadow-lg transition-all active:scale-90",
                        (counts[item.id] ?? item.count) === 0 ? "bg-green-500/20 text-green-400" : "bg-primary text-white"
                      )}
                    >
                      {(counts[item.id] ?? item.count) === 0 ? <Check className="size-8" /> : (counts[item.id] ?? item.count)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </motion.div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse">
        <div className="text-right">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-4 py-1 uppercase font-bold text-[10px] tracking-widest">Neural Faith Hub</Badge>
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            عقدة الإيمان
            <Sparkles className="text-primary size-10" />
          </h2>
          <p className="text-muted-foreground mt-2 text-xl max-w-2xl">تواصل روحي عميق عبر أحدث التقنيات الرقمية المتاحة في نظام نكسوس.</p>
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
            <span className="flex items-center gap-1">تنظيف ذكي نشط</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-12 flex flex-wrap h-auto gap-1 flex-row-reverse">
          <TabsTrigger value="quran" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">القرآن الكريم</TabsTrigger>
          <TabsTrigger value="azkar" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">الأذكار</TabsTrigger>
          <TabsTrigger value="names" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">أسماء الله</TabsTrigger>
          <TabsTrigger value="tasbih" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none font-bold">المسبحة</TabsTrigger>
          <TabsTrigger value="storage" className="rounded-xl px-8 py-3 data-[state=active]:bg-indigo-600 flex-1 sm:flex-none font-bold">إعدادات الذاكرة</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {activeTab === 'quran' && (
            <TabsContent key="quran" value="quran" className="space-y-8 focus-visible:ring-0">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="relative max-w-3xl mx-auto mb-12">
                  <Search className="absolute right-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
                  <Input dir="auto" placeholder="ابحث عن سورة بالاسم أو الرقم..." className="w-full h-16 bg-white/5 border-white/10 rounded-[2rem] pr-16 pl-8 text-xl text-right focus-visible:ring-primary shadow-2xl" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredQuran.map((s) => {
                    const isDownloaded = downloadedAssets.some(a => a.id === s.id);
                    const isFav = downloadedAssets.find(a => a.id === s.id)?.isFavorite;
                    const isCurrent = currentSurah?.id === s.id;

                    return (
                      <Card key={s.id} className={cn("group glass border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-primary/40", isCurrent && "ring-2 ring-primary border-primary/50 shadow-primary/10")}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-6 flex-row-reverse">
                            <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg">
                              {s.id}
                            </div>
                            <div className="flex gap-2">
                              {isDownloaded && (
                                <Button variant="ghost" size="icon" className={cn("size-8 rounded-full", isFav ? "text-amber-400" : "text-white/20")} onClick={() => toggleFavorite(s.id)}>
                                  <Star className={cn("size-4", isFav && "fill-amber-400")} />
                                </Button>
                              )}
                              <Badge variant="outline" className={cn("text-[8px] uppercase font-bold", isDownloaded ? "border-green-500/30 text-green-400" : "border-white/5 opacity-50")}>
                                {isDownloaded ? "عقدة محلية" : "سحابي"}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-right mb-8">
                            <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{s.name}</h3>
                            <p className="text-xs text-muted-foreground">{s.reciter}</p>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-white/5 flex-row-reverse">
                            <div className="flex gap-2 flex-row-reverse">
                              <Button onClick={() => setCurrentSurah(s)} className={cn("size-14 rounded-[1.25rem] shadow-lg active:scale-95 transition-all", isCurrent && isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90")}>
                                {isCurrent && isPlaying ? <Pause className="size-6" /> : <Play className="size-6 ml-1" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                onClick={() => setReadingSurah(s)}
                                className="size-14 rounded-[1.25rem] border border-white/10 hover:bg-white/5 text-indigo-400"
                              >
                                <BookOpen className="size-6" />
                              </Button>
                            </div>
                            <div className="text-left">
                              <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded-md">{s.sizeMB} MB</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            </TabsContent>
          )}

          {activeTab === 'azkar' && (
            <TabsContent key="azkar" value="azkar" className="space-y-12">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="relative max-w-3xl mx-auto">
                  <Search className="absolute right-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
                  <Input dir="auto" placeholder="البحث في الأذكار..." className="w-full h-16 bg-white/5 border-white/10 rounded-[2rem] pr-16 pl-8 text-xl text-right shadow-2xl" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCategories.map((cat) => {
                    const CategoryIcon = cat.icon === 'Sun' ? Sun : cat.icon === 'Moon' ? Moon : Globe;
                    return (
                      <Card key={cat.id} className="group glass border-white/5 rounded-[3rem] overflow-hidden hover:border-primary/40 transition-all cursor-pointer shadow-2xl relative" onClick={() => setSelectedCategory(cat)}>
                        <div className="p-10 text-right">
                          <div className="size-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 mb-8 group-hover:bg-primary transition-all group-hover:scale-110">
                            <CategoryIcon className="size-10 text-primary group-hover:text-white transition-colors" />
                          </div>
                          <h3 dir="auto" className="text-3xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{cat.title}</h3>
                          <p dir="auto" className="text-muted-foreground text-sm leading-relaxed mb-8">{cat.description}</p>
                          <div className="flex items-center justify-end gap-2 text-primary font-bold text-sm">بدء الورد <ChevronRight className="size-4 rotate-180 group-hover:-translate-x-1 transition-transform" /></div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            </TabsContent>
          )}

          {activeTab === 'names' && (
            <TabsContent key="names" value="names" className="focus-visible:ring-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {NAMES_OF_ALLAH.map((name) => (
                  <Card key={name.id} className="glass border-white/5 rounded-3xl hover:border-primary/40 transition-all group text-right">
                    <CardContent className="p-6 flex flex-col items-center gap-4">
                      <div className="size-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl font-serif text-primary group-hover:scale-110 transition-transform">
                        {name.name}
                      </div>
                      <p dir="auto" className="text-[10px] text-muted-foreground leading-relaxed text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {name.meaning}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            </TabsContent>
          )}

          {activeTab === 'tasbih' && (
            <TabsContent key="tasbih" value="tasbih" className="focus-visible:ring-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto flex flex-col items-center gap-12 py-12 text-center">
                <div className="space-y-4">
                  <Badge variant="outline" className="px-4 py-1 border-indigo-500/30 text-indigo-400">مسبحة نكسوس التفاعلية</Badge>
                  <div className="flex items-center gap-4 justify-center flex-row-reverse">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">الهدف:</Label>
                    <div className="flex gap-2">
                      {[33, 99, 100].map(val => (
                        <button key={val} onClick={() => setTasbihTarget(val)} className={cn("px-3 py-1 rounded-lg text-[10px] font-bold transition-all", tasbihTarget === val ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10")}>
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <motion.div 
                    className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  <button 
                    onClick={handleTasbih} 
                    className="relative size-80 bg-white/5 backdrop-blur-3xl border-4 border-white/10 rounded-full flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] active:scale-95 transition-all group-hover:border-primary/50"
                  >
                    <span className="text-9xl font-black text-white tracking-tighter tabular-nums mb-2">
                      {tasbihCount}
                    </span>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">اضغط للتسبيح</p>
                    </div>
                  </button>
                  
                  <Button 
                    onClick={() => { setTasbihCount(0); if ('vibrate' in navigator) navigator.vibrate(50); }}
                    variant="ghost" 
                    size="icon" 
                    className="absolute -bottom-4 -right-4 size-14 bg-slate-900 border border-white/10 rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all shadow-xl"
                  >
                    <RotateCcw className="size-6" />
                  </Button>
                </div>

                <div className="p-6 glass border-white/5 rounded-3xl w-full max-w-sm flex items-center justify-between flex-row-reverse">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div className="size-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                      <Infinity className="size-5" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">إجمالي اليوم</p>
                      <p className="font-black text-xl text-white">{tasbihCount}</p>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="text-left">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">الدورة الحالية</p>
                    <p className="font-black text-xl text-indigo-400">{Math.floor(tasbihCount / tasbihTarget)}</p>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          )}

          {activeTab === 'storage' && (
            <TabsContent key="storage" value="storage" className="focus-visible:ring-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass border-white/5 rounded-[3rem] p-10 text-right">
                  <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 justify-end">تخصيص العقدة الإيمانية <Settings2 className="text-indigo-400" /></h3>
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <div className="flex justify-between flex-row-reverse items-center">
                        <Label className="text-sm font-bold text-white">الحد الأقصى للتخزين</Label>
                        <Badge className="bg-indigo-500/20 text-indigo-400 font-mono font-bold text-lg px-4 py-1">{storageLimitMB} MB</Badge>
                      </div>
                      <Slider value={[storageLimitMB]} min={50} max={2000} step={50} onValueChange={(v) => setStorageLimit(v[0])} className="py-4" />
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-3 flex-row-reverse">
                        <Lightbulb className="size-5 text-amber-400 shrink-0" />
                        <p className="text-[10px] text-amber-200/70 leading-relaxed italic text-right">
                          عند امتلاء المساحة، سيقوم نظام نكسوس تلقائياً بتنظيف الملفات القديمة غير المميزة بنجمة لتوفير مساحة للمحتوى الجديد.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="glass border-white/5 rounded-[3rem] p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-6 flex-row-reverse">
                    <h3 className="text-xl font-bold text-white">الملفات المحلية ({downloadedAssets.length})</h3>
                    <Database className="size-5 text-indigo-400" />
                  </div>
                  <ScrollArea className="flex-1 max-h-[400px]">
                    <div className="space-y-3 pr-4">
                      {downloadedAssets.length === 0 ? (
                        <div className="py-20 text-center opacity-30 italic text-sm border-2 border-dashed border-white/5 rounded-[2rem]">لا توجد بيانات مخزنة محلياً.</div>
                      ) : (
                        downloadedAssets.sort((a,b) => b.timestamp - a.timestamp).map(asset => {
                          const surah = QURAN_DATA.find(q => q.id === asset.id);
                          return (
                            <div key={asset.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between flex-row-reverse group hover:bg-white/10 transition-all">
                              <div className="text-right">
                                <p className="text-sm font-bold text-white">{surah?.name}</p>
                                <p className="text-[9px] text-muted-foreground flex items-center gap-1 justify-end">
                                  {asset.size} MB
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className={cn("size-9 rounded-xl transition-all", asset.isFavorite ? "text-amber-400 bg-amber-400/10" : "text-white/20 hover:bg-white/10")} onClick={() => toggleFavorite(asset.id)}>
                                  <Star className={cn("size-4", asset.isFavorite && "fill-amber-400")} />
                                </Button>
                                <Button variant="ghost" size="icon" className="size-9 rounded-xl text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition-all" onClick={() => deleteAsset(asset.id)}>
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
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
