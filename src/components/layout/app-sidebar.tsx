'use client';

import React from "react";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare, Video, ShoppingBag, Wallet, LayoutDashboard, Repeat,
  BookOpen, Rocket, MonitorSmartphone, LogOut, Layers, Bell, Library,
  ShieldCheck, GraduationCap, Zap, Microscope, Users, MessageCircle, Cpu, Megaphone, HardDrive, DownloadCloud, Crown, Clock, Tag, HeartPulse, CircuitBoard, Settings, MessageCircleQuestion,
  Search, Play, Pause, Heart, Loader2, Music, Edit3, Headphones, CheckCircle2, ShoppingCart, LibraryBig, Gamepad2, UserCircle, MoreVertical, ArrowLeftRight
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
import { useSectionSettingsStore } from "@/lib/section-settings-store";
import { ChevronRight, ChevronLeft, EyeOff, Star, Palette, PlusCircle, Settings2, Download, ExternalLink, Activity } from "lucide-react";
import { IconSafe } from "@/components/ui/icon-safe";

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
  { id: "arcade", label: "Nexus Arcade", icon: Gamepad2, restricted: false },
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

export function getVisibleNavItems(user: any, settings: any, navItems: NavItem[], isAuthenticated: boolean = true) {
  const managementRoles = ['founder', 'cofounder', 'admin', 'management'];
  const hasAdminAccess = isAuthenticated && user && managementRoles.includes(user.role);
  
  const isBeta = (id: string) => settings?.sections?.[id]?.isBeta ?? false;

  return navItems.filter(item => {
    if (item.restricted && !hasAdminAccess) return false;
    if (isBeta(item.id) && !hasAdminAccess) return false;
    return true;
  });
}

function SmartSidebarItem({ item, activeTab, onTabChange, isCollapsed, isBeta }: any) {
  const [isOpen, setIsOpen] = React.useState(false);
  const clickTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const { defaultActions, setDefaultAction, toggleSide } = useSectionSettingsStore() as any;
  const { side } = useSidebarStore();
  
  const currentDefaultAction = defaultActions[item.id] || 'open';

  const executeAction = (action: string) => {
    switch (action) {
      case 'open':
        onTabChange(item.id);
        break;
      case 'settings':
        window.dispatchEvent(new CustomEvent('open-section-settings', { detail: { sectionId: item.id } }));
        break;
      case 'design':
        window.dispatchEvent(new CustomEvent('open-section-design', { detail: { sectionId: item.id } }));
        break;
      case 'feature':
        window.dispatchEvent(new CustomEvent('open-section-feature', { detail: { sectionId: item.id } }));
        break;
      case 'preload':
        window.dispatchEvent(new CustomEvent('open-section-preload', { detail: { sectionId: item.id } }));
        break;
      case 'toggle-side':
        useSidebarStore.getState().toggleSide();
        break;
      default:
        onTabChange(item.id);
    }
  };

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
            "h-12 gap-4 px-4 rounded-xl transition-all flex-row-reverse justify-start relative group",
            activeTab === item.id ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
          )}
        >
            <IconSafe 
              icon={item.icon} 
              className={cn(
                "size-5 shrink-0",
                item.id === 'time' && "text-primary",
                item.id === 'micro-ide' && "text-emerald-400",
                item.id === 'health' && "text-red-400 font-bold",
                item.id === 'vault' && "text-amber-400",
                item.id === 'downloads' && "text-primary"
              )} 
            />
            {!isCollapsed && (
              <>
                <span className="font-medium animate-in fade-in slide-in-from-right-1">{item.label}</span>
                {isBeta && (
                  <div className="mr-auto text-[8px] px-1.5 h-4 border border-amber-500/30 text-amber-500 font-black tracking-widest uppercase rounded-full flex items-center">BETA</div>
                )}
                {item.id === 'stream' && (
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-black px-1.5 py-0.5 rounded-md font-black text-[8px] uppercase tracking-tighter mr-auto">PRO</div>
                )}
                {item.badge !== undefined && item.badge > 0 && !isBeta && (
                  <div className="mr-auto bg-indigo-500 text-white h-5 w-5 flex items-center justify-center text-[10px] rounded-full font-bold">{item.badge}</div>
                )}
                
                {/* Options Trigger (Visible on Hover) */}
                <DropdownMenuTrigger asChild>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded-lg transition-all absolute left-2 top-1/2 -translate-y-1/2 z-10"
                    onClick={(e) => e.stopPropagation()}
                   >
                     <MoreVertical className="size-4" />
                   </Button>
                </DropdownMenuTrigger>
              </>
            )}
          </SidebarMenuButton>
        <DropdownMenuContent align="end" side="right" className="w-64 bg-slate-900/95 backdrop-blur-xl border-white/10 text-white p-2 rounded-xl shadow-2xl z-50 animate-in zoom-in-95">
          <DropdownMenuLabel className="text-xs text-indigo-400 opacity-70 px-2 py-1.5 text-right">التحكم في {item.label}</DropdownMenuLabel>
          
          <DropdownMenuSeparator className="bg-white/10" />
          
          <div className="p-1 space-y-0.5">
            <DropdownMenuItem onClick={() => executeAction('open')} className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5">
              <ExternalLink className="size-4 text-white/70" />
              <span className="flex-1 text-right text-sm">فتح القسم</span>
              {currentDefaultAction === 'open' && <Star className="size-3 text-amber-400 fill-amber-400" />}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => executeAction('settings')} className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5">
              <Settings2 className="size-4 text-white/70" />
              <span className="flex-1 text-right text-sm">إعدادات القسم العامة</span>
              {currentDefaultAction === 'settings' && <Star className="size-3 text-amber-400 fill-amber-400" />}
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="bg-white/10" />

          <div className="p-1 space-y-0.5">
            <DropdownMenuItem onClick={() => executeAction('design')} className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5">
              <Palette className="size-4 text-white/70" />
              <span className="flex-1 text-right text-sm">تخصيص المظهر والتصميم</span>
              {currentDefaultAction === 'design' && <Star className="size-3 text-amber-400 fill-amber-400" />}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => executeAction('feature')} className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5 text-emerald-400 hover:text-emerald-300">
              <PlusCircle className="size-4" />
              <span className="flex-1 text-right text-sm font-medium">إضافة ميزات متقدمة</span>
              {currentDefaultAction === 'feature' && <Star className="size-3 text-amber-400 fill-amber-400" />}
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="bg-white/10" />

          <div className="p-1 space-y-0.5">
            <DropdownMenuItem onClick={() => executeAction('preload')} className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5">
              <Download className="size-4 text-white/70" />
              <span className="flex-1 text-right text-sm">تفعيل التحميل المسبق</span>
              {currentDefaultAction === 'preload' && <Star className="size-3 text-amber-400 fill-amber-400" />}
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5">
                <Activity className="size-4 text-white/70" />
                <span className="flex-1 text-right text-sm">إجراء الضغط المزدوج</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-slate-800 border-white/10 text-white p-2 rounded-xl shadow-xl min-w-[180px]">
                <DropdownMenuItem onClick={() => setDefaultAction(item.id, 'open')} className="flex justify-between rtl:flex-row-reverse hover:bg-white/10 py-2 rounded-md">
                  <span className="text-xs">فتح القسم</span>
                  {currentDefaultAction === 'open' && <span className="text-xs">✅</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDefaultAction(item.id, 'settings')} className="flex justify-between rtl:flex-row-reverse hover:bg-white/10 py-2 rounded-md">
                  <span className="text-xs">إعدادات القسم</span>
                  {currentDefaultAction === 'settings' && <span className="text-xs">✅</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDefaultAction(item.id, 'design')} className="flex justify-between rtl:flex-row-reverse hover:bg-white/10 py-2 rounded-md">
                  <span className="text-xs">تعديل التصميم</span>
                  {currentDefaultAction === 'design' && <span className="text-xs">✅</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDefaultAction(item.id, 'preload')} className="flex justify-between rtl:flex-row-reverse hover:bg-white/10 py-2 rounded-md">
                  <span className="text-xs">تحميل القسم</span>
                  {currentDefaultAction === 'preload' && <span className="text-xs">✅</span>}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem onClick={() => executeAction('toggle-side')} className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg py-2.5 text-indigo-300">
              <ArrowLeftRight className="size-4" />
              <span className="flex-1 text-right text-sm font-medium">نقل للشريط {side === "left" ? "الأيمن" : "الأيسر"}</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}



export function AppSidebar({ activeTab, onTabChange, user, isAuthenticated, logout, isPinned, togglePin, uploadTasks, unreadCount, pendingOffersCount }: any) {
  const { settings } = useSettingsStore();
  const { settings: proSettings } = useProStore();
  const { isCollapsed, setCollapsed, setVisible, width, setWidth } = useSidebarStore();
  const isPro = proSettings.frameSkipRatio !== undefined;

  const [isResizing, setIsResizing] = React.useState(false);

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = side === "left" ? e.clientX : window.innerWidth - e.clientX;
      // Constraints
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
  }, [isResizing, setWidth, side]);
  
  const visibleItems = getVisibleNavItems(user, settings, ALL_NAV_ITEMS, isAuthenticated).map(item => {
    if (item.id === 'offers') return { ...item, badge: pendingOffersCount };
    if (item.id === 'notifications') return { ...item, badge: unreadCount };
    return item;
  });

  const isBeta = (id: string) => settings?.sections?.[id]?.isBeta ?? false;
  const pinnedSidebarItems = visibleItems.filter(item => item.isPermanent || isPinned(item.id));

  return (
    <Sidebar 
      collapsible="icon" 
      className={cn(
        "border-r border-white/10 bg-slate-900/50 backdrop-blur-xl transition-all duration-300",
        isResizing && "transition-none"
      )}
    >
      {/* Resize Handle */}
      {!isCollapsed && (
        <div 
          onMouseDown={startResizing}
          className={cn(
            "absolute top-0 h-full w-2 cursor-col-resize z-50 group/rail",
            side === "left" ? "-right-1" : "-left-1",
            isResizing ? "bg-primary/20" : "hover:bg-primary/10"
          )}
        >
          <div className={cn(
            "absolute top-0 h-full w-[1px] transition-colors",
            side === "left" ? "right-1" : "left-1",
            isResizing ? "bg-primary" : "bg-white/5 group-hover/rail:bg-primary/50"
          )} />
        </div>
      )}
      <SidebarHeader className="p-4 border-b border-white/5 relative group/header">
        <div className={cn(
          "flex items-center gap-3 transition-opacity duration-300",
          isCollapsed ? "justify-center" : "justify-end"
        )}>
          {!isCollapsed && <h1 className="font-headline font-bold text-lg tracking-tight text-white animate-in slide-in-from-left-2 overflow-hidden whitespace-nowrap">NexusAI</h1>}
          <div className="size-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shrink-0">
            {Layers && typeof Layers !== 'string' ? (
              <Layers className="text-white size-5" />
            ) : (
              <div className="size-5 bg-white/20 rounded-sm" />
            )}
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
            {isCollapsed ? <IconSafe icon={ChevronLeft} className="size-4" /> : <IconSafe icon={ChevronRight} className="size-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-7 rounded-full bg-slate-800 border border-white/10 text-white/60 hover:text-white"
            onClick={() => setVisible(false)}
          >
            <IconSafe icon={EyeOff} className="size-3" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarMenu className="gap-2">
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
          <div className="mt-8 px-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full border border-dashed border-white/10 h-12 rounded-xl text-[10px] uppercase font-bold text-muted-foreground hover:bg-white/5 gap-3 flex-row-reverse">
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
          <div className="mt-8 px-4 space-y-4">
            <div className="flex items-center gap-2 mb-2 justify-end">
              <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-[0.2em]">مراقب الرفع</p>
              <IconSafe icon={Zap} className="size-3 text-indigo-400 animate-pulse" />
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
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <div className="size-9 rounded-xl bg-indigo-900/50 border border-white/10 overflow-hidden cursor-pointer relative shrink-0 group/avatar">
                <img src={user?.avatar_url || `https://picsum.photos/seed/${user?.username}/40/40`} className="size-full object-cover group-hover/avatar:scale-110 transition-transform" />
                {user?.role === 'founder' && (Crown && typeof Crown !== 'string' ? <Crown className="absolute bottom-0 right-0 size-2.5 text-amber-400 bg-black/80 rounded-full p-0.5" /> : null)}
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
                    <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">
                      {user?.role === 'founder' ? 'المالك والمؤسس' : 'عضو نظام Nexus'}
                    </p>
                  </div>
                </div>
                <div className="mx-2 bg-white/5 border border-white/5 p-2.5 rounded-xl flex items-center justify-between flex-row-reverse">
                   <span className="text-[9px] font-black text-indigo-400/70 uppercase tracking-widest">Session Status</span>
                   <div className="flex items-center gap-2 flex-row-reverse">
                      <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-bold">متصل</span>
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
            <div className="flex-1 min-w-0 text-right animate-in fade-in slide-in-from-right-1 cursor-default">
              <p className="text-xs font-bold truncate text-white">{user?.name}</p>
              <p className="text-[9px] text-muted-foreground truncate capitalize">{user?.role === 'founder' ? 'المؤسس' : 'عضو مفعل'}</p>
            </div>
          )}
          {!isCollapsed && (
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg" onClick={logout}>
              <LogOut className="size-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
