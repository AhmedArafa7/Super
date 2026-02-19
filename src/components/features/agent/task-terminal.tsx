
'use client';

import React, { useEffect, useRef } from "react";
import { Terminal as TerminalIcon, Cpu, Activity } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentStore } from "@/lib/agent-store";
import { cn } from "@/lib/utils";

export function TaskTerminal() {
  const { logs } = useAgentStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-80 border-l border-white/5 bg-black/40 flex flex-col h-full rounded-r-[2.5rem] overflow-hidden">
      <header className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between flex-row-reverse">
        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] text-right flex items-center justify-end gap-2">
          سجل المهام
          <TerminalIcon className="size-3" />
        </h3>
        <Activity className="size-3 text-green-500 animate-pulse" />
      </header>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="py-10 text-center opacity-10 text-[8px] font-mono">
              [SYSTEM_IDLE]: WAITING FOR TASKS
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="text-[10px] font-mono leading-tight animate-in slide-in-from-bottom-1 duration-300">
                <span className="text-muted-foreground mr-2">[{log.timestamp}]</span>
                <span className={cn(
                  "font-bold",
                  log.type === 'success' ? "text-green-400" : 
                  log.type === 'error' ? "text-red-400" : 
                  log.type === 'neural' ? "text-primary animate-pulse" : 
                  "text-indigo-300"
                )}>
                  {log.type === 'neural' ? '>>> ' : log.type === 'error' ? 'ERR: ' : '> '}
                  {log.text}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between flex-row-reverse">
        <span className="text-[8px] font-black text-muted-foreground uppercase">Protocol v1.0</span>
        <div className="flex items-center gap-1">
          <div className="size-1 rounded-full bg-green-500" />
          <span className="text-[8px] font-bold text-green-500">ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
