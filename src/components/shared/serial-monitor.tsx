'use client';

import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SerialMonitorProps {
  logs: string[];
  onClear: () => void;
  className?: string;
  status?: 'connected' | 'disconnected' | 'error';
}

/**
 * [COMPONENT: SerialMonitor]
 * مكون واجهة مستقل لعرض بيانات السيريال.
 * مصمم ليتم تضمينه في أي نافذة أو Terminal.
 */
export function SerialMonitor({ logs, onClear, className, status = 'disconnected' }: SerialMonitorProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className={cn("flex flex-col bg-black/40 font-mono text-[11px] h-full", className)}>
      <div className="h-9 flex items-center px-4 border-b border-white/5 justify-between shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-2 opacity-50">
           <Terminal className="size-3" />
           <span className="text-[9px] font-black uppercase tracking-[0.2em]">Si-Neuro Serial Stream</span>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5 flex-row-reverse">
              <div className={cn("size-1.5 rounded-full animate-pulse", status === 'connected' ? "bg-emerald-500" : "bg-red-500")} />
              <span className="text-[8px] font-bold uppercase tracking-tighter opacity-60">
                 {status === 'connected' ? 'Streaming' : 'Offline'}
              </span>
           </div>
           <Button variant="ghost" size="icon" onClick={onClear} className="size-6 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400">
              <Trash2 className="size-3.5" />
           </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1 text-emerald-400/80 text-left">
           {logs.length === 0 ? (
             <div className="py-10 text-center flex flex-col items-center gap-3 opacity-20">
                <Zap className="size-8" />
                <p className="text-[10px] italic">Waiting for hardware data...</p>
             </div>
           ) : (
             logs.map((line, i) => (
               <div key={i} className="animate-in fade-in slide-in-from-left-1 duration-200 whitespace-pre-wrap border-l border-white/5 pl-2">
                 {line}
               </div>
             ))
           )}
           <div ref={logEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
