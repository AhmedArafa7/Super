
"use client";

import React, { useState, useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { MessageSquare, Video, ShoppingBag, Zap, Layers, LogOut, Search, Bell, ShieldCheck, GraduationCap, Wallet, Settings, LayoutDashboard, Repeat, Loader2, CheckCircle2, AlertCircle, Sparkles, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AIChat } from "@/components/features/ai-chat";
import { StreamHub } from "@/components/features/stream-hub";
import { TechMarket } from "@/components/features/tech-market";
import { Capabilities } from "@/components/features/capabilities";
import { AdminPanel } from "@/components/features/admin-panel";
import { NotificationsView } from "@/components/features/notifications-view";
import { KnowledgeHub } from "@/components/features/knowledge-hub";
import { WalletView } from "@/components/features/wallet-view";
import { UserDashboard } from "@/components/features/user-dashboard";
import { OffersInbox } from "@/components/features/offers-inbox";
import { HisnAlMuslim } from "@/components/features/hisn-al-muslim";
import { PersistentPlayer } from "@/components/features/persistent-player"; // المشغل الجديد
import { getNotifications } from "@/lib/notification-store";
import { useWalletStore } from "@/lib/wallet-store";
import { useUploadStore } from "@/lib/upload-store";
import { getReceivedOffers } from "@/lib/market-store";
import { useAuth } from "@/components/auth/auth-provider";
import { LoginView } from "@/components/auth/login-view";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type NavItem = "chat" | "stream" | "market" | "features" | "admin" | "notifications" | "learning" | "wallet" | "dashboard" | "offers" | "hisn";

export function AppShell() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<NavItem>("dashboard");
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOffersCount, setPendingOffersCount] = useState(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  
  const processOfflineQueue = useWalletStore(state => state.processOfflineQueue);
  const uploadTasks = useUploadStore(state => state.tasks);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const updateCount = async () => {
      const all = getNotifications(user.id);
      setUnreadCount(all.filter(n => !n.isRead).length);
      const offers = await getReceivedOffers(user.id);
      setPendingOffersCount(offers.filter(o => o.status === 'pending').length);
    };

    updateCount();
    window.addEventListener('notifications-update', updateCount);
    
    const handleOnline = () => {
      if (user?.id) {
        toast({ title: "Neural Link Restored", description: "Synchronizing offline data..." });
        processOfflineQueue(user.id);
      }
    };
    window.addEventListener('online', handleOnline);
    if (navigator.onLine && user?.id) processOfflineQueue(user.id);

    return () => {
      window.removeEventListener('notifications-update', updateCount);
      window.removeEventListener('online', handleOnline);
    };
  }, [isAuthenticated, user, processOfflineQueue]);

  if (!isAuthenticated) return <LoginView />;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "chat", label: "AI Chat", icon: MessageSquare },
    { id: "stream", label: "StreamHub", icon: Video },
    { id: "market", label: "TechMarket", icon: ShoppingBag },
    { id: "wallet", label: "Neural Wallet", icon: Wallet },
    { id: "offers", label: "Offers Inbox", icon: Repeat, badge: pendingOffersCount },
    { id: "learning", label: "Knowledge Hub", icon: GraduationCap },
    { id: "hisn", label: "حصن المسلم", icon: BookOpen },
    { id: "features", label: "Capabilities", icon: Zap },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "admin", label: "Admin Panel", icon: ShieldCheck },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <UserDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case "chat": return <AIChat highlightId={highlightId} onHighlightComplete={() => setHighlightId(null)} />;
      case "stream": return <StreamHub />;
      case "market": return <TechMarket />;
      case "wallet": return <WalletView />;
      case "offers": return <OffersInbox />;
      case "features": return <Capabilities />;
      case "admin": return <AdminPanel />;
      case "learning": return <KnowledgeHub />;
      case "hisn": return <HisnAlMuslim />;
      case "notifications": return <NotificationsView onSmartRoute={() => {}} />;
      default: return <UserDashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background hero-gradient overflow-hidden">
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
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id as NavItem)}
                    className={cn(
                      "h-12 gap-4 px-4 rounded-xl transition-all flex-row-reverse justify-start",
                      activeTab === item.id 
                        ? (item.id === 'admin' ? "bg-indigo-600 text-white shadow-lg" : "bg-primary text-white shadow-lg") 
                        : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    <item.icon className={cn("size-5", item.id === 'admin' && "text-indigo-400")} />
                    <span className="font-medium">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                       <Badge className="mr-auto bg-indigo-500 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            {uploadTasks.length > 0 && (
              <div className="mt-8 px-4 space-y-4">
                <div className="flex items-center gap-2 mb-2 justify-end">
                  <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-[0.2em]">Neural Sync Monitor</p>
                  <Sparkles className="size-3 text-indigo-400 animate-pulse" />
                </div>
                {uploadTasks.map(task => (
                  <div key={task.id} className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between gap-2 flex-row-reverse">
                      <p className="text-[10px] text-white font-bold truncate flex-1 text-right">{task.fileName}</p>
                      {task.status === 'uploading' && <Loader2 className="size-3 animate-spin text-indigo-400" />}
                      {task.status === 'preparing' && <div className="size-2 rounded-full bg-indigo-400 animate-ping" />}
                      {task.status === 'completed' && <CheckCircle2 className="size-3 text-green-400" />}
                      {task.status === 'failed' && <AlertCircle className="size-3 text-red-400" />}
                    </div>
                    <Progress value={task.progress} className="h-1.5 bg-white/5" />
                    <div className="flex justify-between items-center text-[8px] text-muted-foreground uppercase font-bold flex-row-reverse">
                      <span>{task.status === 'preparing' ? 'Establishing Link...' : task.status}</span>
                      <span>{task.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="p-4 mt-auto border-t border-white/5">
            <div className="flex items-center gap-3 px-2 flex-row-reverse">
              <div 
                className="size-10 rounded-2xl bg-indigo-900/50 border border-white/10 overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => setActiveTab("dashboard")}
              >
                <img src={user?.avatar_url || `https://picsum.photos/seed/${user?.username}/40/40`} className="size-full object-cover" alt="Profile" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p dir="auto" className="text-sm font-bold truncate text-white">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate capitalize">{user?.role} Node</p>
              </div>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-white" onClick={logout}>
                <LogOut className="size-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 z-20 flex-row-reverse">
            <div className="flex items-center gap-4 flex-row-reverse">
              <SidebarTrigger className="md:hidden" />
              <div className="relative hidden md:block">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Scan Nexus..." className="w-64 pr-9 h-9 bg-white/5 border-white/10 rounded-lg text-sm text-right" />
              </div>
            </div>
            <div className="flex items-center gap-4 flex-row-reverse">
              <Button variant="ghost" size="icon" className="text-muted-foreground relative" onClick={() => setActiveTab("notifications")}>
                <Bell className="size-5" />
                {unreadCount > 0 && <Badge className="absolute top-2 left-2 h-4 w-4 p-0 flex items-center justify-center bg-red-500 border border-slate-900 text-[9px]">{unreadCount}</Badge>}
              </Button>
              <div className="h-8 w-px bg-white/10" />
              <Button 
                variant="outline" 
                className="h-9 px-4 rounded-xl border-white/10 gap-2 text-xs font-bold text-white hover:bg-white/5 flex-row-reverse"
                onClick={() => setActiveTab("wallet")}
              >
                <Wallet className="size-4 text-primary" />
                Neural Credits
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto relative bg-slate-900/20">
            {renderContent()}
          </main>
        </div>
      </div>
      
      {/* مشغل الفيديو العالمي - يظهر فوق كل شيء عند تفعيل فيديو */}
      <PersistentPlayer />
    </SidebarProvider>
  );
}
