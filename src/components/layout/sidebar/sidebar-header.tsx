'use client';

import React from "react";
import { SidebarHeader as ShadcnSidebarHeader } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Layers, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/sidebar-store";
import { IconSafe } from "@/components/ui/icon-safe";

export function SidebarHeader() {
  const { isCollapsed, setCollapsed, position } = useSidebarStore();

  return (
    <ShadcnSidebarHeader className="p-4 border-b border-white/5 relative group/header overflow-hidden">
      <div className={cn(
        "flex items-center gap-3 transition-all duration-300",
        position === "right" ? "flex-row-reverse text-right" : "flex-row text-left",
        isCollapsed && "justify-center"
      )}>
        <div className="size-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shrink-0">
           <Layers className="text-white size-5" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <h1 className="text-sm font-black text-white tracking-tight truncate">NEXUS AI</h1>
            <span className="text-[9px] text-indigo-400 font-bold tracking-widest uppercase truncate">Central Hub</span>
          </div>
        )}
      </div>

      <div className={cn(
        "absolute top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity",
        position === "left" ? "-right-3" : "-left-3"
      )}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-7 rounded-full bg-slate-800 border border-white/10 text-white/60 hover:text-white"
          onClick={() => setCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <IconSafe icon={ChevronRight} className="size-4" /> : <IconSafe icon={ChevronLeft} className="size-4" />}
        </Button>
      </div>
    </ShadcnSidebarHeader>
  );
}
