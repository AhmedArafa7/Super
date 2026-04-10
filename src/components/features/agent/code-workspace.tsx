"use client";

import React from "react";
import { FileCode, Layers, Database, Play, Code2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAgentStore } from "@/lib/agent-store";
import { cn } from "@/lib/utils";
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  SandpackCodeEditor,
  SandpackFileExplorer,
  useSandpack
} from "@codesandbox/sandpack-react";
import { nightOwl } from "@codesandbox/sandpack-themes";


export function CodeWorkspace() {
  const [activeTab, setActiveTab] = React.useState<"code" | "preview">("code");
  const { files, activeFilePath, setActiveFile, updateFile } = useAgentStore();
  const activeFile = files.find(f => f.path === activeFilePath);

  // Map our store files to Sandpack format
  const sandpackFiles = React.useMemo(() => {
    const map: Record<string, string> = {};
    files.forEach(f => {
      // Sandpack expects a flat path or relative to root
      const key = f.path.startsWith('/') ? f.path : `/${f.path}`;
      map[key] = f.content;
    });
    
    // Ensure we have an entry point if not present
    if (!map["/App.js"] && !map["/App.tsx"] && !map["/index.js"]) {
        // Find the first tsx/js file to use as entry
        const entry = files.find(f => f.path.endsWith('.tsx') || f.path.endsWith('.js'));
        if (entry) {
            map["/App.tsx"] = entry.content;
        }
    }
    
    return map;
  }, [files]);

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950/40 border-r border-white/5">
      <SandpackProvider
        template="react"
        theme={nightOwl}
        files={sandpackFiles}
        options={{
          recompileMode: "immediate",
          recompileDelay: 300,
          externalResources: ["https://cdn.tailwindcss.com"]
        }}
        className="size-full"
      >
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

        {/* Editor & Preview Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950/20">
            {activeFile ? (
                <>
                    <header className="h-12 border-b border-white/5 bg-slate-900/50 flex items-center justify-between px-6 flex-row-reverse">
                        <div className="flex items-center gap-3 flex-row-reverse">
                            <Badge variant="outline" className="text-[8px] border-indigo-500/30 text-indigo-400 uppercase">{activeFile.language}</Badge>
                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">{activeFile.path}</span>
                        </div>
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
                    </header>
                    <div className="flex-1 overflow-hidden relative">
                        {activeTab === "code" ? (
                            <div className="size-full bg-slate-950/40">
                                <SandpackCodeEditor 
                                    showLineNumbers 
                                    showTabs={false} 
                                    style={{ height: '100%', background: 'transparent' }}
                                />
                            </div>
                        ) : (
                            <div className="size-full bg-slate-950/40 rounded-br-[2rem] p-4">
                                <SandpackPreview 
                                    showOpenInCodeSandbox={false}
                                    showRefreshButton={false}
                                    style={{ height: '100%', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}
                                />
                            </div>
                        )}
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
      </SandpackProvider>
    </div>
  );
}
