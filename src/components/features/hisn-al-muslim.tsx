
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

/**
 * @fileOverview [STABILITY_ANCHOR: FAITH_HUB_V2]
 * واجهة عقدة الإيمان - تدعم تشغيل القرآن عبر API والمزامنة الفيزيائية المحلية.
 */

export function HisnAlMuslim() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("quran");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HisnCategory | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihTarget, setTasbihTarget] = useState(33);

  const { surahs, currentSurah, isPlaying, isLoading, fetchSurahs, setCurrentSurah, setIsPlaying, downloadToLocal } = useQuranStore();
  const { cachedAssets, storageLimitMB, removeAsset, getTotalUsedSpace } = useGlobalStorage();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (surahs.length === 0) fetchSurahs();
  }, []);

  useEffect(() => {
    setSelectedCategory(null);
    setSearch("");
  }, [activeTab]);

  // [STABILITY_ANCHOR: AUDIO_CONTROL_PROTOCOL]
  // منطق التحكم الصارم في مشغل الصوت لضمان استجابة Pause/Play فوراً
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsPlaying(false);
    }

    const audio = audioRef.current;

    if (currentSurah) {
      if (audio.src !== currentSurah.url) {
        audio.src = currentSurah.url;
      }
      
      if (isPlaying) {
        audio.play().catch(e => {
          console.error("Audio Node Error:", e);
          setIsPlaying(false);
        });
      } else {
        audio.pause();
      }
    }

    return () => {
      // إيقاف الصوت عند مغادرة المكون لضمان عدم التداخل
      if (audio) audio.pause();
    };
  }, [isPlaying, currentSurah]);

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
    toast({ title: "مزامنة فيزيائية ناجحة", description: `سورة ${s.name} محفوظة الآن في ذاكرة العقدة المحلية.` });
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
      toast({ title: "اكتملت الدورة العصبية", description: `لقد أتممت ${tasbihTarget} تسبيحة بنجاح.` });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen animate-in fade-in duration-700 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse">
        <div className="text-right">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-4 py-1 uppercase font-bold text-[10px] tracking-widest">Neural Faith Hub</Badge>
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            عقدة الإيمان
            <Sparkles className="text-primary size-10" />
          </h2>
          <p className="text-muted-foreground mt-2 text-xl max-w-2xl text-right">تواصل روحي عميق عبر بروتوكولات المزامنة والـ API السيادية.</p>
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
                <Input dir="auto" placeholder="ابحث عن سورة بالاسم (مزامنة عصبية)..." className="w-full h-16 bg-white/5 border-white/10 rounded-[2rem] pr-16 pl-8 text-xl text-right shadow-2xl" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="size-12 animate-spin text-primary" />
                  <p className="text-muted-foreground animate-pulse font-bold text-right">جاري مزامنة السور من الـ API العالمي...</p>
                </div>
              ) : (
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
              )}
            </TabsContent>
          )}

          {activeTab === 'azkar' && (
            <TabsContent value="azkar" className="space-y-12 outline-none">
              {!selectedCategory ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {HISN_DATA.map((cat) => (
                    <Card key={cat.id} className="group glass border-white/5 rounded-[3rem] p-10 text-right hover:border-primary/40 transition-all duration-500 cursor-pointer shadow-2xl relative overflow-hidden" onClick={() => setSelectedCategory(cat)}>
                      <div className="absolute top-0 right-0 size-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all" />
                      <div className="size-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-all shadow-inner">
                        {cat.id === 'morning' ? <Sun className="size-10 text-amber-400" /> : cat.id === 'evening' ? <Moon className="size-10 text-indigo-400" /> : <Globe className="size-10 text-emerald-400" />}
                      </div>
                      <h3 className="text-3xl font-black text-white mb-3">{cat.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{cat.description}</p>
                      <div className="mt-8 flex items-center justify-end gap-2 text-primary font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                        فتح القسم <ArrowLeft className="size-3" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                  <Button variant="ghost" onClick={() => setSelectedCategory(null)} className="rounded-xl gap-2 text-indigo-400 hover:text-indigo-300 hover:bg-white/5 mb-4 flex-row-reverse">
                    <ArrowLeft className="size-4 rotate-180" /> العودة للأقسام
                  </Button>
                  <div className="space-y-6 pb-20">
                    {selectedCategory.items.map((item) => (
                      <Card key={item.id} className="glass border-white/5 rounded-[2.5rem] p-8 text-right space-y-6 shadow-2xl hover:border-primary/20 transition-all">
                        <p style={{ fontSize: `${fontSize}px` }} className="text-white leading-loose font-medium font-serif">{item.text}</p>
                        {item.description && <p className="text-xs text-indigo-300 bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 italic">"{item.description}"</p>}
                        <div className="flex items-center justify-between pt-6 border-t border-white/5 flex-row-reverse">
                          <div className="flex items-center gap-4 flex-row-reverse">
                            <Button 
                              onClick={() => {
                                const current = counts[item.id] || 0;
                                if (current < item.count) {
                                  setCounts({ ...counts, [item.id]: current + 1 });
                                  if ('vibrate' in navigator) navigator.vibrate(10);
                                }
                              }}
                              className={cn(
                                "h-14 px-8 rounded-2xl font-black text-xl transition-all shadow-xl",
                                (counts[item.id] || 0) >= item.count ? "bg-green-600 text-white" : "bg-primary"
                              )}
                            >
                              {(counts[item.id] || 0)} / {item.count}
                            </Button>
                            <Button variant="outline" size="icon" className="size-14 rounded-2xl border-white/10" onClick={() => setCounts({ ...counts, [item.id]: 0 })}>
                              <RotateCcw className="size-6 text-muted-foreground" />
                            </Button>
                          </div>
                          {item.reference && <Badge variant="outline" className="border-white/5 text-[10px] opacity-40 uppercase">{item.reference}</Badge>}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          )}

          {activeTab === 'tasbih' && (
            <TabsContent value="tasbih" className="flex flex-col items-center py-12 outline-none">
              <div className="relative size-80 flex items-center justify-center mb-16">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-[80px] animate-pulse" />
                <button 
                  onClick={handleTasbih}
                  className="relative size-64 bg-slate-900 border-4 border-primary/20 rounded-full flex flex-col items-center justify-center shadow-[0_0_100px_rgba(99,102,241,0.2)] active:scale-95 transition-all group"
                >
                  <span className="text-7xl font-black text-white tracking-tighter mb-2">{tasbihCount}</span>
                  <span className="text-[10px] uppercase font-bold text-primary tracking-[0.3em] group-hover:tracking-[0.5em] transition-all">سبّح الآن</span>
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-12">
                {[33, 100, 1000].map(val => (
                  <Button 
                    key={val}
                    variant={tasbihTarget === val ? 'default' : 'outline'}
                    className="rounded-xl h-12 font-bold border-white/5"
                    onClick={() => setTasbihTarget(val)}
                  >
                    {val}
                  </Button>
                ))}
              </div>
              
              <Button variant="ghost" onClick={() => setTasbihCount(0)} className="text-muted-foreground hover:text-white uppercase text-[10px] font-bold tracking-widest gap-2">
                <RotateCcw className="size-3" /> إعادة تصفير العداد
              </Button>
            </TabsContent>
          )}

          {activeTab === 'storage' && (
            <TabsContent value="storage" className="space-y-8 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="glass border-white/5 rounded-[3rem] p-10 space-y-8 text-right shadow-2xl">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3 justify-end">الحالة الفيزيائية للذاكرة <HardDrive className="text-indigo-400" /></h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <span className="text-sm font-bold text-white">{usedStorage.toFixed(1)} MB مستخدم</span>
                      <span className="text-xs text-muted-foreground">الإجمالي: {storageLimitMB} MB</span>
                    </div>
                    <Progress value={storagePercentage} className="h-2 bg-white/5" />
                  </div>
                  <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                    <p className="text-xs text-muted-foreground leading-relaxed">عند وصول الذاكرة للحد الأقصى، سيقوم النظام تلقائياً بمسح أقدم الأصول غير المفضلة لتوفير مساحة للعقد الجديدة.</p>
                  </div>
                </Card>

                <Card className="glass border-white/5 rounded-[3rem] p-10 space-y-6 shadow-2xl">
                  <h3 className="text-2xl font-bold text-white text-right">إعدادات النخاع المحلي</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <Label className="text-sm font-bold">حجم الخط في الأذكار</Label>
                      <div className="flex items-center gap-4 w-48">
                        <ZoomOut className="size-4 opacity-40" />
                        <Slider value={[fontSize]} min={16} max={42} step={1} onValueChange={([v]) => setFontSize(v)} />
                        <ZoomIn className="size-4 opacity-40" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-white/5 flex-row-reverse">
                      <div className="text-right">
                        <p className="text-sm font-bold">التنبيهات العصبية</p>
                        <p className="text-[10px] text-muted-foreground">إرسال إشعارات الأذكار والمزامنة</p>
                      </div>
                      <Badge variant="outline" className="text-green-400 border-green-500/20 bg-green-500/5 uppercase text-[8px] font-bold">نشط</Badge>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="glass border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 text-right">
                  <h3 className="text-xl font-bold text-white">الأصول المزامنة في الذاكرة الحية</h3>
                </div>
                <ScrollArea className="h-80">
                  <div className="divide-y divide-white/5">
                    {cachedAssets.length === 0 ? (
                      <div className="p-20 text-center opacity-30 flex flex-col items-center">
                        <Database className="size-12 mb-4" />
                        <p>لا توجد بيانات مخزنة حالياً في العقدة المحلية.</p>
                      </div>
                    ) : (
                      cachedAssets.map(asset => (
                        <div key={asset.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all flex-row-reverse">
                          <div className="flex items-center gap-4 flex-row-reverse">
                            <div className="size-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                              {asset.type === 'quran' ? <Music className="size-6" /> : <Database className="size-6" />}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-white text-sm">{asset.title}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{asset.type} • {asset.sizeMB} MB</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="size-10 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl" onClick={() => removeAsset(asset.id)}>
                            <Trash2 className="size-5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
