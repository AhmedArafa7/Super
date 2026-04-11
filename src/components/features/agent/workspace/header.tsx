
"use client";

import React from "react";
import { Code2, Play, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkspaceHeaderProps {
  activeFile: any;
  activeTab: "code" | "preview";
  setActiveTab: (t: "code" | "preview") => void;
  isMaximized: boolean;
  setIsMaximized: (v: boolean) => void;
}

export function WorkspaceHeader({ 
  activeFile, 
  activeTab, 
  setActiveTab, 
  isMaximized, 
  setIsMaximized 
}: WorkspaceHeaderProps) {
  return (
    <header className="h-12 border-b border-white/5 bg-slate-900/50 flex items-center justify-between px-6 flex-row-reverse shrink-0">
      <div className="flex items-center gap-3 flex-row-reverse">
        <Badge variant="outline" className="text-[8px] border-indigo-500/30 text-indigo-400 uppercase">
          {activeFile.language}
        </Badge>
        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
          {activeFile.path}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex gap-2 bg-black/40 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("code")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2", 
              activeTab === "code" ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-white"
            )}
          >
            <Code2 className="size-3" />
            الكود
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2", 
              activeTab === "preview" ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-white"
            )}
          >
            <Play className="size-3" />
            معاينة حية
          </button>
        </div>
        
        {activeTab === "preview" && (
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title="توسيع شاشة المعاينة"
          >
            <Layers className={cn("size-4", isMaximized && "text-indigo-400")} />
          </button>
        )}
      </div>
    </header>
  );
}
