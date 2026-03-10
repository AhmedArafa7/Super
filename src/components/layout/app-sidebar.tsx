'use client';

import React from "react";
import { 
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter 
} from "@/components/ui/sidebar";
import { 
  MessageSquare, Video, ShoppingBag, Wallet, LayoutDashboard, Repeat, 
  BookOpen, Rocket, MonitorSmartphone, LogOut, Layers, Bell, 
  ShieldCheck, GraduationCap, Zap, Microscope, Users, MessageCircle, Cpu, Megaphone, HardDrive, DownloadCloud, Crown, Clock, Tag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function AppSidebar({ activeTab, onTabChange, user, logout, isPinned, togglePin, uploadTasks, unreadCount, pendingOffersCount }: any) {
  const managementRoles = ['founder', 'cofounder', 'admin', 'management'];
  const hasAdminAccess = user && managementRoles.includes(user.role);

  const ALL_NAV_ITEMS = [
    { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard, restricted: false },
    { id: "time", label: "تنظيم الوقت", icon: Clock, restricted: false },
    { id: "chat", label: "الدردشة الذكية", icon: MessageSquare, restricted: false },
    { id: "agent-ai", label: "المهندس المساعد", icon: Cpu, restricted: false },
    { id: "vault", label: "خزنة الملفات", icon: HardDrive, restricted: false },
    { id: "deals", label: "عروض المحلات", icon: Tag, restricted: false },
    { id: "peer-chat", label: "التواصل المباشر", icon: MessageCircle, restricted: false },
    { id: "stream", label: "WeTube", icon: Video, restricted: false },
    { id: "market", label: "المتجر التقني", icon: ShoppingBag, restricted: false },
    { id: "ads", label: "مركز الإعلانات", icon: Megaphone, restricted: false },
    { id: "downloads", label: "التحميلات", icon: DownloadCloud, restricted: false },
    { id: "launcher", label: "مشغل المواقع", icon: Rocket, restricted: false },
    { id: "wallet", label: "المحفظة الرقمية", icon: Wallet, restricted: false },
    { id: "offers", label: "صندوق العروض", icon: Repeat, badge: pendingOffersCount, restricted: false },
    { id: "learning", label: "المكتبة المعرفية", icon: GraduationCap, restricted: false },
    { id: "lab", label: "المختبر التجريبي", icon: Microscope, restricted: false },
    { id: "directory", label: "دليل المستخدمين", icon: Users, restricted: false },
    { id: "hisn", label: "عقدة الإيمان", icon: BookOpen, restricted: false },
    { id: "features", label: "المميزات", icon: Zap, restricted: false },
    { id: "notifications", label: "التنبيهات", icon: Bell, badge: unreadCount, restricted: false },
    { id: "admin", label: "لوحة الإدارة", icon: ShieldCheck, restricted: true },
  ];

  const visibleItems = ALL_NAV_ITEMS.filter(item => !item.restricted || hasAdminAccess);
  const pinnedSidebarItems = visibleItems.filter(item => isPinned(item.id));

  return (
    <Sidebar className="border-r border-white/10 bg-slate-900/50 backdrop-blur-xl">
      <SidebarHeader className="p-6 text-right">
        <div className="flex items-center gap-3 justify-end">
          <h1 className="font-headline font-bold text-xl tracking-tight text-white">NexusAI</h1>
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Layers className="text-white size-6" />
          </div>
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
                  "size-5", 
                  item.id === 'admin' && (user?.role === 'founder' ? "text-amber-400" : "text-indigo-400"), 
                  item.id === 'time' && "text-primary",
                  item.id === 'vault' && "text-amber-400", 
                  item.id === 'downloads' && "text-primary"
                )} />
                <span className="font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                   <Badge className="mr-auto bg-indigo-500 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">{item.badge}</Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

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
                  {visibleItems.filter(i => i.id !== 'dashboard').map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 glass border-white/5 rounded-2xl hover:bg-white/5 transition-all flex-row-reverse">
                      <div className="flex items-center gap-3 flex-row-reverse">
                        <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><item.icon className="size-5" /></div>
                        <span className="font-bold text-sm text-white">{item.label}</span>
                      </div>
                      <Button size="sm" variant={isPinned(item.id) ? "default" : "outline"} className={cn("rounded-lg h-8 px-4", isPinned(item.id) ? "bg-primary" : "border-white/10")} onClick={() => togglePin(item.id)}>
                        {isPinned(item.id) ? "إلغاء التثبيت" : "تثبيت"}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

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

      <SidebarFooter className="p-4 mt-auto border-t border-white/5">
        <div className="flex items-center gap-3 px-2 flex-row-reverse">
          <div className="size-10 rounded-2xl bg-indigo-900/50 border border-white/10 overflow-hidden cursor-pointer relative" onClick={() => onTabChange("dashboard")}>
            <img src={user?.avatar_url || `https://picsum.photos/seed/${user?.username}/40/40`} className="size-full object-cover" />
            {user?.role === 'founder' && <Crown className="absolute bottom-0 right-0 size-3 text-amber-400 bg-black/80 rounded-full p-0.5" />}
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-sm font-bold truncate text-white">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate capitalize">{user?.role === 'founder' ? 'المؤسس' : 'عضو مفعل'}</p>
          </div>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-white" onClick={logout}><LogOut className="size-4" /></Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
