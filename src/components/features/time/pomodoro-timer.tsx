'use client';

import React, { useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Zap, Brain, Coffee, Coffee as LongBreak } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTimeStore, PomodoroMode } from "@/lib/time-store";
import { cn } from "@/lib/utils";

export function PomodoroTimer() {
  const { timeLeft, isRunning, pomodoroMode, tick, toggleTimer, resetTimer, setPomodoroMode } = useTimeStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(tick, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, tick]);

  // إرسال اهتمام عند انتهاء الوقت
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      alert("انتهت الجلسة! خذ قسطاً من الراحة.");
    }
  }, [timeLeft, isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (pomodoroMode === 'focus' ? 25*60 : pomodoroMode === 'short' ? 5*60 : 15*60)) * 100;

  return (
    <Card className="glass border-white/5 rounded-[3rem] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 size-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
      
      <div className="bg-white/5 p-1 rounded-2xl flex gap-1 mb-12 relative z-10">
        {(['focus', 'short', 'long'] as const).map(mode => (
          <Button
            key={mode}
            variant="ghost"
            onClick={() => setPomodoroMode(mode)}
            className={cn(
              "rounded-xl px-6 h-10 font-bold text-xs transition-all",
              pomodoroMode === mode ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            {mode === 'focus' ? 'تركيز' : mode === 'short' ? 'استراحة قصيرة' : 'استراحة طويلة'}
          </Button>
        ))}
      </div>

      <div className="relative size-72 flex items-center justify-center mb-12 group">
        <svg className="size-full -rotate-90">
          <circle cx="144" cy="144" r="130" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
          <circle 
            cx="144" cy="144" r="130" 
            stroke="currentColor" strokeWidth="8" fill="transparent" 
            className="text-primary transition-all duration-1000"
            strokeDasharray={816}
            strokeDashoffset={816 - (816 * progress) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-7xl font-black text-white tracking-tighter font-mono">{formatTime(timeLeft)}</span>
          <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase mt-2 tracking-widest">
            {isRunning ? 'Neural Focus Active' : 'Paused'}
          </Badge>
        </div>
      </div>

      <div className="flex gap-4 relative z-10 w-full max-w-xs">
        <Button 
          onClick={toggleTimer}
          className={cn(
            "flex-1 h-16 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95",
            isRunning ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-primary hover:bg-primary/90 shadow-primary/20"
          )}
        >
          {isRunning ? <Pause className="mr-2 size-6 fill-current" /> : <Play className="mr-2 size-6 fill-current" />}
          {isRunning ? 'إيقاف مؤقت' : 'بدء التركيز'}
        </Button>
        <Button 
          variant="outline"
          onClick={resetTimer}
          className="size-16 rounded-2xl border-white/10 hover:bg-white/5"
        >
          <RotateCcw className="size-6 text-muted-foreground" />
        </Button>
      </div>

      <div className="mt-12 flex items-center gap-3 text-indigo-400 opacity-40">
        <Zap className="size-4 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Protocol v1.0 • Neural Integration</span>
      </div>
    </Card>
  );
}
