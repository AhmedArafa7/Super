'use client';

import React from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Layers, Settings2, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebarStore, SidebarPosition } from "@/lib/sidebar-store";
import { usePreferencesStore } from "@/lib/preferences-store";
import { IconSafe } from "@/components/ui/icon-safe";
import { NavItem } from "./nav-items";
import { SidebarCustomizeDialog } from "./sidebar-customize-dialog";

/**
 * [STABILITY_ANCHOR: HORIZONTAL_SIDEBAR_V2]
 * الشريط الأفقي المحسّن - يدعم:
 * 1. التخصيص (Pinned Items)
 * 2. الوضع المدمج (Icon-Only)
 * 3. تغيير ارتفاع الشريط (Resize Handle)
 */

interface HorizontalSidebarProps {
  pinnedItems: NavItem[];
  allItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  isPinned: (id: string) => boolean;
  togglePin: (id: string) => void;
  isCollapsed: boolean;
  position: SidebarPosition;
}

export function HorizontalSidebar({ pinnedItems, allItems, activeTab, onTabChange, isPinned, togglePin, isCollapsed, position }: HorizontalSidebarProps) {
  const setPosition = useSidebarStore(s => s.setPosition);
  const setCollapsed = useSidebarStore(s => s.setCollapsed);
  const { sidebarIconShortcutEnabled } = usePreferencesStore();

  const handleIconClick = () => {
    if (sidebarIconShortcutEnabled) {
      setPosition('floating');
    }
  };

  return (
    <div className={cn(
      "w-full bg-slate-900/80 backdrop-blur-2xl border-white/5 flex items-center px-4 gap-2 z-50 overflow-x-auto no-scrollbar shrink-0 transition-all duration-300",
      isCollapsed ? "h-14" : "h-16",
      position === 'top' ? "border-b" : "border-t"
    )}>
      {/* Logo / Brand Icon */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div 
          onClick={handleIconClick}
          className={cn(
            "rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 transition-all active:scale-90",
            isCollapsed ? "size-8" : "size-10",
            sidebarIconShortcutEnabled && "cursor-pointer hover:scale-110 hover:bg-primary/30 hover:border-primary/50"
          )}
        >
          <Layers className={cn("text-primary", isCollapsed ? "size-4" : "size-5")} />
        </div>
        <div className="h-8 w-px bg-white/10" />
      </div>
      
      {/* Navigation Items (Pinned Only) */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {pinnedItems.map((item: NavItem) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => onTabChange(item.id)}
            className={cn(
              "rounded-xl gap-2 transition-all flex-row-reverse shrink-0",
              isCollapsed ? "h-8 w-8 p-0" : "h-10 px-4",
              activeTab === item.id ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <IconSafe icon={item.icon} className={cn(isCollapsed ? "size-4" : "size-4")} />
            {!isCollapsed && <span className="text-xs font-bold whitespace-nowrap">{item.label}</span>}
          </Button>
        ))}
      </div>

      {/* Controls */}
      <div className="mr-auto flex items-center gap-1 shrink-0">
        {/* Compact Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("rounded-xl hover:bg-white/5 text-white/50 shrink-0", isCollapsed && "bg-white/5 text-primary")}
          onClick={() => setCollapsed(!isCollapsed)}
          title={isCollapsed ? "عرض الأسماء" : "إخفاء الأسماء"}
        >
          <GripHorizontal className="size-4" />
        </Button>

        {/* Customize Dialog */}
        <SidebarCustomizeDialog allItems={allItems} isPinned={isPinned} togglePin={togglePin} variant="icon" />

        {/* Position Switch */}
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 text-white/50">
               <Settings2 className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-900 border-white/10 text-white p-2 rounded-xl">
             <DropdownMenuItem onClick={() => setPosition('left')} className="text-right">تحويل للوضع الجانبي</DropdownMenuItem>
             <DropdownMenuItem onClick={() => setPosition('floating')} className="text-right">تفعيل الوضع العائم</DropdownMenuItem>
             <DropdownMenuSeparator className="bg-white/5" />
             <DropdownMenuItem onClick={() => setPosition(position === 'top' ? 'bottom' : 'top')} className="text-right">
               {position === 'top' ? 'نقل لأسفل' : 'نقل لأعلى'}
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
