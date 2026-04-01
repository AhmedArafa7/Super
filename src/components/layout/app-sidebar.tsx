'use client';

import React from "react";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter
} from "@/components/ui/sidebar";
import {
  MessageSquare, Video, ShoppingBag, Wallet, LayoutDashboard, Repeat,
  BookOpen, Rocket, MonitorSmartphone, LogOut, Layers, Bell, Library,
  ShieldCheck, GraduationCap, Zap, Microscope, Users, MessageCircle, Cpu, Megaphone, HardDrive, DownloadCloud, Crown, Clock, Tag, HeartPulse, CircuitBoard, Settings, MessageCircleQuestion,
  Search, Play, Pause, Heart, Loader2, Music, Edit3, Headphones, CheckCircle2, ShoppingCart, LibraryBig
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/settings-store";
import { useProStore } from "@/lib/wetube-pro-engine";
import { useSidebarStore } from "@/lib/sidebar-store";
import { ChevronRight, ChevronLeft, EyeOff } from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  restricted: boolean;
  isPermanent?: boolean;
  badge?: number;
};

export const ALL_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard, restricted: false, isPermanent: true },
  { id: "qa", label: "الأسئلة والطلبات", icon: MessageCircleQuestion, restricted: false, isPermanent: true },
  { id: "time", label: "تنظيم الوقت", icon: Clock, restricted: false },
  { id: "health", label: "الصحة والرياضة", icon: HeartPulse, restricted: false },
  { id: "chat", label: "الدردشة الذكية", icon: MessageSquare, restricted: false },
  { id: "agent-ai", label: "المهندس المساعد", icon: Cpu, restricted: false },
  { id: "vault", label: "خزنة الملفات", icon: HardDrive, restricted: false },
  { id: "deals", label: "عروض المحلات", icon: Tag, restricted: false },
  { id: "peer-chat", label: "التواصل المباشر", icon: MessageCircle, restricted: false },
  { id: "stream", label: "WeTube", icon: Video, restricted: false },
  { id: "market", label: "المتجر التقني", icon: ShoppingCart, restricted: false },
  { id: "study-ai", label: "المساعد الدراسي", icon: GraduationCap, restricted: false },
  { id: "knowledge", label: "المكتبة المعرفية", icon: LibraryBig, restricted: false },
  { id: "ads", label: "مركز الإعلانات", icon: Megaphone, restricted: false },
  { id: "downloads", label: "التحميلات", icon: DownloadCloud, restricted: false },
  { id: "launcher", label: "مشغل المواقع", icon: Rocket, restricted: false },
  { id: "wallet", label: "المحفظة الرقمية", icon: Wallet, restricted: false },
  { id: "offers", label: "صندوق العروض", icon: Repeat, restricted: false },
  { id: "learning", label: "التعلم", icon: GraduationCap, restricted: false },
  { id: "micro-ide", label: "برمجة المتحكمات", icon: CircuitBoard, restricted: false },
  { id: "library", label: "المكتبة العامة", icon: Library, restricted: false },
  { id: "lab", label: "المختبر التجريبي", icon: Microscope, restricted: false },
  { id: "directory", label: "دليل المستخدمين", icon: Users, restricted: false },
  { id: "hisn", label: "حصن المسلم", icon: BookOpen, restricted: false },
  { id: "features", label: "المميزات", icon: Zap, restricted: false },
  { id: "notifications", label: "التنبيهات", icon: Bell, restricted: false },
  { id: "settings", label: "الإعدادات", icon: Settings, restricted: false },
  { id: "admin", label: "لوحة الإدارة", icon: ShieldCheck, restricted: true },
];

export function getVisibleNavItems(user: any, settings: any, navItems: NavItem[]) {
  const managementRoles = ['founder', 'cofounder', 'admin', 'management'];
  const hasAdminAccess = user && managementRoles.includes(user.role);
  
  const isBeta = (id: string) => settings?.sections?.[id]?.isBeta ?? false;

  return navItems.filter(item => {
    if (item.restricted && !hasAdminAccess) return false;
    if (isBeta(item.id) && !hasAdminAccess) return false;
    return true;
  });
}

export function AppSidebar({ activeTab, onTabChange, user, logout, isPinned, togglePin, uploadTasks, unreadCount, pendingOffersCount }: any) {
  const { settings } = useSettingsStore();
  const { settings: proSettings } = useProStore();
  const { isCollapsed, setCollapsed, setVisible } = useSidebarStore();
  const isPro = proSettings.frameSkipRatio !== undefined;
  
  const visibleItems = getVisibleNavItems(user, settings, ALL_NAV_ITEMS).map(item => {
    if (item.id === 'offers') return { ...item, badge: pendingOffersCount };
    if (item.id === 'notifications') return { ...item, badge: unreadCount };
    return item;
  });

  const isBeta = (id: string) => settings?.sections?.[id]?.isBeta ?? false;
  const pinnedSidebarItems = visibleItems.filter(item => item.isPermanent || isPinned(item.id));

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-slate-900/50 backdrop-blur-xl transition-all duration-300">
      <SidebarHeader className="p-4 border-b border-white/5 relative group/header">
        <div className={cn(
          "flex items-center gap-3 transition-opacity duration-300",
          isCollapsed ? "justify-center" : "justify-end"
        )}>
          {!isCollapsed && <h1 className="font-headline font-bold text-lg tracking-tight text-white animate-in slide-in-from-left-2 overflow-hidden whitespace-nowrap">NexusAI</h1>}
          <div className="size-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <Layers className="text-white size-5" />
          </div>
        </div>

        {/* Floating Sidebar Controls (Visible on Hover or forced mobile) */}
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-7 rounded-full bg-slate-800 border border-white/10 text-white/60 hover:text-white"
            onClick={() => setCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-7 rounded-full bg-slate-800 border border-white/10 text-white/60 hover:text-white"
            onClick={() => setVisible(false)}
          >
            <EyeOff className="size-3" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarMenu className="gap-2">
          {pinnedSidebarItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={activeTab === item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "h-12 gap-4 px-4 rounded-xl transition-all flex-row-reverse justify-start",
                  activeTab === item.id ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "size-5 shrink-0",
                  item.id === 'admin' && (user?.role === 'founder' ? "text-amber-400" : "text-indigo-400"),
                  item.id === 'time' && "text-primary",
                  item.id === 'micro-ide' && "text-emerald-400",
                  item.id === 'health' && "text-red-400 font-bold",
                  item.id === 'vault' && "text-amber-400",
                  item.id === 'downloads' && "text-primary"
                )} />
                {!isCollapsed && (
                  <>
                    <span className="font-medium animate-in fade-in slide-in-from-right-1">{item.label}</span>
                    {isBeta(item.id) && (
                      <div className="mr-auto text-[8px] px-1.5 h-4 border border-amber-500/30 text-amber-500 font-black tracking-widest uppercase rounded-full flex items-center">BETA</div>
                    )}
                    {item.id === 'stream' && (
                      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-black px-1.5 py-0.5 rounded-md font-black text-[8px] uppercase tracking-tighter mr-auto">PRO</div>
                    )}
                    {item.badge !== undefined && item.badge > 0 && !isBeta(item.id) && (
                      <div className="mr-auto bg-indigo-500 text-white h-5 w-5 flex items-center justify-center text-[10px] rounded-full font-bold">{item.badge}</div>
                    )}
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {!isCollapsed && (
          <div className="mt-8 px-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full border border-dashed border-white/10 h-12 rounded-xl text-[10px] uppercase font-bold text-muted-foreground hover:bg-white/5 gap-3 flex-row-reverse">
                  <MonitorSmartphone className="size-4 text-primary" /> تخصيص القائمة
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
                          <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><item.icon className="size-5" /></div>
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
          <div className="mt-8 px-4 space-y-4">
            <div className="flex items-center gap-2 mb-2 justify-end">
              <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-[0.2em]">مراقب الرفع</p>
              <Zap className="size-3 text-indigo-400 animate-pulse" />
            </div>
            {uploadTasks.map((task: any) => (
              <div key={task.id} className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <div className="flex items-center justify-between gap-2 flex-row-reverse">
                  <p className="text-[10px] text-white font-bold truncate flex-1 text-right">{task.fileName}</p>
                </div>
                <Progress value={task.progress} className="h-1 bg-white/5" />
              </div>
            ))}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto border-t border-white/5">
        <div className={cn(
          "flex items-center gap-3 flex-row-reverse",
          isCollapsed ? "justify-center" : "px-2"
        )}>
          <div className="size-9 rounded-xl bg-indigo-900/50 border border-white/10 overflow-hidden cursor-pointer relative shrink-0" onClick={() => onTabChange("dashboard")}>
            <img src={user?.avatar_url || `https://picsum.photos/seed/${user?.username}/40/40`} className="size-full object-cover" />
            {user?.role === 'founder' && <Crown className="absolute bottom-0 right-0 size-2.5 text-amber-400 bg-black/80 rounded-full p-0.5" />}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-right animate-in fade-in slide-in-from-right-1">
              <p className="text-xs font-bold truncate text-white">{user?.name}</p>
              <p className="text-[9px] text-muted-foreground truncate capitalize">{user?.role === 'founder' ? 'المؤسس' : 'عضو مفعل'}</p>
            </div>
          )}
          {!isCollapsed && <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-white" onClick={logout}><LogOut className="size-4" /></Button>}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
