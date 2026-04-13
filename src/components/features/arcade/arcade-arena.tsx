
"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Maximize2, Minimize2, RefreshCw, Smartphone, Monitor, Info, Loader2, ArrowLeft, Clock, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { SaveBridgeManager } from "./save-bridge-manager";
import { useAuth } from "@/components/auth/auth-provider";

interface ArcadeArenaProps {
  game: {
    id: string;
    title: string;
    webUrl?: string;
    description: string;
  };
  onBack: () => void;
}

/**
 * [STABILITY_ANCHOR: ARCADE_ARENA_V1.0]
 * Premium game container with Zen Mode and Immersive controls.
 */
export function ArcadeArena({ game, onBack }: ArcadeArenaProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Real Performance Metrics
  const [fps, setFps] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // FPS Logic
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const calcFps = (time: number) => {
      frameCount.current++;
      if (time - lastTime.current >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / (time - lastTime.current)));
        frameCount.current = 0;
        lastTime.current = time;
      }
      requestRef.current = requestAnimationFrame(calcFps);
    };
    requestRef.current = requestAnimationFrame(calcFps);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, []);

  // Session Timer
  useEffect(() => {
    const timer = setInterval(() => setPlayTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPlayTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const reloadGame = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-700">
      {/* Immersive Header */}
      <header className="h-16 px-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between shrink-0 flex-row-reverse">
        <div className="flex items-center gap-4 flex-row-reverse">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl">
             <ArrowLeft className="size-5" />
          </Button>
          <div className="flex flex-col text-right">
             <h2 className="text-sm font-black text-white leading-none mb-1">{game.title}</h2>
             <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Arena Mode Active</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="hidden md:flex flex-row-reverse items-center gap-6 px-4 py-1.5 bg-white/5 rounded-full border border-white/5 ml-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 font-bold text-xs flex-row-reverse">
                    <Cloud className="size-4" /> مزامنة السحاب
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md bg-slate-950 border-white/10 p-0 overflow-hidden">
                   <SheetHeader className="p-8 border-b border-white/5 bg-slate-900/50">
                      <SheetTitle className="text-right text-xl font-black text-white">إدارة الحفظ السحابي</SheetTitle>
                   </SheetHeader>
                   <div className="p-8 h-full overflow-y-auto custom-scrollbar">
                      <SaveBridgeManager 
                        userId={user?.id || ""} 
                        gameId={game.id} 
                      />
                   </div>
                </SheetContent>
              </Sheet>
              
              <div className="flex items-center gap-2 flex-row-reverse">
                 <Monitor className="size-3 text-indigo-400" />
                 <span className="text-[8px] font-black text-white/40 uppercase">Keyboard Support</span>
              </div>
              <div className="flex items-center gap-2 flex-row-reverse">
                 <Info className="size-3 text-amber-400" />
                 <span className="text-[8px] font-black text-white/40 uppercase">Open Source License</span>
              </div>
           </div>

           <Button variant="ghost" size="icon" onClick={reloadGame} className="text-white/40 hover:text-white rounded-lg">
              <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
           </Button>
           <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white/40 hover:text-white rounded-lg">
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
           </Button>
        </div>
      </header>

      {/* Game Stage */}
      <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950">
             <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20 animate-pulse">
                <Loader2 className="size-10 text-primary animate-spin" />
             </div>
             <p className="font-black text-white/40 uppercase tracking-[0.3em] animate-pulse">Launching Nexus Arena</p>
          </div>
        )}
        
        {game.webUrl ? (
          <iframe
            ref={iframeRef}
            src={game.webUrl}
            className={cn(
              "w-full h-full border-none transition-opacity duration-1000",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => setIsLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={game.title}
          />
        ) : (
          <div className="text-center p-8">
             <Smartphone className="size-16 text-indigo-400 mb-6 mx-auto" />
             <h3 className="text-2xl font-black text-white mb-2">نسخة الويب غير متوفرة</h3>
             <p className="text-muted-foreground">هذه اللعبة مخصصة للتحميل المباشر على الأجهزة فقط.</p>
             <Button onClick={onBack} className="mt-8 rounded-xl">العودة للمعرض</Button>
          </div>
        )}

        {/* Pro HUD Overlays - Real Performance Tracking */}
        <div className="absolute top-8 left-8 pointer-events-none flex flex-col gap-1.5">
           <div className="flex items-center gap-2 flex-row-reverse justify-end">
              <div className={cn("size-1.5 rounded-full animate-pulse", fps > 30 ? "bg-green-500" : "bg-red-500")} />
              <div className="font-mono text-[10px] text-white/60 uppercase tracking-widest">FPS: {fps}</div>
           </div>
           <div className="flex items-center gap-2 flex-row-reverse justify-end opacity-60">
              <Clock className="size-3 text-indigo-400" />
              <div className="font-mono text-[9px] text-white uppercase tracking-widest">Session: {formatPlayTime(playTime)}</div>
           </div>
        </div>
      </div>

      {/* Footer / Controls Hint */}
      <footer className="h-10 px-6 bg-slate-900 flex items-center justify-center border-t border-white/5">
         <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Press [F11] for Immersive Fullscreen Experience</p>
      </footer>
    </div>
  );
}
