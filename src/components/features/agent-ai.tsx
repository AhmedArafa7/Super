
'use client';

import React from "react";
import { Cpu, Box, Rocket, ShieldCheck } from "lucide-react";
import { AgentChat } from "./agent/agent-chat";
import { CodeWorkspace } from "./agent/code-workspace";
import { TaskTerminal } from "./agent/task-terminal";

/**
 * [STABILITY_ANCHOR: NEURAL_ARCHITECT_V1.0]
 * واجهة المهندس العصبي - نظام محاكاة التطوير الذكي.
 */
export function AgentAI() {
  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-700 font-sans">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6 flex-row-reverse">
        <div className="text-right">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 border border-primary/20 rounded-full mb-2">
            <Rocket className="size-3 text-primary" />
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Neural Architect Mode</span>
          </div>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            المهندس العصبي
            <Cpu className="text-primary size-10" />
          </h1>
          <p className="text-muted-foreground mt-2 text-lg text-right max-w-2xl">
            بيئة بناء سيادية تتيح لك التحدث مع "الوكيل" لتوليد الأكواد وتعديل ملفات المشروع لحظياً.
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-0 min-h-0 overflow-hidden glass border-white/5 rounded-[2.5rem]">
        <div className="flex-1 flex min-h-0 border-b border-white/5">
          <CodeWorkspace />
          <TaskTerminal />
        </div>
        <AgentChat />
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
