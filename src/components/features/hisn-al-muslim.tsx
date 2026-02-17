
"use client";

/**
 * @fileOverview واجهة حصن المسلم - تصميم عصبي مع تحسينات القراءة والعد التفاعلي.
 */

import React, { useState, useMemo } from "react";
import { Search, BookOpen, ChevronRight, RotateCcw, Copy, Check, Star, Moon, Sun, Heart, Bed, HandsPraying, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { HISN_DATA, HisnCategory, ZikrItem } from "@/lib/hisn-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CategoryIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case 'sun': return <Sun className={className} />;
    case 'moon': return <Moon className={className} />;
    case 'sleep': return <Bed className={className} />;
    case 'prayer': return <HandsPraying className={className} />;
    default: return <Heart className={className} />;
  }
};

export function HisnAlMuslim() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HisnCategory | null>(null);
  const [counts, setCounts] = useState<Record<number, number>>({});

  const filteredCategories = useMemo(() => {
    if (!search) return HISN_DATA;
    return HISN_DATA.filter(cat => 
      cat.title.includes(search) || 
      cat.items.some(item => item.text.includes(search))
    );
  }, [search]);

  const handleCount = (item: ZikrItem) => {
    const current = counts[item.id] ?? item.count;
    if (current > 0) {
      setCounts(prev => ({ ...prev, [item.id]: current - 1 }));
      if (current === 1) {
        if ('vibrate' in navigator) navigator.vibrate(50);
        toast({ title: "اكتمل الذكر", description: "بارك الله فيك." });
      }
    }
  };

  const handleReset = (id: number, originalCount: number) => {
    setCounts(prev => ({ ...prev, [id]: originalCount }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ", description: "تم نسخ النص إلى الحافظة." });
  };

  if (selectedCategory) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 bg-slate-950/20">
        <header className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)} className="rounded-full hover:bg-white/5">
                <ChevronRight className="rotate-180" />
              </Button>
              <h2 dir="auto" className="text-2xl font-bold text-white text-right">{selectedCategory.title}</h2>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30 h-7 px-4">
              {selectedCategory.items.length} أذكار
            </Badge>
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
                    "glass border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-2xl",
                    isFinished ? "opacity-40 scale-[0.98] grayscale" : "hover:border-primary/30"
                  )}
                >
                  <CardContent className="p-8 space-y-6">
                    <p dir="auto" className="text-xl md:text-2xl leading-[1.8] text-right font-serif text-slate-100 selection:bg-primary/30">
                      {item.text}
                    </p>
                    
                    {item.description && (
                      <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 size-1 bg-primary/20" />
                        <p dir="auto" className="text-sm text-primary/80 text-right italic leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-11 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                          onClick={() => copyToClipboard(item.text)}
                          title="نسخ الذكر"
                        >
                          <Copy className="size-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-11 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                          onClick={() => handleReset(item.id, item.count)}
                          title="إعادة التعيين"
                        >
                          <RotateCcw className="size-5" />
                        </Button>
                        {item.reference && (
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            {item.reference}
                          </span>
                        )}
                      </div>

                      <Button
                        onClick={() => handleCount(item)}
                        disabled={isFinished}
                        className={cn(
                          "h-20 min-w-32 px-10 rounded-3xl font-black text-3xl transition-all shadow-xl active:scale-90",
                          isFinished 
                            ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                            : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                        )}
                      >
                        {isFinished ? <Check className="size-10 stroke-[4px]" /> : currentCount}
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-6">
        <div>
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4">
            حصن المسلم
            <Badge variant="outline" className="text-[10px] h-6 border-primary/30 text-primary uppercase tracking-[0.2em] px-3">Faith Node v1.0</Badge>
          </h2>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl">مزامنة روحية يومية من خلال قاعدة بيانات حصن المسلم المدمجة في نظام Nexus العصبي.</p>
        </div>
        <div className="size-16 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shadow-2xl animate-pulse">
          <Sparkles className="size-8 text-primary" />
        </div>
      </div>

      <div className="relative mb-16 group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          dir="auto"
          placeholder="ابحث عن ذكر، دعاء، أو كلمة..." 
          className="w-full h-20 bg-white/5 border-white/10 rounded-[2rem] pl-16 pr-10 text-2xl text-right focus-visible:ring-primary focus-visible:bg-white/10 transition-all shadow-2xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
        {filteredCategories.map((cat) => (
          <Card 
            key={cat.id} 
            className="group glass border-white/5 rounded-[2.5rem] overflow-hidden hover:border-primary/40 transition-all cursor-pointer shadow-2xl flex flex-col"
            onClick={() => setSelectedCategory(cat)}
          >
            <div className="p-10 flex flex-col items-center text-center flex-1">
              <div className="size-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 mb-8 group-hover:bg-primary transition-all duration-500 shadow-xl group-hover:shadow-primary/30 group-hover:scale-110">
                <CategoryIcon type={cat.iconType} className="size-10 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 dir="auto" className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{cat.title}</h3>
              <p dir="auto" className="text-muted-foreground text-sm leading-relaxed">يتضمن {cat.items.length} أذكار مختارة ومحققة.</p>
              
              <div className="mt-10 w-full pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="size-3 text-amber-400 fill-amber-400" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Verified Node</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all">
                  ابدأ الآن <ChevronRight className="size-4" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
