
'use client';

import React from "react";
import { FileCode, Layers, Save, Database, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAgentStore } from "@/lib/agent-store";
import { cn } from "@/lib/utils";

export function CodeWorkspace() {
  const { files, activeFilePath, setActiveFile, updateFile } = useAgentStore();
  const activeFile = files.find(f => f.path === activeFilePath);

  return (
    <div className="flex-1 flex overflow-hidden bg-black/20 rounded-l-[2.5rem] border-r border-white/5 shadow-2xl">
      {/* File Explorer */}
      <aside className="w-64 border-r border-white/5 flex flex-col bg-slate-900/40">
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

      {/* Editor */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950/20">
        {activeFile ? (
          <>
            <header className="h-12 border-b border-white/5 bg-white/5 flex items-center justify-between px-6 flex-row-reverse">
              <div className="flex items-center gap-3 flex-row-reverse">
                <Badge variant="outline" className="text-[8px] border-indigo-500/30 text-indigo-400 uppercase">{activeFile.language}</Badge>
                <span className="text-[10px] font-mono text-slate-400 truncate">{activeFile.path}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-white">
                  <Save className="size-4" />
                </Button>
              </div>
            </header>
            <div className="flex-1 overflow-hidden p-6">
              <textarea
                value={activeFile.content}
                onChange={(e) => updateFile(activeFile.path, e.target.value)}
                className="size-full bg-transparent border-none focus:ring-0 font-mono text-sm text-indigo-100/80 resize-none leading-relaxed text-left"
                spellCheck={false}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 p-10 text-center">
            <Database className="size-16 mb-4" />
            <p className="text-xl font-bold uppercase tracking-widest">Workspace Ready</p>
            <p className="text-xs mt-2">اصدر أمراً للمهندس لبدء المزامنة البرمجية.</p>
          </div>
        )}
      </main>
    </div>
  );
}
