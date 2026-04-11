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
import { motion, AnimatePresence } from "framer-motion";
import { BASE_PROJECT_CONTEXT } from "@/lib/agent-base-context";


export function CodeWorkspace() {
  const [activeTab, setActiveTab] = React.useState<"code" | "preview">("code");
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [sidebarWidth, setSidebarWidth] = React.useState(240);
  const { files, activeFilePath, setActiveFile, updateFile } = useAgentStore();
  const activeFile = files.find(f => f.path === activeFilePath);

  // Resize Handling
  const [isResizing, setIsResizing] = React.useState(false);

  const startResizing = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback((mouseMoveEvent: any) => {
    if (isResizing) {
      setSidebarWidth(mouseMoveEvent.clientX);
    }
  }, [isResizing]);

  React.useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // ... (sandpackFiles memo)
  const sandpackFiles = React.useMemo(() => {
    const map: Record<string, string> = {
      // 1. BASE PROJECT CONTEXT (Real files provided as fallback)
      ...BASE_PROJECT_CONTEXT,

      // 2. Native Alias Support via tsconfig.json (The Professional way to mock packages)
      "/tsconfig.json": JSON.stringify({
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
            "next/*": ["src/mocks/next/*"]
          },
          jsx: "react-jsx"
        }
      }, null, 2)
    };
    
    files.forEach(f => {
      // Normalize paths to absolute for Sandpack
      const key = f.path.startsWith('/') ? f.path : `/${f.path}`;
      map[key] = f.content;
    });
    
    // --- NEXT.JS BROWSER MOCKS ---
    map["/src/mocks/next/navigation.js"] = `
        import React from "react";
        const noop = () => {};
        const mockRouter = {
            push: noop, replace: noop, back: noop, forward: noop, 
            refresh: noop, prefetch: noop, pathname: "/"
        };
        export const useRouter = () => mockRouter;
        export const usePathname = () => "/";
        export const useParams = () => ({});
        export const useSearchParams = () => ({ get: () => null });
    `;

    map["/src/mocks/next/image.js"] = `
        import React from "react";
        export default function Image(props) {
            return <img {...props} style={{ maxWidth: "100%", height: "auto", ...props.style }} />;
        }
    `;

    if (activeFile) {
        const activeKey = activeFile.path.startsWith('/') ? activeFile.path : `/${activeFile.path}`;
        
        map["/App.tsx"] = `
import React from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import Component from "${activeKey.replace(/\.tsx?$/, "")}";

export default function App() {
  return (
    <AuthProvider>
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white' }}>
        <Component />
      </div>
    </AuthProvider>
  );
}`;
    }
    
    return map;
  }, [files, activeFile]);

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950/40 border-r border-white/5 relative">
      <SandpackProvider
        template="react-ts"
        theme={nightOwl}
        files={sandpackFiles}
        customSetup={{
          dependencies: {
            "lucide-react": "latest",
            "framer-motion": "latest",
            "clsx": "latest",
            "tailwind-merge": "latest"
          }
        }}
        options={{
          recompileMode: "immediate",
          recompileDelay: 300,
          externalResources: ["https://cdn.tailwindcss.com"],
          activeFile: activeFilePath?.startsWith('/') ? activeFilePath : `/${activeFilePath}`
        }}
        className="size-full"
      >
        {/* File Explorer */}
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

        {/* Resizer Handle */}
        <div 
          onMouseDown={startResizing}
          className="w-1 cursor-col-resize hover:bg-indigo-500/50 transition-colors bg-white/5 z-10 shrink-0" 
        />

        {/* Editor & Preview Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950/20 relative">
            {activeFile ? (
                <>
                    <header className="h-12 border-b border-white/5 bg-slate-900/50 flex items-center justify-between px-6 flex-row-reverse shrink-0">
                        <div className="flex items-center gap-3 flex-row-reverse">
                            <Badge variant="outline" className="text-[8px] border-indigo-500/30 text-indigo-400 uppercase">{activeFile.language}</Badge>
                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">{activeFile.path}</span>
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
                            <motion.div 
                                layout
                                className={cn(
                                    "size-full transition-all duration-500",
                                    isMaximized ? "fixed inset-4 z-[100] bg-slate-950/90 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.2)]" : "p-4"
                                )}
                            >
                                {isMaximized && (
                                    <div className="flex items-center justify-between mb-4 flex-row-reverse px-4">
                                        <div className="flex items-center gap-3 flex-row-reverse">
                                            <div className="size-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <Play className="text-white size-4" />
                                            </div>
                                            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Neural Live Preview</h2>
                                        </div>
                                        <button 
                                            onClick={() => setIsMaximized(false)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all border border-white/10"
                                        >
                                            <Layers className="size-4 rotate-180" />
                                        </button>
                                    </div>
                                )}
                                <div className={cn("size-full relative", isMaximized ? "h-[calc(100%-48px)]" : "h-full")}>
                                    <SandpackPreview 
                                        showOpenInCodeSandbox={false}
                                        showRefreshButton={true}
                                        style={{ height: '100%', borderRadius: isMaximized ? '1.5rem' : '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'white' }}
                                    />
                                </div>
                            </motion.div>
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
