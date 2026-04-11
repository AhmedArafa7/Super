
"use client";

import React from "react";
import { FileCode, Layers } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface WorkspaceSidebarProps {
  files: any[];
  activeFilePath: string | null;
  setActiveFile: (path: string) => void;
  isResizing: boolean;
  sidebarWidth: number;
  startResizing: () => void;
}

export function WorkspaceSidebar({ 
  files, 
  activeFilePath, 
  setActiveFile, 
  isResizing, 
  sidebarWidth,
  startResizing 
}: WorkspaceSidebarProps) {
  return (
    <>
      <aside 
        style={{ width: `${sidebarWidth}px` }} 
        className={cn(
          "border-r border-white/5 flex flex-col bg-slate-900/40 shrink-0 select-none",
          isResizing && "opacity-50"
        )}
      >
        <div className="p-6 border-b border-white/5">
          <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] text-right flex items-center justify-end gap-2">
            مستكشف العقد البرمجية
            <Layers className="size-3" />
          </h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {files.length === 0 ? (
              <div className="py-10 text-center opacity-20 italic text-[10px]">بانتظار بناء العقد...</div>
            ) : (
              files.map(f => (
                <button
                  key={f.path}
                  onClick={() => setActiveFile(f.path)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all flex-row-reverse text-right group",
                    activeFilePath === f.path ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  <FileCode className={cn("size-4 shrink-0", activeFilePath === f.path ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-xs truncate flex-1", activeFilePath === f.path ? "text-white font-bold" : "text-slate-400")}>
                    {f.path}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      <div 
        onMouseDown={startResizing}
        className="w-1 cursor-col-resize hover:bg-indigo-500/50 transition-colors bg-white/5 z-10 shrink-0" 
      />
    </>
  );
}
