
"use client";

import React from "react";
import { Sparkles, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NAMES_OF_ALLAH } from "@/lib/hisn-store";

/**
 * [STABILITY_ANCHOR: NAMES_VIEW_COMPONENT]
 * مكون مستقل لعرض أسماء الله الحسنى ومعانيها.
 */
export function NamesView() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {NAMES_OF_ALLAH.map((item) => (
        <Card key={item.id} className="group glass border-white/5 rounded-[2.5rem] p-8 text-right hover:border-primary/40 transition-all duration-500 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 size-24 bg-primary/5 blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-all" />
          
          <div className="flex justify-between items-center mb-6 flex-row-reverse">
            <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-2xl shadow-inner border border-primary/10 group-hover:scale-110 transition-transform">
              {item.name}
            </div>
            <Badge variant="outline" className="border-white/5 text-[10px] opacity-40 font-mono">#{item.id}</Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-end text-indigo-400">
              <span className="text-[10px] uppercase font-bold tracking-widest">المعنى العصبي</span>
              <Info className="size-3" />
            </div>
            <p className="text-slate-300 leading-loose text-sm font-medium">
              {item.meaning}
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-end gap-2 text-primary font-bold text-[9px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all">
            <Sparkles className="size-3" /> تأمل في الصفة
          </div>
        </Card>
      ))}
    </div>
  );
}
