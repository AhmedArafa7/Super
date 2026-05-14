'use client';

import React from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Layers, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/sidebar-store";
import { usePreferencesStore } from "@/lib/preferences-store";
import { IconSafe } from "@/components/ui/icon-safe";

export function HorizontalSidebar({ visibleItems, activeTab, onTabChange, position }: any) {
  const { setPosition } = useSidebarStore();
  const { sidebarIconShortcutEnabled } = usePreferencesStore();

  const handleIconClick = () => {
    if (sidebarIconShortcutEnabled) {
      setPosition('floating');
    }
  };

  return (
    <div className={cn(
      "w-full h-16 bg-slate-900/80 backdrop-blur-2xl border-white/5 flex items-center px-6 gap-2 z-50 overflow-x-auto no-scrollbar shrink-0",
      position === 'top' ? "border-b" : "border-t"
    )}>
      <div className="flex items-center gap-4 shrink-0 ml-4">
        <div 
          onClick={handleIconClick}
          className={cn(
            "size-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 transition-all active:scale-90",
            sidebarIconShortcutEnabled && "cursor-pointer hover:scale-110 hover:bg-primary/30 hover:border-primary/50"
          )}
        >
          <Layers className="text-primary size-5" />
        </div>
        <div className="h-8 w-px bg-white/10" />
      </div>
      
      <div className="flex items-center gap-1">
        {visibleItems.map((item: any) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => onTabChange(item.id)}
            className={cn(
              "h-10 px-4 rounded-xl gap-2 transition-all flex-row-reverse",
              activeTab === item.id ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            <IconSafe icon={item.icon} className="size-4" />
            <span className="text-xs font-bold whitespace-nowrap">{item.label}</span>
          </Button>
        ))}
      </div>

      <div className="mr-auto flex items-center gap-2">
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 text-white/50">
               <Settings2 className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-900 border-white/10 text-white p-2 rounded-xl">
             <DropdownMenuItem onClick={() => useSidebarStore.getState().setPosition('left')} className="text-right">تحويل للوضع الجانبي</DropdownMenuItem>
             <DropdownMenuItem onClick={() => useSidebarStore.getState().setPosition('floating')} className="text-right">تفعيل الوضع العائم</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
