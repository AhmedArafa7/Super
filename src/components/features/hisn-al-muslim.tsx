
"use client";

import React, { useState, useMemo } from "react";
import { Search, BookOpen, ChevronRight, RotateCcw, Copy, Check, Star, Moon, Sun, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { HISN_DATA, HisnCategory, ZikrItem } from "@/lib/hisn-store";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export function HisnAlMuslim() {
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
      }
    }
  };

  const handleReset = (id: number, originalCount: number) => {
    setCounts(prev => ({ ...prev, [id]: originalCount }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ", description: "تم نسخ الذكر إلى الحافظة." });
  };

  if (selectedCategory) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500">
        <header className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)} className="rounded-full">
                <ChevronRight className="rotate-180" />
              </Button>
              <h2 dir="auto" className="text-2xl font-bold text-white text-right">{selectedCategory.title}</h2>
            </div>
            <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
              {selectedCategory.items.length} أذكار
            </Badge>
          </div>
        </header>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {selectedCategory.items.map((item) => {
              const currentCount = counts[item.id] ?? item.count;
              const isFinished = currentCount === 0;

              return (
                <Card 
                  key={item.id} 
                  className={cn(
                    "glass border-white/5 rounded-[2rem] overflow-hidden transition-all duration-500",
                    isFinished ? "opacity-50 scale-[0.98]" : "hover:border-indigo-500/30"
                  )}
                >
                  <CardContent className="p-8 space-y-6">
                    <p dir="auto" className="text-xl md:text-2xl leading-relaxed text-right font-serif text-slate-100">
                      {item.text}
                    </p>
                    
                    {item.description && (
                      <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                        <p dir="auto" className="text-xs text-indigo-300/80 text-right italic">
                          {item.description}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-10 rounded-xl hover:bg-white/5"
                          onClick={() => copyToClipboard(item.text)}
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-10 rounded-xl hover:bg-white/5"
                          onClick={() => handleReset(item.id, item.count)}
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                        {item.reference && (
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                            {item.reference}
                          </span>
                        )}
                      </div>

                      <Button
                        onClick={() => handleCount(item)}
                        disabled={isFinished}
                        className={cn(
                          "h-16 px-10 rounded-2xl font-black text-2xl transition-all shadow-xl",
                          isFinished 
                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                            : "bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/20"
                        )}
                      >
                        {isFinished ? <Check className="size-8" /> : currentCount}
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
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4">
            حصن المسلم
            <Badge variant="outline" className="text-[10px] h-5 border-indigo-500/30 text-indigo-400 uppercase tracking-[0.2em]">Faith Sync</Badge>
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">مزامنة روحية وأذكار يومية بنظام Nexus العصبي.</p>
        </div>
      </div>

      <div className="relative mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
        <Input 
          dir="auto"
          placeholder="ابحث عن ذكر أو دعاء..." 
          className="w-full h-16 bg-white/5 border-white/10 rounded-[1.5rem] pl-14 pr-8 text-xl text-right focus-visible:ring-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCategories.map((cat) => (
          <Card 
            key={cat.id} 
            className="group glass border-white/5 rounded-[2.5rem] overflow-hidden hover:border-primary/40 transition-all cursor-pointer shadow-2xl"
            onClick={() => setSelectedCategory(cat)}
          >
            <div className="p-8">
              <div className="size-16 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 mb-6 group-hover:bg-primary transition-all duration-500 shadow-xl group-hover:shadow-primary/20">
                {cat.id === 'morning' ? <Sun className="size-8 text-primary group-hover:text-white" /> : 
                 cat.id === 'evening' ? <Moon className="size-8 text-primary group-hover:text-white" /> : 
                 <Heart className="size-8 text-primary group-hover:text-white" />}
              </div>
              <h3 dir="auto" className="text-2xl font-bold text-white mb-2 text-right group-hover:text-primary transition-colors">{cat.title}</h3>
              <p dir="auto" className="text-muted-foreground text-sm text-right">يتضمن {cat.items.length} أذكار مختارة من السنة النبوية.</p>
              
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Star className="size-3 text-amber-400 fill-amber-400" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Premium Node</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  عرض الأذكار <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
