'use client';

import React from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, 
  DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  Layers, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown,
  GripHorizontal
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/sidebar-store";
import { IconSafe } from "@/components/ui/icon-safe";
import { NavItem } from "./nav-items";
import { SidebarCustomizeDialog } from "./sidebar-customize-dialog";

/**
 * [STABILITY_ANCHOR: FLOATING_ORB_V3]
 * الكرة العائمة المحسّنة - تدعم:
 * 1. التخصيص (Pinned Items فقط)
 * 2. الوضع المدمج (Icon-Only)
 * 3. السحب والإفلات
 */

interface FloatingOrbProps {
  pinnedItems: NavItem[];
  allItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  isPinned: (id: string) => boolean;
  togglePin: (id: string) => void;
  isCollapsed: boolean;
}

export function FloatingOrb({ pinnedItems, allItems, activeTab, onTabChange, isPinned, togglePin, isCollapsed }: FloatingOrbProps) {
  const floatingPos = useSidebarStore(s => s.floatingPos);
  const setFloatingPos = useSidebarStore(s => s.setFloatingPos);
  const setPosition = useSidebarStore(s => s.setPosition);
  const setCollapsed = useSidebarStore(s => s.setCollapsed);
  const [isDragging, setIsDragging] = React.useState(false); // visual only
  const [isOpen, setIsOpen] = React.useState(false);

  // All drag state lives in a single ref to avoid stale closures
  const dragStateRef = React.useRef({
    isDown: false,
    wasDragged: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || isOpen) return;
    const state = dragStateRef.current;
    state.isDown = true;
    state.wasDragged = false;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.offsetX = e.clientX - floatingPos.x;
    state.offsetY = e.clientY - floatingPos.y;
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    // wasDragged persists past pointerup, so we can read it here
    if (dragStateRef.current.wasDragged) {
      dragStateRef.current.wasDragged = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen(prev => !prev);
  };

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state.isDown) return;

      const moveX = Math.abs(e.clientX - state.startX);
      const moveY = Math.abs(e.clientY - state.startY);

      // Start dragging only after 10px threshold
      if (moveX > 10 || moveY > 10) {
        state.wasDragged = true;
        setIsDragging(true);
        setFloatingPos({
          x: e.clientX - state.offsetX,
          y: e.clientY - state.offsetY,
        });
      }
    };

    const onUp = () => {
      dragStateRef.current.isDown = false;
      setIsDragging(false);
      // NOTE: wasDragged is NOT reset here — it stays true
      // so the click handler (which fires AFTER pointerup) can detect it
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [setFloatingPos]);

  return (
    <div 
      style={{ left: floatingPos.x, top: floatingPos.y }}
      className={cn(
        "fixed z-[9999] touch-none cursor-move",
        isDragging && "cursor-grabbing"
      )}
      onPointerDown={handlePointerDown}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} dir="rtl">
        <DropdownMenuTrigger asChild>
          <div 
            onClick={handleTriggerClick}
            className={cn(
              "size-14 rounded-full bg-slate-900 border-2 border-primary/50 shadow-[0_0_30px_-5px_rgba(var(--primary),0.5)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group relative overflow-hidden",
              isDragging && "scale-105 border-primary shadow-[0_0_40px_-5px_rgba(var(--primary),0.8)]"
            )}
          >
            <div className="absolute inset-0 bg-primary/10 animate-pulse" />
            <Layers className="text-primary size-7 relative z-10" />
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-transparent animate-spin-slow" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={cn(
          "bg-slate-900/95 backdrop-blur-2xl border-white/10 p-3 rounded-2xl shadow-2xl animate-in zoom-in-95",
          isCollapsed ? "w-56" : "w-72"
        )} side="top" align="center">
          <DropdownMenuLabel className="text-center pb-2 border-b border-white/5 mb-2 text-indigo-400 font-black tracking-widest text-xs">NEXUS OMNI-CONTROL</DropdownMenuLabel>
          
          <ScrollArea className="h-[400px] pr-2">
            <div className="grid grid-cols-1 gap-1">
              {pinnedItems.map((item: NavItem) => (
                <DropdownMenuItem 
                  key={item.id} 
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all text-right flex-row-reverse",
                    activeTab === item.id ? "bg-primary text-white" : "hover:bg-white/5"
                  )}
                >
                  <IconSafe icon={item.icon} className="size-4" />
                  {!isCollapsed && <span className="flex-1 text-xs font-medium">{item.label}</span>}
                </DropdownMenuItem>
              ))}
            </div>
          </ScrollArea>
          <DropdownMenuSeparator className="my-2 bg-white/5" />
          
          {/* Controls Row */}
          <div className="flex items-center justify-between px-1 mb-2">
            <Button 
              variant="ghost" 
              size="sm"
              className={cn("h-7 px-2 rounded-lg text-[9px] font-bold", isCollapsed ? "bg-white/5 text-primary" : "text-white/50")}
              onClick={(e) => { e.stopPropagation(); setCollapsed(!isCollapsed); }}
            >
              <GripHorizontal className="size-3 mr-1" />
              {isCollapsed ? "عرض الأسماء" : "أيقونات فقط"}
            </Button>
            <div onClick={(e) => e.stopPropagation()}>
              <SidebarCustomizeDialog allItems={allItems} isPinned={isPinned} togglePin={togglePin} variant="icon" />
            </div>
          </div>

          <div className="px-2 py-1">
             <p className="text-[9px] text-muted-foreground text-center mb-2 uppercase font-bold tracking-tighter">تثبيت الشريط (Fix Position)</p>
             <div className="grid grid-cols-4 gap-1">
                {[
                  { pos: 'top', icon: ArrowUp, label: 'أعلى' },
                  { pos: 'bottom', icon: ArrowDown, label: 'أسفل' },
                  { pos: 'left', icon: ArrowLeft, label: 'يسار' },
                  { pos: 'right', icon: ArrowRight, label: 'يمين' },
                ].map((btn) => (
                  <button
                    key={btn.pos}
                    onClick={() => setPosition(btn.pos as any)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-primary hover:text-white transition-all group"
                  >
                    <btn.icon className="size-4 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-bold">{btn.label}</span>
                  </button>
                ))}
             </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
