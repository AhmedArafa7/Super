'use client';

import React from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, 
  DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Layers } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/sidebar-store";
import { IconSafe } from "@/components/ui/icon-safe";

export function FloatingOrb({ visibleItems, activeTab, onTabChange }: any) {
  const { floatingPos, setFloatingPos, setPosition } = useSidebarStore();
  const [isDragging, setIsDragging] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [dragStartPos, setDragStartPos] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef<any>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    dragRef.current = {
      startX: e.clientX - floatingPos.x,
      startY: e.clientY - floatingPos.y
    };
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    // If we moved more than 5px, it was a drag, not a click
    const moveX = Math.abs(e.clientX - dragStartPos.x);
    const moveY = Math.abs(e.clientY - dragStartPos.y);
    if (moveX > 5 || moveY > 5) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen(!isOpen);
  };

  React.useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      setFloatingPos({ 
        x: e.clientX - dragRef.current.startX, 
        y: e.clientY - dragRef.current.startY 
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, setFloatingPos]);

  return (
    <div 
      style={{ left: floatingPos.x, top: floatingPos.y }}
      className="fixed z-[9999] touch-none"
      onMouseDown={handleMouseDown}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} dir="rtl">
        <DropdownMenuTrigger asChild>
          <div 
            onClick={handleTriggerClick}
            className={cn(
              "size-14 rounded-full bg-slate-900 border-2 border-primary/50 shadow-[0_0_30px_-5px_rgba(var(--primary),0.5)] flex items-center justify-center cursor-move transition-transform hover:scale-110 active:scale-95 group relative overflow-hidden",
              isDragging && "scale-105 border-primary shadow-[0_0_40px_-5px_rgba(var(--primary),0.8)]"
            )}
          >
            <div className="absolute inset-0 bg-primary/10 animate-pulse" />
            <Layers className="text-primary size-7 relative z-10" />
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-transparent animate-spin-slow" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72 bg-slate-900/95 backdrop-blur-2xl border-white/10 p-3 rounded-2xl shadow-2xl animate-in zoom-in-95" side="top" align="center">
          <DropdownMenuLabel className="text-center pb-2 border-b border-white/5 mb-2 text-indigo-400 font-black tracking-widest text-xs">NEXUS OMNI-CONTROL</DropdownMenuLabel>
          <ScrollArea className="h-[400px] pr-2">
            <div className="grid grid-cols-1 gap-1">
              {visibleItems.map((item: any) => (
                <DropdownMenuItem 
                  key={item.id} 
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all text-right flex-row-reverse",
                    activeTab === item.id ? "bg-primary text-white" : "hover:bg-white/5"
                  )}
                >
                  <IconSafe icon={item.icon} className="size-4" />
                  <span className="flex-1 text-xs font-medium">{item.label}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </ScrollArea>
          <DropdownMenuSeparator className="my-2 bg-white/5" />
          <DropdownMenuItem onClick={() => setPosition('left')} className="text-center justify-center text-[10px] text-muted-foreground hover:text-white">
            إعادة الشريط للوضع العمودي
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
