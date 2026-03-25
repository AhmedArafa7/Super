
'use client';

import React from "react";
import { Cpu, Box, Rocket, ShieldCheck } from "lucide-react";
import { AgentChat } from "./agent/agent-chat";
import { CodeWorkspace } from "./agent/code-workspace";
import { TaskTerminal } from "./agent/task-terminal";
import { HistorySidebar } from "./agent/history-sidebar";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: NEURAL_ARCHITECT_V1.0]
 * واجهة المهندس العصبي - نظام محاكاة التطوير الذكي.
 */
export function AgentAI() {
  const [showHistory, setShowHistory] = React.useState(true);

  return (
    <div className="h-full flex flex-col p-2 md:p-4 animate-in fade-in duration-700 font-sans">
      <header className="flex items-center justify-between mb-3 gap-4 flex-row-reverse border-b border-white/5 pb-3">
        <div className="flex items-center gap-4 flex-row-reverse">
          <div className="flex items-center gap-3 flex-row-reverse">
            <div className="size-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
              <Cpu className="text-primary size-5" />
            </div>
            <h1 className="text-xl font-headline font-bold text-white tracking-tight">المهندس العصبي</h1>
          </div>
          
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
            <Rocket className="size-2.5 text-primary" />
            <span className="text-[8px] uppercase font-bold text-primary tracking-widest leading-none">V2.5 Neural Core</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "h-8 px-3 rounded-lg text-[10px] font-bold gap-2",
              showHistory ? "bg-primary/20 text-primary" : "text-slate-400 hover:text-white"
            )}
          >
            <History className="size-3.5" />
            الأرشيف
          </Button>
        </div>

        <p className="text-muted-foreground text-[11px] text-right hidden lg:block max-w-sm leading-tight">
          بيئة بناء سيادية تتيح لك التحدث مع "الوكيل" لتوليد الأكواد وتعديل ملفات المشروع لحظياً.
        </p>
      </header>

      <main className="flex-1 flex gap-0 min-h-0 overflow-hidden glass border-white/5 rounded-[2.5rem]">
        {showHistory && <HistorySidebar />}
        
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex min-h-0 border-b border-white/5">
            <CodeWorkspace />
            <TaskTerminal />
          </div>
          <AgentChat />
        </div>
      </main>

      {/*<footer className="mt-6 flex items-center justify-between opacity-40">
        <div className="flex items-center gap-4 text-[9px] uppercase font-black tracking-widest">
          <span className="flex items-center gap-1"><ShieldCheck className="size-3" /> Secure AI Sandbox</span>
          <span className="flex items-center gap-1"><Box className="size-3" /> Isolated Execution</span>
        </div>
        <p className="text-[9px] font-bold text-muted-foreground">© Nexus Agent Protocol v1.0</p>
      </footer>*/}
    </div>
  );
}
