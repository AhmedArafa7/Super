
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
  
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihTarget, setTasbihTarget] = useState(33);

  const { 
    currentSurah, isPlaying, downloadedAssets, storageLimitMB,
    setCurrentSurah, setIsPlaying, setStorageLimit, deleteAsset
  } = useQuranStore();

  const audioRef = useRef<HTMLAudioElement>(null);

  // تصفية الحالات عند تغيير التبويب لضمان عدم تداخل الواجهات
  useEffect(() => {
    setSelectedCategory(null);
    setReadingSurah(null);
    setSearch("");
  }, [activeTab]);

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
      if (nextValue === 0 && 'vibrate' in navigator) navigator.vibrate([50, 30, 50]);
      else if ('vibrate' in navigator) navigator.vibrate(30);
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

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen animate-in fade-in duration-700">
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
          <TabsTrigger value="storage" className="rounded-xl px-8 py-3 data-[state=active]:bg-indigo-600 flex-1 sm:flex-none font-bold">إدارة الذاكرة</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {activeTab === 'quran' && (
            <TabsContent key="quran" value="quran" className="space-y-8 focus-visible:ring-0">
              {readingSurah ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6">
                  <header className="p-6 glass border-white/5 rounded-[2rem] flex items-center justify-between flex-row-reverse">
                    <div className="flex items-center gap-4 flex-row-reverse">
                      <Button variant="ghost" size="icon" onClick={() => setReadingSurah(null)} className="rounded-full text-white">
                        <ArrowLeft className="size-5 rotate-180" />
                      </Button>
                      <h2 dir="auto" className="text-xl font-bold text-white">سورة {readingSurah.name}</h2>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                      <Button variant="ghost" size="icon" onClick={() => setFontSize(Math.min(fontSize + 2, 48))} className="size-8 text-white"><ZoomIn className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setFontSize(Math.max(fontSize - 2, 16))} className="size-8 text-white"><ZoomOut className="size-4" /></Button>
                    </div>
                  </header>
                  <Card className="glass border-white/5 rounded-[3rem] p-10 shadow-2xl overflow-hidden">
                    <p dir="rtl" className="font-serif leading-[2.5] text-center text-slate-100 whitespace-pre-wrap" style={{ fontSize: `${fontSize}px` }}>
                      {readingSurah.text}
                    </p>
                  </Card>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="relative max-w-3xl mx-auto mb-12">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
                    <Input dir="auto" placeholder="ابحث عن سورة بالاسم..." className="w-full h-16 bg-white/5 border-white/10 rounded-[2rem] pr-16 pl-8 text-xl text-right shadow-2xl" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQuran.map((s) => (
                      <Card key={s.id} className="group glass border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-primary/40">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-6 flex-row-reverse">
                            <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg">{s.id}</div>
                            <Badge variant="outline" className="text-[8px] uppercase font-bold border-white/5 opacity-50">
                              {downloadedAssets.some(a => a.id === s.id) ? "عقدة محلية" : "سحابي"}
                            </Badge>
                          </div>
                          <div className="text-right mb-8">
                            <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{s.name}</h3>
                            <p className="text-xs text-muted-foreground">{s.reciter}</p>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-white/5 flex-row-reverse">
                            <div className="flex gap-2 flex-row-reverse">
                              <Button onClick={() => setCurrentSurah(s)} className={cn("size-14 rounded-[1.25rem] shadow-lg", currentSurah?.id === s.id && isPlaying ? "bg-red-500" : "bg-primary")}>
                                {currentSurah?.id === s.id && isPlaying ? <Pause className="size-6" /> : <Play className="size-6 ml-1" />}
                              </Button>
                              <Button variant="ghost" onClick={() => setReadingSurah(s)} className="size-14 rounded-[1.25rem] border border-white/10 text-indigo-400">
                                <BookOpen className="size-6" />
                              </Button>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">{s.sizeMB} MB</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}
            </TabsContent>
          )}

          {activeTab === 'azkar' && (
            <TabsContent key="azkar" value="azkar" className="space-y-12 focus-visible:ring-0">
              {selectedCategory ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                  <header className="p-6 glass border-white/5 rounded-[2rem] flex items-center justify-between flex-row-reverse">
                    <div className="flex items-center gap-4 flex-row-reverse">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)} className="rounded-full text-white">
                        <ArrowLeft className="size-5 rotate-180" />
                      </Button>
                      <h2 dir="auto" className="text-xl font-bold text-white">{selectedCategory.title}</h2>
                    </div>
                  </header>
                  <div className="space-y-6 max-w-4xl mx-auto w-full">
                    {selectedCategory.items.map((item) => (
                      <Card key={item.id} className={cn("glass border-white/5 rounded-[2.5rem] transition-all", (counts[item.id] ?? item.count) === 0 && "opacity-50 grayscale")}>
                        <CardContent className="p-8 space-y-6 text-right">
                          <p dir="auto" className="text-2xl leading-relaxed text-right font-serif text-slate-100 font-medium">{item.text}</p>
                          <div className="flex items-center justify-between pt-6 border-t border-white/5 flex-row-reverse">
                            <p className="text-xs text-muted-foreground italic">{item.reference}</p>
                            <Button onClick={() => handleCount(item)} disabled={(counts[item.id] ?? item.count) === 0} className={cn("h-20 w-20 rounded-[2rem] text-3xl font-black", (counts[item.id] ?? item.count) === 0 ? "bg-green-500/20 text-green-400" : "bg-primary text-white")}>
                              {(counts[item.id] ?? item.count) === 0 ? <Check className="size-8" /> : (counts[item.id] ?? item.count)}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="relative max-w-3xl mx-auto mb-12">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
                    <Input dir="auto" placeholder="البحث في الأذكار..." className="w-full h-16 bg-white/5 border-white/10 rounded-[2rem] pr-16 pl-8 text-xl text-right shadow-2xl" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCategories.map((cat) => (
                      <Card key={cat.id} className="group glass border-white/5 rounded-[3rem] overflow-hidden hover:border-primary/40 transition-all cursor-pointer shadow-2xl" onClick={() => setSelectedCategory(cat)}>
                        <div className="p-10 text-right">
                          <div className="size-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 mb-8 group-hover:bg-primary transition-all">
                            {cat.icon === 'Sun' ? <Sun className="size-10 text-primary group-hover:text-white" /> : <Moon className="size-10 text-primary group-hover:text-white" />}
                          </div>
                          <h3 className="text-3xl font-bold text-white mb-3">{cat.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed mb-8">{cat.description}</p>
                          <div className="flex items-center justify-end gap-2 text-primary font-bold text-sm">بدء الورد <ChevronRight className="size-4 rotate-180" /></div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}
            </TabsContent>
          )}

          {activeTab === 'names' && (
            <TabsContent key="names" value="names" className="focus-visible:ring-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {NAMES_OF_ALLAH.map((name) => (
                  <Card key={name.id} className="glass border-white/5 rounded-3xl hover:border-primary/40 transition-all group">
                    <CardContent className="p-6 flex flex-col items-center gap-4">
                      <div className="size-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl font-serif text-primary group-hover:scale-110 transition-transform">{name.name}</div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed text-center opacity-0 group-hover:opacity-100 transition-opacity">{name.meaning}</p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            </TabsContent>
          )}

          {activeTab === 'tasbih' && (
            <TabsContent key="tasbih" value="tasbih" className="focus-visible:ring-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto flex flex-col items-center gap-12 py-12 text-center">
                <div className="relative group">
                  <motion.div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 4, repeat: Infinity }} />
                  <button onClick={handleTasbih} className="relative size-80 bg-white/5 backdrop-blur-3xl border-4 border-white/10 rounded-full flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all">
                    <span className="text-9xl font-black text-white tabular-nums mb-2">{tasbihCount}</span>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">اضغط للتسبيح</p>
                  </button>
                  <Button onClick={() => setTasbihCount(0)} variant="ghost" size="icon" className="absolute -bottom-4 -right-4 size-14 bg-slate-900 border border-white/10 rounded-2xl hover:bg-red-500/10 hover:text-red-400 shadow-xl">
                    <RotateCcw className="size-6" />
                  </Button>
                </div>
              </motion.div>
            </TabsContent>
          )}

          {activeTab === 'storage' && (
            <TabsContent key="storage" value="storage" className="focus-visible:ring-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass border-white/5 rounded-[3rem] p-10 text-right">
                  <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 justify-end">تخصيص الذاكرة العصبية <Settings2 className="text-indigo-400" /></h3>
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <div className="flex justify-between flex-row-reverse items-center">
                        <Label className="text-sm font-bold text-white">الحد الأقصى للتخزين</Label>
                        <Badge className="bg-indigo-500/20 text-indigo-400 font-mono font-bold text-lg px-4 py-1">{storageLimitMB} MB</Badge>
                      </div>
                      <Slider value={[storageLimitMB]} min={50} max={2000} step={50} onValueChange={(v) => setStorageLimit(v[0])} className="py-4" />
                    </div>
                  </div>
                </Card>
                <Card className="glass border-white/5 rounded-[3rem] p-8 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-6 text-right">الملفات المحلية ({downloadedAssets.length})</h3>
                  <ScrollArea className="flex-1 max-h-[400px]">
                    <div className="space-y-3 pr-4">
                      {downloadedAssets.map(asset => {
                        const surah = QURAN_DATA.find(q => q.id === asset.id);
                        return (
                          <div key={asset.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between flex-row-reverse">
                            <p className="text-sm font-bold text-white">{surah?.name}</p>
                            <Button variant="ghost" size="icon" className="text-red-400/40 hover:text-red-400" onClick={() => deleteAsset(asset.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        );
                      })}
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
