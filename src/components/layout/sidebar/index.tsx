'use client';

import React from "react";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarFooter
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, 
  DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  Layers, ChevronRight, ChevronLeft, EyeOff, MonitorSmartphone, Zap, 
  UserCircle, LayoutDashboard, Settings, LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { useSettingsStore } from "@/lib/settings-store";
import { useSidebarStore } from "@/lib/sidebar-store";
import { IconSafe } from "@/components/ui/icon-safe";

// Modular Components
import { ALL_NAV_ITEMS, getVisibleNavItems } from "./nav-items";
import { SmartSidebarItem } from "./smart-sidebar-item";
import { FloatingOrb } from "./floating-orb";
import { HorizontalSidebar } from "./horizontal-sidebar";

export function AppSidebar({ activeTab, onTabChange, user, isAuthenticated, logout, isPinned, togglePin, uploadTasks, unreadCount, pendingOffersCount, position }: any) {
  const { settings } = useSettingsStore();
  const { isCollapsed, setCollapsed, setVisible, width, setWidth } = useSidebarStore();
  
  const [isResizing, setIsResizing] = React.useState(false);

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  React.useEffect(() => {
    if (!isResizing || position === 'floating' || position === 'top' || position === 'bottom') return;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = position === "left" ? e.clientX : window.innerWidth - e.clientX;
      if (newWidth < 180) newWidth = 180;
      if (newWidth > 450) newWidth = 450;
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setWidth, position]);
  
  const visibleItems = getVisibleNavItems(user, settings, ALL_NAV_ITEMS, isAuthenticated).map(item => {
    if (item.id === 'offers') return { ...item, badge: pendingOffersCount };
    if (item.id === 'notifications') return { ...item, badge: unreadCount };
    return item;
  });

  const isBeta = (id: string) => settings?.sections?.[id]?.isBeta ?? false;
  const pinnedSidebarItems = visibleItems.filter(item => item.isPermanent || isPinned(item.id));

  // Mode: Floating
  if (position === 'floating') {
    return <FloatingOrb visibleItems={visibleItems} activeTab={activeTab} onTabChange={onTabChange} />;
  }

  // Mode: Horizontal (Top / Bottom)
  if (position === 'top' || position === 'bottom') {
    return <HorizontalSidebar visibleItems={visibleItems} activeTab={activeTab} onTabChange={onTabChange} position={position} />;
  }

  // Mode: Vertical (Standard Sidebar)
  return (
    <Sidebar 
      collapsible="icon" 
      side={position === 'right' ? 'right' : 'left'}
      className={cn(
        "border-r border-white/10 bg-slate-900/50 backdrop-blur-xl transition-all duration-300",
        position === 'right' ? "border-l border-r-0" : "border-r",
        isResizing && "transition-none"
      )}
    >
      {!isCollapsed && (
        <div 
          onMouseDown={startResizing}
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
      )}
      
      <SidebarHeader className="p-4 border-b border-white/5 relative group/header overflow-hidden">
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
      </SidebarHeader>

      <SidebarContent className="p-2 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-2 space-y-4 pb-4">
            <SidebarMenu className="gap-1.5">
              {pinnedSidebarItems.map((item) => (
                <SmartSidebarItem 
                  key={item.id} 
                  item={item} 
                  activeTab={activeTab} 
                  onTabChange={onTabChange} 
                  isCollapsed={isCollapsed} 
                  isBeta={isBeta(item.id)} 
                />
              ))}
            </SidebarMenu>

            {!isCollapsed && (
              <div className="px-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full border border-dashed border-white/10 h-10 rounded-xl text-[10px] uppercase font-bold text-muted-foreground hover:bg-white/5 gap-3 flex-row-reverse">
                      <IconSafe icon={MonitorSmartphone} className="size-4 text-primary" /> تخصيص القائمة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-right">إعدادات القائمة الجانبية</DialogTitle>
                      <DialogDescription className="text-right">اختر الأقسام المفضلة لتثبيتها في شريط التنقل.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[400px] mt-4">
                      <div className="grid grid-cols-1 gap-2 pr-4">
                        {visibleItems.filter(i => !i.isPermanent).map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 glass border-white/5 rounded-2xl hover:bg-white/5 transition-all flex-row-reverse">
                            <div className="flex items-center gap-3 flex-row-reverse">
                              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <IconSafe icon={item.icon} className="size-5" />
                              </div>
                              <span className="font-bold text-sm text-white">{item.label}</span>
                            </div>
                            <Button size="sm" variant={isPinned(item.id) ? "default" : "outline"} className={cn("rounded-lg h-8 px-4", isPinned(item.id) ? "bg-primary" : "border-white/10")} onClick={() => togglePin(item.id)}>
                              {isPinned(item.id) ? "إلغاء التثبيت" : "ثبت"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {uploadTasks.length > 0 && (
              <div className="px-1 space-y-3">
                <div className="flex items-center gap-2 justify-end opacity-50">
                  <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-[0.2em]">مراقب الرفع</p>
                  <IconSafe icon={Zap} className="size-3 text-indigo-400 animate-pulse" />
                </div>
                {uploadTasks.map((task: any) => (
                  <div key={task.id} className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-row-reverse">
                      <p className="text-[9px] text-white font-bold truncate flex-1 text-right">{task.fileName}</p>
                      <span className="text-[8px] text-primary font-black">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-1 bg-white/5" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto border-t border-white/5">
        <div className={cn(
          "flex items-center gap-3",
          position === "right" ? "flex-row" : "flex-row-reverse",
          isCollapsed ? "justify-center" : "px-2"
        )}>
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <div className="size-9 rounded-xl bg-indigo-900/50 border border-white/10 overflow-hidden cursor-pointer relative shrink-0 group/avatar">
                <img src={user?.avatar_url || `https://picsum.photos/seed/${user?.username}/40/40`} className="size-full object-cover group-hover/avatar:scale-110 transition-transform" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-64 bg-slate-900/95 backdrop-blur-2xl border-white/10 text-white p-2 rounded-[1.5rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
              <DropdownMenuLabel className="text-right px-2 py-4">
                <div className="flex items-center gap-3 mb-4 px-2 flex-row-reverse">
                  <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 border border-white/5">
                    <UserCircle className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate">{user?.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">عضو نظام Nexus</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10 mx-2" />
              <div className="p-1">
                <DropdownMenuItem onClick={() => onTabChange("dashboard")} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 rounded-xl transition-all text-right flex-row-reverse group">
                  <LayoutDashboard className="size-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="flex-1 font-bold text-xs text-white/80 group-hover:text-white">لوحة التحكم المركزية</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTabChange("settings")} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 rounded-xl transition-all text-right flex-row-reverse group">
                  <Settings className="size-4 text-muted-foreground group-hover:rotate-45 transition-transform" />
                  <span className="flex-1 font-bold text-xs text-white/80 group-hover:text-white">إعدادات الحساب</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-white/10 mx-2" />
              <div className="p-1">
                <DropdownMenuItem onClick={logout} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-red-500/10 text-red-400 rounded-xl transition-all text-right flex-row-reverse group">
                  <LogOut className="size-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="flex-1 font-black text-xs uppercase tracking-widest">تسجيل الخروج الآمن</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {!isCollapsed && (
            <div className={cn(
              "flex-1 min-w-0 animate-in fade-in slide-in-from-right-1 cursor-default",
              position === "right" ? "text-left" : "text-right"
            )}>
              <p className="text-xs font-bold truncate text-white">{user?.name}</p>
              <p className="text-[9px] text-muted-foreground truncate capitalize">عضو مفعل</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
