'use client';

import React from "react";
import { Sidebar, SidebarContent, SidebarMenu } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";

import { useSettingsStore } from "@/lib/settings-store";
import { useSidebarStore } from "@/lib/sidebar-store";
import { IconSafe } from "@/components/ui/icon-safe";

// Modular LEGO Components
import { ALL_NAV_ITEMS, getVisibleNavItems, User, UploadTask } from "./nav-items";
import { SmartSidebarItem } from "./smart-sidebar-item";
import { FloatingOrb } from "./floating-orb";
import { HorizontalSidebar } from "./horizontal-sidebar";
import { SidebarHeader } from "./sidebar-header";
import { SidebarFooter } from "./sidebar-footer";
import { UploadMonitor } from "./upload-monitor";
import { ResizeHandle } from "./resize-handle";
import { useSidebarLayout } from "./use-sidebar-layout";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
  isPinned: (id: string) => boolean;
  togglePin: (id: string) => void;
  uploadTasks: UploadTask[];
  unreadCount: number;
  pendingOffersCount: number;
  position: 'left' | 'right' | 'top' | 'bottom' | 'floating';
}

export function AppSidebar({ 
  activeTab, onTabChange, user, isAuthenticated, logout, isPinned, 
  togglePin, uploadTasks, unreadCount, pendingOffersCount 
}: AppSidebarProps) {
  const { settings } = useSettingsStore();
  const { setWidth } = useSidebarStore();
  const { isCollapsed, position, isFloating, isHorizontal } = useSidebarLayout();
  
  const [isResizing, setIsResizing] = React.useState(false);

  const sidebarRef = React.useRef<HTMLDivElement>(null);

  // Resize Orchestration (Optimized 60 FPS)
  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // Prevent text selection
  }, []);

  React.useEffect(() => {
    if (!isResizing || isFloating || isHorizontal) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = position === "left" ? e.clientX : window.innerWidth - e.clientX;
      if (newWidth < 180) newWidth = 180;
      if (newWidth > 450) newWidth = 450;
      
      // High-Performance Direct DOM Update
      const provider = document.getElementById('main-sidebar-provider');
      if (provider) {
        provider.style.setProperty('--sidebar-width', `${newWidth}px`);
      }
      
      if (sidebarRef.current) {
        sidebarRef.current.style.width = `${newWidth}px`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      let finalWidth = position === "left" ? e.clientX : window.innerWidth - e.clientX;
      if (finalWidth < 180) finalWidth = 180;
      if (finalWidth > 450) finalWidth = 450;
      
      setWidth(finalWidth);
      setIsResizing(false);
      
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setWidth, position, isFloating, isHorizontal]);
  
  // Data Orchestration
  const visibleItems = getVisibleNavItems(user, settings, ALL_NAV_ITEMS, isAuthenticated).map(item => {
    if (item.id === 'offers') return { ...item, badge: pendingOffersCount };
    if (item.id === 'notifications') return { ...item, badge: unreadCount };
    return item;
  });

  const isBeta = (id: string) => settings?.sections?.[id]?.isBeta ?? false;
  const pinnedSidebarItems = visibleItems.filter(item => item.isPermanent || isPinned(item.id));

  // RENDER: Floating Mode
  if (isFloating) {
    return <FloatingOrb visibleItems={visibleItems} activeTab={activeTab} onTabChange={onTabChange} />;
  }

  // RENDER: Horizontal Mode (Top / Bottom)
  if (isHorizontal) {
    return <HorizontalSidebar visibleItems={visibleItems} activeTab={activeTab} onTabChange={onTabChange} position={position} />;
  }

  // RENDER: Vertical Mode (Standard Sidebar)
  return (
    <Sidebar 
      ref={sidebarRef}
      collapsible="icon" 
      side={position === 'right' ? 'right' : 'left'}
      className={cn(
        "border-r border-white/10 bg-slate-900/50 backdrop-blur-xl transition-all duration-300",
        position === 'right' ? "border-l border-r-0" : "border-r",
        isResizing && "transition-none"
      )}
    >
      <ResizeHandle onMouseDown={startResizing} isResizing={isResizing} />
      
      <SidebarHeader />

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

            <UploadMonitor tasks={uploadTasks} />
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter user={user} logout={logout} onTabChange={onTabChange} />
    </Sidebar>
  );
}
