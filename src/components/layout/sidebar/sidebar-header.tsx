'use client';

import React from "react";
import { SidebarHeader as ShadcnSidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Layers, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconSafe } from "@/components/ui/icon-safe";
import { useSidebarLayout } from "./use-sidebar-layout";
import { useSidebarStore } from "@/lib/sidebar-store";
import { usePreferencesStore } from "@/lib/preferences-store";

export function SidebarHeader() {
  const { setOpen } = useSidebar();
  const { isCollapsed, isLeft, isRight, flexDir } = useSidebarLayout();
  const setPosition = useSidebarStore(s => s.setPosition);
  const { sidebarIconShortcutEnabled } = usePreferencesStore();

  const handleIconClick = () => {
    if (sidebarIconShortcutEnabled) {
      setPosition('floating');
    }
  };

  return (
    <ShadcnSidebarHeader className="p-4 border-b border-white/5 relative group/header overflow-hidden">
      <div className={cn(
        "flex items-center gap-3 transition-all duration-300",
        flexDir,
        isCollapsed && "justify-center"
      )}>
        <div 
          className={cn(
            "size-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shrink-0 transition-transform active:scale-90",
            sidebarIconShortcutEnabled && "cursor-pointer hover:scale-110"
          )}
          onClick={handleIconClick}
        >
           <Layers className="text-white size-5" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden text-right">
            <h1 className="text-sm font-black text-white tracking-tight truncate">NEXUS AI</h1>
            <span className="text-[9px] text-indigo-400 font-bold tracking-widest uppercase truncate">Central Hub</span>
          </div>
        )}
      </div>

      <div className={cn(
        "absolute top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity",
        isLeft ? "-right-3" : "-left-3"
      )}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-7 rounded-full bg-slate-800 border border-white/10 text-white/60 hover:text-white"
          onClick={() => setOpen(!isCollapsed)}
        >
          {isCollapsed ? <IconSafe icon={isLeft ? ChevronRight : ChevronLeft} className="size-4" /> : <IconSafe icon={isLeft ? ChevronLeft : ChevronRight} className="size-4" />}
        </Button>
      </div>
    </ShadcnSidebarHeader>
  );
}
