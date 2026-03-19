'use client';

import React, { useState, useMemo } from "react";
import { 
  Search, Play, Pause, BookOpen, Heart, 
  Loader2, Music, ShieldCheck, Edit3, Headphones, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { useQuranStore, QuranSurah } from "@/lib/quran-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { useWirdStore, WirdType, WirdAmountType } from "@/lib/wird-store";
import { SurahReader } from "./surah-reader";
import { WirdSessionModal } from "./wird-session-modal";
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
  const { enabledTypes, currentSurahId, todayCompletedTypes, lastCompletedDate, amountType, verseRange, juzNumber, setWirdConfig, setWirdAmount } = useWirdStore();
  
  const [isWirdSessionOpen, setIsWirdSessionOpen] = useState(false);
  const [isWirdSettingsOpen, setIsWirdSettingsOpen] = useState(false);
  const [tempWirdConfig, setTempWirdConfig] = useState<WirdType[]>(enabledTypes);
  const [tempAmountType, setTempAmountType] = useState<WirdAmountType>(amountType);
  const [tempRange, setTempRange] = useState(verseRange);
  const [tempJuz, setTempJuz] = useState(juzNumber);

  // Sync temp config when modal opens
  React.useEffect(() => {
    if (isWirdSettingsOpen) {
      setTempWirdConfig(enabledTypes);
      setTempAmountType(amountType);
      setTempRange(verseRange);
      setTempJuz(juzNumber);
    }
  }, [isWirdSettingsOpen, enabledTypes, amountType, verseRange, juzNumber]);

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

  const saveWirdSettings = () => {
    if (tempWirdConfig.length === 0) {
      toast({ title: "تنبيه", description: "يجب اختيار خطوة واحدة على الأقل للورد", variant: "destructive" });
      return;
    }
    
    if (tempAmountType === 'verses' && (tempRange.start < 1 || tempRange.end < tempRange.start)) {
      toast({ title: "خطأ في النطاق", description: "يرجى التأكد من بداية ونهاية الآيات بشكل صحيح", variant: "destructive" });
      return;
    }

    setWirdConfig(tempWirdConfig);
    setWirdAmount(tempAmountType, tempRange, tempJuz);
    setIsWirdSettingsOpen(false);
    toast({ title: "تم الحفظ", description: "تم تحديث خطة الورد اليومي بنجاح." });
  };

  const todayString = new Date().toISOString().split('T')[0];
  const isWirdDoneToday = lastCompletedDate === todayString;
  const wirdProgress = isWirdDoneToday ? 100 : (enabledTypes.length ? Math.round((todayCompletedTypes.length / enabledTypes.length) * 100) : 0);
  const targetSurah = surahs.find(s => s.id === currentSurahId) || surahs[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Daily Wird Dashboard */}
      <Card className="glass border-indigo-500/20 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-500/10 to-transparent relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <CardContent className="p-8 pb-10 flex flex-col md:flex-row items-center justify-between gap-8 flex-row-reverse relative z-10">
          <div className="text-right flex-1">
            <div className="flex items-center gap-3 justify-end mb-2 flex-row-reverse">
              <Badge className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30">الورد اليومي</Badge>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2 flex-row-reverse">
                <BookOpen className="size-6 text-indigo-400" />
                {amountType === 'juz' ? `الجزء ${juzNumber}` : `سورة ${targetSurah?.name || "الفاتحة"}`}
              </h2>
            </div>
            <p className="text-muted-foreground text-lg mb-6 max-w-lg ml-auto">
              {isWirdDoneToday 
                ? "تقبل الله طاعتك! لقد أكملت وردك بنجاح اليوم." 
                : "برمج عقلك وروحك بالقرآن اليوم. ابدأ وردك المخصص الآن لتسجيل إنجازك اليومي."}
            </p>
            
            <div className="flex items-center gap-4 justify-end">
              <span className="text-sm font-bold text-indigo-400">{wirdProgress}%</span>
              <Progress value={wirdProgress} className="w-1/2 h-2.5 bg-white/5" />
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px]">
            <Button 
              onClick={() => setIsWirdSessionOpen(true)}
              className={cn(
                "rounded-xl h-14 text-lg font-bold transition-all shadow-xl",
                isWirdDoneToday 
                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/20" 
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              )}
            >
              {isWirdDoneToday ? "مراجعة إنجاز اليوم" : "ابدأ الورد الآن"}
            </Button>
            
            <Dialog open={isWirdSettingsOpen} onOpenChange={setIsWirdSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl h-12 border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white">
                  إعدادات الورد وتخصيص الخطوات
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-2xl border-white/10 rounded-[2rem] p-8">
                <div className="text-right mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">تخصيص الورد اليومي</h3>
                  <p className="text-muted-foreground">اختر ورتب الخطوات التي ترغب في تطبيقها يومياً على السورة المستهدفة.</p>
                </div>
                
                <div className="space-y-3 mb-8">
                  {/* Reorderable toggles */}
                  {Array.from(new Set([...tempWirdConfig, ...(['read', 'write', 'listen'] as WirdType[])])).map((typeId, index) => {
                    const typeConfig = {
                      read: { id: 'read' as WirdType, label: 'قراءة السورة', icon: <BookOpen className="size-5" /> },
                      write: { id: 'write' as WirdType, label: 'كتابة (اختبار حفظ)', icon: <Edit3 className="size-5" /> },
                      listen: { id: 'listen' as WirdType, label: 'استماع للتلاوة', icon: <Headphones className="size-5" /> }
                    }[typeId]!;
                    
                    const isActive = tempWirdConfig.includes(typeId);
                    
                    return (
                      <div 
                        key={typeId} 
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border transition-all flex-row-reverse group",
                          isActive ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        <div 
                          className="flex items-center gap-3 flex-row-reverse text-lg font-bold cursor-pointer flex-1"
                          onClick={() => {
                            if (isActive) setTempWirdConfig(prev => prev.filter(t => t !== typeId));
                            else setTempWirdConfig(prev => [...prev, typeId]);
                          }}
                        >
                          {typeConfig.icon}
                          {typeConfig.label}
                        </div>
                        
                        <div className="flex items-center gap-4">
                           {/* Up/Down controls for active items */}
                           <div className={cn("flex flex-col opacity-0 transition-opacity", isActive && "opacity-100 group-hover:opacity-100")}>
                             <button 
                               onClick={() => {
                                 if (index > 0) {
                                   const newArr = [...tempWirdConfig];
                                   if (!newArr.includes(typeId)) return;
                                   const curIdx = newArr.indexOf(typeId);
                                   if (curIdx > 0) {
                                      [newArr[curIdx - 1], newArr[curIdx]] = [newArr[curIdx], newArr[curIdx - 1]];
                                      setTempWirdConfig(newArr);
                                   }
                                 }
                               }}
                               className="text-muted-foreground hover:text-white pb-1"
                             >▲</button>
                             <button
                               onClick={() => {
                                 const newArr = [...tempWirdConfig];
                                 if (!newArr.includes(typeId)) return;
                                 const curIdx = newArr.indexOf(typeId);
                                 if (curIdx < newArr.length - 1) {
                                    [newArr[curIdx], newArr[curIdx + 1]] = [newArr[curIdx + 1], newArr[curIdx]];
                                    setTempWirdConfig(newArr);
                                 }
                               }}
                               className="text-muted-foreground hover:text-white"
                             >▼</button>
                           </div>
                           <div 
                             onClick={() => {
                               if (isActive) setTempWirdConfig(prev => prev.filter(t => t !== typeId));
                               else setTempWirdConfig(prev => [...prev, typeId]);
                             }}
                             className={cn("size-6 cursor-pointer rounded-full border-2 flex items-center justify-center", isActive ? "border-indigo-500 bg-indigo-500" : "border-white/20")}
                           >
                            {isActive && <CheckCircle2 className="size-4 text-white" />}
                           </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-white/5 pt-6 mb-8 text-right">
                   <h4 className="text-lg font-bold text-white mb-4">كمية الورد اليومي</h4>
                   <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-4 flex-row-reverse">
                      <button 
                        onClick={() => setTempAmountType('surah')}
                        className={cn("flex-1 py-2 rounded-lg text-sm transition-all", tempAmountType === 'surah' ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-white")}
                      >سورة كاملة</button>
                      <button 
                        onClick={() => setTempAmountType('juz')}
                        className={cn("flex-1 py-2 rounded-lg text-sm transition-all", tempAmountType === 'juz' ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-white")}
                      >جزء كامل</button>
                      <button 
                        onClick={() => setTempAmountType('verses')}
                        className={cn("flex-1 py-2 rounded-lg text-sm transition-all", tempAmountType === 'verses' ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-white")}
                      >آيات محددة</button>
                   </div>
                   
                   {tempAmountType === 'verses' && (
                     <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">إلى الآية</label>
                          <Input 
                            type="number" 
                            value={tempRange.end} 
                            onChange={(e) => setTempRange(prev => ({ ...prev, end: parseInt(e.target.value) || 0 }))}
                            className="bg-white/5 border-white/10 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">من الآية</label>
                          <Input 
                            type="number" 
                            value={tempRange.start} 
                            onChange={(e) => setTempRange(prev => ({ ...prev, start: parseInt(e.target.value) || 0 }))}
                            className="bg-white/5 border-white/10 rounded-xl"
                          />
                        </div>
                     </div>
                   )}

                   {tempAmountType === 'juz' && (
                     <div className="animate-in slide-in-from-top-2">
                        <div className="space-y-2 text-right">
                          <label className="text-xs text-muted-foreground">اختر رقم الجزء (1-30)</label>
                          <Input 
                            type="number" 
                            min={1}
                            max={30}
                            value={tempJuz} 
                            onChange={(e) => setTempJuz(parseInt(e.target.value) || 1)}
                            className="bg-white/5 border-white/10 rounded-xl text-center"
                          />
                        </div>
                     </div>
                   )}
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsWirdSettingsOpen(false)} className="rounded-xl px-6 hover:bg-white/5">إلغاء</Button>
                  <Button onClick={saveWirdSettings} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-8">حفظ الإعدادات</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <WirdSessionModal isOpen={isWirdSessionOpen} onClose={() => setIsWirdSessionOpen(false)} />

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