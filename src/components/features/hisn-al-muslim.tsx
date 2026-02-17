
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, BookOpen, ChevronRight, RotateCcw, Copy, Check, Star, 
  Moon, Sun, Heart, Zap, Globe, ArrowLeft, Share2, Sparkles, 
  Fingerprint, Clock, Compass, Activity, ShieldCheck, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HISN_DATA, NAMES_OF_ALLAH, HisnCategory, ZikrItem } from "@/lib/hisn-store";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Sun': return Sun;
    case 'Moon': return Moon;
    case 'Heart': return Heart;
    case 'Zap': return Zap;
    case 'Globe': return Globe;
    default: return BookOpen;
  }
};

export function HisnAlMuslim() {
  const [activeTab, setActiveTab] = useState("azkar");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HisnCategory | null>(null);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  
  // Tasbih State
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihSession, setTasbihSession] = useState(0);

  const filteredCategories = useMemo(() => {
    if (!search) return HISN_DATA;
    return HISN_DATA.filter(cat => 
      cat.title.includes(search) || 
      cat.description.includes(search)
    );
  }, [search]);

  const filteredNames = useMemo(() => {
    if (!search) return NAMES_OF_ALLAH;
    return NAMES_OF_ALLAH.filter(n => n.name.includes(search) || n.meaning.includes(search));
  }, [search]);

  const handleCount = (item: ZikrItem) => {
    const current = counts[item.id] ?? item.count;
    if (current > 0) {
      const nextValue = current - 1;
      setCounts(prev => ({ ...prev, [item.id]: nextValue }));
      
      if (nextValue === 0) {
        setCompletedItems(prev => {
          const next = new Set(prev);
          next.add(item.id);
          return next;
        });
        if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
      } else {
        if ('vibrate' in navigator) navigator.vibrate(30);
      }
    }
  };

  const handleTasbih = () => {
    setTasbihCount(prev => prev + 1);
    setTasbihSession(prev => prev + 1);
    if ('vibrate' in navigator) navigator.vibrate(40);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ", description: "تم نسخ النص بنجاح." });
  };

  const categoryProgress = useMemo(() => {
    if (!selectedCategory) return 0;
    const completed = selectedCategory.items.filter(item => completedItems.has(item.id)).length;
    return Math.round((completed / selectedCategory.items.length) * 100);
  }, [selectedCategory, completedItems]);

  if (selectedCategory) {
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500">
        <header className="p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)} className="rounded-full text-white">
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h2 dir="auto" className="text-2xl font-bold text-white text-right">{selectedCategory.title}</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest text-right">{categoryProgress}% مكتمل</p>
            </div>
          </div>
          <div className="w-32">
            <Progress value={categoryProgress} className="h-1.5 bg-white/5" />
          </div>
        </header>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6 pb-24">
            {selectedCategory.items.map((item) => {
              const currentCount = counts[item.id] ?? item.count;
              const isFinished = currentCount === 0;

              return (
                <Card key={item.id} className={cn("glass border-white/5 rounded-[2.5rem] transition-all duration-500", isFinished && "opacity-50 grayscale-[0.5]")}>
                  <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                       <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.text)}><Copy className="size-4 text-muted-foreground" /></Button>
                       <Badge variant="outline" className="border-white/10 opacity-50">ID: {item.id}</Badge>
                    </div>
                    <p dir="auto" className="text-xl leading-relaxed text-right font-serif text-slate-100">{item.text}</p>
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/5 gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{item.reference || "ذكر مأثور"}</p>
                      </div>
                      <Button onClick={() => handleCount(item)} disabled={isFinished} className={cn("h-20 px-12 rounded-3xl font-black text-3xl transition-all", isFinished ? "bg-green-500/20 text-green-400" : "bg-primary text-white shadow-xl shadow-primary/20")}>
                        {isFinished ? <Check className="size-10" /> : currentCount}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="text-right mb-12">
        <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-4 py-1 uppercase tracking-widest font-bold text-[10px]">Neural Faith Hub</Badge>
        <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
          عقدة الإيمان
          <Sparkles className="text-primary size-10" />
        </h2>
        <p className="text-muted-foreground mt-4 text-xl">مركز العبادة الذكي: أذكار، تسبيح، ومعرفة روحية.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-12 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="azkar" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none">الأذكار</TabsTrigger>
          <TabsTrigger value="tasbih" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none">المسبحة</TabsTrigger>
          <TabsTrigger value="names" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none">أسماء الله</TabsTrigger>
          <TabsTrigger value="times" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary flex-1 sm:flex-none">مواقيت الصلاة</TabsTrigger>
        </TabsList>

        <TabsContent value="azkar" className="space-y-12">
          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
            <Input dir="auto" placeholder="ابحث عن تصنيف..." className="w-full h-16 bg-white/5 border-white/10 rounded-[2rem] pl-16 pr-8 text-xl text-right focus-visible:ring-primary shadow-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((cat) => {
              const CategoryIcon = getIcon(cat.icon);
              return (
                <Card key={cat.id} className="group glass border-white/5 rounded-[3rem] overflow-hidden hover:border-primary/40 transition-all duration-500 cursor-pointer shadow-2xl relative" onClick={() => setSelectedCategory(cat)}>
                  <div className="absolute top-0 right-0 size-32 bg-primary/5 blur-3xl -mr-16 -mt-16" />
                  <div className="p-10 text-right">
                    <div className="size-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 mb-8 group-hover:bg-primary group-hover:scale-110 transition-all duration-500 shadow-xl group-hover:shadow-primary/20">
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
              <button onClick={handleTasbih} className="relative size-72 bg-white/5 backdrop-blur-3xl border-2 border-white/10 rounded-full flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-transform group-hover:border-primary/50">
                <span className="text-[10px] uppercase font-black tracking-[0.3em] text-primary mb-2">Neural Counter</span>
                <span className="text-8xl font-black text-white tracking-tighter tabular-nums">{tasbihSession}</span>
                <p className="text-muted-foreground mt-4 text-xs font-bold uppercase">اضغط للتسبيح</p>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
              <Card className="glass border-white/5 rounded-[2rem] p-6 text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">المجموع الكلي</p>
                <p className="text-3xl font-black text-white tabular-nums">{tasbihCount}</p>
              </Card>
              <Button variant="outline" className="h-full rounded-[2rem] border-white/5 text-red-400 hover:bg-red-500/10 gap-2" onClick={() => setTasbihSession(0)}>
                <RotateCcw className="size-5" /> تصفير الجلسة
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="names" className="animate-in fade-in duration-500">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredNames.map((n) => (
              <Card key={n.id} className="glass border-white/5 rounded-3xl p-6 text-center group hover:border-primary/40 transition-all cursor-pointer">
                <h3 dir="auto" className="text-3xl font-black text-white mb-2 group-hover:text-primary transition-colors">{n.name}</h3>
                <p dir="auto" className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{n.meaning}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="times" className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass border-white/5 rounded-[3rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 size-64 bg-indigo-500/10 blur-[80px] -mr-32 -mt-32" />
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between flex-row-reverse">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">مواقيت الصلاة <Clock className="text-primary" /></h3>
                  <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">Neural Sync: ON</Badge>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: "الفجر", time: "04:52", active: false },
                    { label: "الظهر", time: "12:15", active: false },
                    { label: "العصر", time: "15:40", active: true },
                    { label: "المغرب", time: "18:22", active: false },
                    { label: "العشاء", time: "19:45", active: false },
                  ].map((p) => (
                    <div key={p.label} className={cn("flex items-center justify-between p-5 rounded-2xl border transition-all", p.active ? "bg-primary/10 border-primary shadow-lg" : "bg-white/5 border-white/5 opacity-60")}>
                      <span className="text-xl font-bold tabular-nums">{p.time}</span>
                      <span dir="auto" className="font-bold text-lg">{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="glass border-white/5 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <Compass className="size-32 text-primary mb-8 animate-spin-slow" />
              <h3 className="text-2xl font-bold text-white mb-2">اتجاه القبلة</h3>
              <p className="text-muted-foreground max-w-[200px]">تم ضبط الاتجاه بناءً على إحداثيات العقدة الحالية.</p>
              <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Precision: 99.9%</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-20 p-12 glass rounded-[3.5rem] border-white/5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <h3 className="text-2xl font-bold text-white mb-4 relative z-10">﴿أَلا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾</h3>
        <p className="text-muted-foreground text-sm relative z-10">تم تطوير "عقدة الإيمان" لتكون رفيقك الدائم في رحلة الصفاء الروحي.</p>
      </div>
    </div>
  );
}
