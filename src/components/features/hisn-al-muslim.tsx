
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, BookOpen, ChevronRight, RotateCcw, Copy, Check, Star, Moon, Sun, Heart, Zap, Globe, ArrowLeft, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HISN_DATA, HisnCategory, ZikrItem } from "@/lib/hisn-store";
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
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HisnCategory | null>(null);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  // تصفية الفئات بناءً على البحث
  const filteredCategories = useMemo(() => {
    if (!search) return HISN_DATA;
    return HISN_DATA.filter(cat => 
      cat.title.includes(search) || 
      cat.description.includes(search) ||
      cat.items.some(item => item.text.includes(search))
    );
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

  const handleReset = (id: number, originalCount: number) => {
    setCounts(prev => ({ ...prev, [id]: originalCount }));
    setCompletedItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ", description: "تم نسخ النص إلى الحافظة بنجاح." });
  };

  // حساب التقدم للفئة المختارة
  const categoryProgress = useMemo(() => {
    if (!selectedCategory) return 0;
    const completed = selectedCategory.items.filter(item => completedItems.has(item.id)).length;
    return Math.round((completed / selectedCategory.items.length) * 100);
  }, [selectedCategory, completedItems]);

  if (selectedCategory) {
    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500">
        <header className="p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)} className="rounded-full hover:bg-white/5 text-white">
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h2 dir="auto" className="text-2xl font-bold text-white text-right">{selectedCategory.title}</h2>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{selectedCategory.items.length} أذكار</span>
                  <div className="size-1 rounded-full bg-indigo-500" />
                  <span className="text-[10px] text-primary font-bold uppercase">{categoryProgress}% مكتمل</span>
                </div>
              </div>
            </div>
            <div className="w-32 hidden sm:block">
              <Progress value={categoryProgress} className="h-1.5 bg-white/5" />
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6 pb-24">
            {selectedCategory.items.map((item) => {
              const currentCount = counts[item.id] ?? item.count;
              const isFinished = currentCount === 0;

              return (
                <Card 
                  key={item.id} 
                  className={cn(
                    "glass border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 group",
                    isFinished ? "opacity-60 grayscale-[0.5] scale-[0.98]" : "hover:border-primary/30 shadow-2xl"
                  )}
                >
                  <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-start gap-4">
                       <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="size-9 rounded-xl hover:bg-white/5 text-muted-foreground" onClick={() => copyToClipboard(item.text)}>
                            <Copy className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-9 rounded-xl hover:bg-white/5 text-muted-foreground" onClick={() => handleReset(item.id, item.count)}>
                            <RotateCcw className="size-4" />
                          </Button>
                       </div>
                       <Badge variant="outline" className="border-white/10 text-[10px] opacity-50 font-mono">ID: {item.id.toString().padStart(3, '0')}</Badge>
                    </div>

                    <p dir="auto" className="text-xl md:text-2xl leading-relaxed text-right font-serif text-slate-100 selection:bg-primary/30">
                      {item.text}
                    </p>
                    
                    {item.description && (
                      <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10"><Sparkles className="size-4" /></div>
                        <p dir="auto" className="text-sm text-indigo-300/90 text-right italic leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                      <div className="text-right">
                        {item.reference && (
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.1em] mb-1">
                            {item.reference}
                          </p>
                        )}
                        <p className="text-[9px] text-primary font-bold uppercase tracking-widest">Nexus Faith Protocol v4.2</p>
                      </div>

                      <Button
                        onClick={() => handleCount(item)}
                        disabled={isFinished}
                        className={cn(
                          "h-20 px-12 rounded-3xl font-black text-3xl transition-all duration-300 shadow-2xl relative overflow-hidden group/btn",
                          isFinished 
                            ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                            : "bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/20"
                        )}
                      >
                        <span className="relative z-10">{isFinished ? <Check className="size-10 stroke-[3]" /> : currentCount}</span>
                        {!isFinished && <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />}
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8 text-right">
        <div className="order-2 md:order-1 flex-1">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-4 py-1 uppercase tracking-widest font-bold text-[10px]">Soul Synchronization</Badge>
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            حصن المسلم
            <BookOpen className="text-primary size-10" />
          </h2>
          <p className="text-muted-foreground mt-4 text-xl leading-relaxed">عقدة الإيمان في نظام Nexus؛ مزامنة روحية وأذكار يومية بأحدث تقنيات العرض.</p>
        </div>
      </div>

      <div className="relative mb-16 max-w-3xl mx-auto">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
        <Input 
          dir="auto"
          placeholder="ابحث عن ذكر، دعاء، أو تصنيف..." 
          className="w-full h-16 bg-white/5 border-white/10 rounded-[2rem] pl-16 pr-8 text-xl text-right focus-visible:ring-primary focus-visible:border-primary transition-all shadow-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCategories.map((cat) => {
          const CategoryIcon = getIcon(cat.icon);
          return (
            <Card 
              key={cat.id} 
              className="group glass border-white/5 rounded-[3rem] overflow-hidden hover:border-primary/40 transition-all duration-500 cursor-pointer shadow-2xl relative"
              onClick={() => setSelectedCategory(cat)}
            >
              <div className="absolute top-0 right-0 size-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all" />
              <div className="p-10 text-right">
                <div className="size-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 mb-8 group-hover:bg-primary group-hover:scale-110 transition-all duration-500 shadow-xl group-hover:shadow-primary/20">
                  <CategoryIcon className="size-10 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 dir="auto" className="text-3xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{cat.title}</h3>
                <p dir="auto" className="text-muted-foreground text-sm leading-relaxed mb-8">{cat.description}</p>
                
                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Star className="size-3 text-amber-400 fill-amber-400 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Neural Faith</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    بدء الورد <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform rotate-180" />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-20 p-12 glass rounded-[3.5rem] border-white/5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <h3 className="text-2xl font-bold text-white mb-4 relative z-10">﴿أَلا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾</h3>
        <p className="text-muted-foreground text-sm relative z-10">تم تطوير هذا القسم ليكون رفيقك الدائم في طريق الطمأنينة.</p>
      </div>
    </div>
  );
}
