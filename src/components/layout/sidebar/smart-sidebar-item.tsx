'use client';

import React from "react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/sidebar-store";
import { IconSafe } from "@/components/ui/icon-safe";
import { SidebarItemContextMenu } from "./sidebar-context-menu";

export function SmartSidebarItem({ item, activeTab, onTabChange, isCollapsed, isBeta }: any) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { position } = useSidebarStore();
  
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  return (
    <SidebarMenuItem onContextMenu={handleRightClick}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} dir="rtl">
        <SidebarMenuButton
          isActive={activeTab === item.id}
          onClick={() => onTabChange(item.id)}
          className={cn(
            "h-12 gap-4 px-4 rounded-xl transition-all justify-start relative group overflow-hidden",
            position === "right" ? "flex-row" : "flex-row-reverse",
            activeTab === item.id ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
          )}
        >
            <IconSafe 
              icon={item.icon} 
              className={cn(
                "size-5 shrink-0 transition-transform group-hover:scale-110",
                item.id === 'time' && "text-primary",
                item.id === 'micro-ide' && "text-emerald-400",
                item.id === 'health' && "text-red-400 font-bold",
                item.id === 'vault' && "text-amber-400",
                item.id === 'downloads' && "text-primary"
              )} 
            />
            {!isCollapsed && (
              <div className={cn(
                "flex items-center gap-2 flex-1 overflow-hidden relative",
                position === "left" ? "pl-9" : "pr-9"
              )}>
                <span className="font-medium truncate animate-in fade-in slide-in-from-right-1">{item.label}</span>
                {isBeta && (
                  <div className="text-[8px] px-1.5 h-4 border border-amber-500/30 text-amber-500 font-black tracking-widest uppercase rounded-full flex items-center shrink-0">BETA</div>
                )}
                {item.id === 'stream' && (
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-black px-1.5 py-0.5 rounded-md font-black text-[8px] uppercase tracking-tighter shrink-0">PRO</div>
                )}
                {item.badge !== undefined && item.badge > 0 && !isBeta && (
                  <div className="mr-auto bg-indigo-500 text-white h-5 w-5 flex items-center justify-center text-[10px] rounded-full font-bold shrink-0">{item.badge}</div>
                )}
                
                <DropdownMenuTrigger asChild>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "size-7 opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded-lg transition-all absolute top-1/2 -translate-y-1/2 z-20",
                      position === "left" ? "left-0" : "right-0"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(true);
                    }}
                   >
                     <MoreVertical className="size-4" />
                   </Button>
                </DropdownMenuTrigger>
              </div>
            )}
          </SidebarMenuButton>

        <SidebarItemContextMenu item={item} onTabChange={onTabChange} />
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
