
"use client";

import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * [STABILITY_ANCHOR: TASBIH_VIEW_COMPONENT]
 * مكون مستقل للمسبحة الإلكترونية مع دعم الاهتزاز.
 */
export function TasbihView() {
  const { toast } = useToast();
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihTarget, setTasbihTarget] = useState(33);

  const handleTasbih = () => {
    setTasbihCount(prev => prev + 1);
    if ('vibrate' in navigator) navigator.vibrate(20);
    if ((tasbihCount + 1) % tasbihTarget === 0) {
      toast({ title: "اكتملت الدورة العصبية", description: `لقد أتممت ${tasbihTarget} تسبيحة بنجاح.` });
    }
  };

  return (
    <div className="flex flex-col items-center py-12 outline-none">
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
    </div>
  );
}
