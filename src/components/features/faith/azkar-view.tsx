
"use client";

import React, { useState } from "react";
import { Sun, Moon, Globe, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HISN_DATA, HisnCategory } from "@/lib/hisn-store";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: AZKAR_VIEW_COMPONENT]
 * مكون مستقل لعرض الأذكار وتتبع العدادات.
 */
export function AzkarView() {
  const [selectedCategory, setSelectedCategory] = useState<HisnCategory | null>(null);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [fontSize, setFontSize] = useState(24);

  if (!selectedCategory) {
    return (
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
    );
  }

  return (
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
  );
}
