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

  // Generate a robust HTML sandbox that mocks missing libraries and handles multi-file context.
  const getPreviewHtml = () => {
    if (!activeFile) return "";
    
    if (activeFile.language === "html" || activeFile.language === "htm") {
        return `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>body { font-family: sans-serif; }</style>
            </head>
            <body>${activeFile.content}</body>
            </html>
        `;
    }

    // Smart Transformation: Clean up imports and prepare for Babel
    const cleanCode = activeFile.content
        .replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, "") // Robust multi-line import removal
        .replace(/export\s+default\s+function\s+(\w+)/g, "function App")
        .replace(/export\s+default\s+/g, "const App = ")
        .replace(/export\s+(const|let|var|function|class)/g, "$1");

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
            body { font-family: sans-serif; background: #0f172a; color: white; padding: 20px; min-height: 100vh; }
            #root { height: 100%; }
            .preview-error { 
                background: #1e293b; border: 1px solid #ef4444; border-radius: 1rem; padding: 2rem;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script>
          // --- NEURAL MAGIC PROXY ---
          // Automatically mocks missing components/libraries to prevent white-screen crashes
          const MagicHandler = {
            get: (target, prop) => {
              if (prop === '$$typeof') return undefined;
              if (prop === 'displayName') return prop;
              // Return a dummy component that shows the name of the missing element
              return function DummyComponent(props) {
                return React.createElement('div', { 
                  style: { border: '1px dashed #6366f1', padding: '4px', borderRadius: '4px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' } 
                }, React.createElement('span', { style: { opacity: 0.5 } }, '🧱'), prop);
              };
            }
          };

          window.lucide = new Proxy({}, MagicHandler);
          window['lucide-react'] = window.lucide;
          window['framer-motion'] = new Proxy({ motion: new Proxy({}, MagicHandler), AnimatePresence: MagicHandler.get(null, 'AnimatePresence') }, MagicHandler);
          
          // Basic Mocks for common project hooks
          window.useAuth = () => ({ user: { id: '123', name: 'User' }, isLoading: false });
          window.useTheme = () => ({ theme: 'dark', setTheme: () => {} });
        </script>
        <script type="text/babel">
          try {
            const { useState, useEffect, useMemo, useCallback, useRef, memo } = React;
            
            // Inject cleaner code
            ${cleanCode}

            // Mount logic
            const rootElement = document.getElementById('root');
            if (typeof App === 'undefined') {
                 throw new Error("Could not find a default export. Please ensure your component has an 'export default'.");
            }
            const root = ReactDOM.createRoot(rootElement);
            root.render(<App />);
          } catch(err) {
            console.error("Neural Sandbox Error:", err);
            document.getElementById('root').innerHTML = 
              '<div class="preview-error">' +
                '<h2 style="color:#ef4444; margin:0 0 1rem 0; font-size:1.25rem;">⚠️ Neural Sandbox Exception</h2>' +
                '<div style="color:#cbd5e1; font-size:0.875rem; white-space:pre-wrap; line-height:1.6;">' + err.message + '</div>' +
                '<div style="margin-top:2rem; padding-top:1rem; border-top:1px solid #334155; font-size:0.75rem; color:#64748b;">' +
                   'Note: The sandbox removes imports and mocks missing libraries. If you see this, there might be a syntax error or a missing local dependency.' +
                '</div>' +
              '</div>';
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
