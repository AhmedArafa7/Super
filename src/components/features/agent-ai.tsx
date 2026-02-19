
'use client';

import React from "react";
import { Cpu, Box, Rocket, ShieldCheck, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AgentChat } from "./agent/agent-chat";
import { CodeWorkspace } from "./agent/code-workspace";
import { TaskTerminal } from "./agent/task-terminal";

/**
 * [STABILITY_ANCHOR: AGENT_AI_ORCHESTRATOR_V1.0]
 * المنسق الرئيسي لقسم المهندس العصبي (Neural Architect).
 * بيئة بناء أكواد تفاعلية تدعم وكلاء الذكاء الاصطناعي.
 */
export function AgentAI() {
  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-700 font-sans">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6 flex-row-reverse">
        <div className="text-right">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 border border-primary/20 rounded-full mb-2">
            <Rocket className="size-3 text-primary" />
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Neural Architect v1.0</span>
          </div>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            المهندس العصبي
            <Cpu className="text-primary size-10" />
          </h1>
          <p className="text-muted-foreground mt-2 text-lg text-right max-w-2xl">
            بيئة بناء سيادية حيث يقوم وكيل الـ AI بتحويل أفكارك إلى تطبيقات برمجية حقيقية داخل المتجر.
          </p>
        </div>

        <div className="flex items-center gap-4 flex-row-reverse">
          <div className="glass border-white/10 p-4 rounded-2xl flex flex-col gap-1 text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[10px] font-bold text-white">حالة الوكيل</span>
              <div className="size-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Authorized Sandbox Ready</p>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col gap-6">
          {/* Workspace & Terminal Container */}
          <div className="flex-1 flex min-h-0">
            <CodeWorkspace />
            <TaskTerminal />
          </div>
          
          {/* Interaction Bar */}
          <AgentChat />
        </div>
      </main>

      {/* Footer Info */}
      <footer className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 opacity-40">
        <div className="flex items-center gap-4 text-[9px] uppercase font-black tracking-widest">
          <span className="flex items-center gap-1"><ShieldCheck className="size-3" /> E2EE Execution</span>
          <span className="flex items-center gap-1"><Box className="size-3" /> Isolated Container</span>
        </div>
        <p className="text-[9px] font-bold text-muted-foreground">© Nexus Agent Core Protocol</p>
      </footer>
    </div>
  );
}
