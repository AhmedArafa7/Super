'use client';

import React from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/sidebar-store";

export function ResizeHandle({ onMouseDown, isResizing }: { onMouseDown: any, isResizing: boolean }) {
  const { position, isCollapsed } = useSidebarStore();

  if (isCollapsed) return null;

  return (
    <div 
      onMouseDown={onMouseDown}
      className={cn(
        "absolute top-0 h-full w-2 cursor-col-resize z-50 group/rail",
        position === "left" ? "-right-1" : "-left-1",
        isResizing ? "bg-primary/20" : "hover:bg-primary/10"
      )}
    >
      <div className={cn(
        "absolute top-0 h-full w-[1px] transition-colors",
        position === "left" ? "right-1" : "left-1",
        isResizing ? "bg-primary" : "bg-white/5 group-hover/rail:bg-primary/50"
      )} />
    </div>
  );
}
