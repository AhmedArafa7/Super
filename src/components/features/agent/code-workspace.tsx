
"use client";

import React from "react";
import { Database } from "lucide-react";
import { 
  SandpackProvider, 
  SandpackCodeEditor
} from "@codesandbox/sandpack-react";
import { nightOwl } from "@codesandbox/sandpack-themes";

import { useAgentStore } from "@/lib/agent-store";
import { useSandpackSetup } from "./workspace/use-sandpack-setup";
import { WorkspaceHeader } from "./workspace/header";
import { WorkspaceSidebar } from "./workspace/sidebar";
import { WorkspacePreview } from "./workspace/preview-window";

export function CodeWorkspace() {
  const [activeTab, setActiveTab] = React.useState<"code" | "preview">("code");
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [sidebarWidth, setSidebarWidth] = React.useState(240);
  const [isResizing, setIsResizing] = React.useState(false);

  const { files, activeFilePath, setActiveFile } = useAgentStore();
  const activeFile = files.find(f => f.path === activeFilePath);

  // Use the new modular hook for setup
  const { sandpackFiles } = useSandpackSetup(files, activeFile);

  // Resize Handling Logic
  const startResizing = React.useCallback(() => setIsResizing(true), []);
  const stopResizing = React.useCallback(() => setIsResizing(false), []);
  const resize = React.useCallback((e: any) => {
    if (isResizing) setSidebarWidth(e.clientX);
  }, [isResizing]);

  React.useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

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
        <WorkspaceSidebar 
          files={files}
          activeFilePath={activeFilePath}
          setActiveFile={setActiveFile}
          isResizing={isResizing}
          sidebarWidth={sidebarWidth}
          startResizing={startResizing}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-slate-950/20 relative">
          {activeFile ? (
            <>
              <WorkspaceHeader 
                activeFile={activeFile}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isMaximized={isMaximized}
                setIsMaximized={setIsMaximized}
              />

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
                  <WorkspacePreview 
                    isMaximized={isMaximized}
                    setIsMaximized={setIsMaximized}
                  />
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
