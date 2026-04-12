
"use client";

import React from "react";
import { Play, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { SandpackPreview } from "@codesandbox/sandpack-react";
import { cn } from "@/lib/utils";

interface WorkspacePreviewProps {
  isMaximized: boolean;
  setIsMaximized: (v: boolean) => void;
}

export function WorkspacePreview({ isMaximized, setIsMaximized }: WorkspacePreviewProps) {
  return (
    <motion.div 
      layout
      className={cn(
        "size-full transition-all duration-500",
        isMaximized ? "fixed inset-4 z-[100] bg-slate-950/90 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.2)]" : "p-0"
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
      <div className={cn("size-full relative bg-white", isMaximized ? "h-[calc(100%-48px)] rounded-2xl" : "h-full")}>
        <SandpackPreview 
          showOpenInCodeSandbox={false}
          showRefreshButton={true}
          style={{ 
            height: '100%', 
            width: '100%',
            overflow: 'hidden', 
            border: 'none', 
            background: 'white' 
          }}
        />
      </div>
    </motion.div>
  );
}
