"use client";

import React from "react";
import { FileCode, Layers, Database } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAgentStore } from "@/lib/agent-store";
import { cn } from "@/lib/utils";


export function CodeWorkspace() {
  const [activeTab, setActiveTab] = React.useState<"code" | "preview">("code");
  const { files, activeFilePath, setActiveFile, updateFile } = useAgentStore();
  const activeFile = files.find(f => f.path === activeFilePath);

  // Generate an HTML string that loads React, Babel, and Tailwind, and mounts the activeFile code.
  const getPreviewHtml = () => {
    if (!activeFile) return "";
    
    // If it's pure HTML, just wrap with Tailwind
    if (activeFile.language === "html" || activeFile.language === "htm") {
        return `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>body { font-family: sans-serif; }</style>
            </head>
            <body>
                ${activeFile.content}
            </body>
            </html>
        `;
    }

    // Default to React/JSX evaluation
    const rawCode = activeFile.content
        .replace(/import .* from .*/g, "")
        .replace(/export default function\s+(\w+)/, "function App")
        .replace(/export function\s+(\w+)/, "function App");

    return `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body { font-family: sans-serif; background: transparent; padding: 10px; }
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          try {
            const React = window.React;
            ${rawCode}
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<App />);
          } catch(err) {
            document.getElementById('root').innerHTML = '<div style="color:red; padding:20px; font-family:monospace; direction:ltr; text-align:left;"><b>Preview Error:</b><br/>' + err.message + '</div>';
          }
        </script>
      </body>
      </html>
    `;
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-black/20 border-r border-white/5">
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
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">{activeFile.path}</span>
              </div>
              <div className="flex gap-2 bg-black/40 p-1 rounded-xl">
                <button
                    onClick={() => setActiveTab("code")}
                    className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all", activeTab === "code" ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-white")}
                >
                    الكود
                </button>
                <button
                    onClick={() => setActiveTab("preview")}
                    className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all", activeTab === "preview" ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-white")}
                >
                    معاينة حية
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-hidden relative">
              {activeTab === "code" ? (
                <textarea
                  value={activeFile.content}
                  onChange={(e) => updateFile(activeFile.path, e.target.value)}
                  className="size-full p-6 bg-transparent border-none focus:ring-0 font-mono text-sm text-indigo-100/80 resize-none leading-relaxed text-left"
                  spellCheck={false}
                />
              ) : (
                <div className="size-full bg-white/5 rounded-br-[2rem] p-2">
                    <iframe 
                        srcDoc={getPreviewHtml()} 
                        className="size-full rounded-2xl bg-white border border-white/10" 
                        sandbox="allow-scripts" 
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
    </div>
  );
}
