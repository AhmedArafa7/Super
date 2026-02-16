
"use client";

import React, { useState, useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { MessageSquare, Video, ShoppingBag, Zap, Layers, LogOut, Search, Bell, ShieldCheck, GraduationCap, Wallet, Settings, LayoutDashboard, Repeat, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { getNotifications, AppNotification, clearAllUnreadNotifications } from "@/lib/notification-store";
import { useWalletStore } from "@/lib/wallet-store";
import { useUploadStore } from "@/lib/upload-store";
import { getReceivedOffers } from "@/lib/market-store";
import { useAuth } from "@/components/auth/auth-provider";
import { LoginView } from "@/components/auth/login-view";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type NavItem = "chat" | "stream" | "market" | "features" | "admin" | "notifications" | "learning" | "wallet" | "dashboard" | "offers";

export function AppShell() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<NavItem>("chat");
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
    { id: "chat", label: "AI Chat", icon: MessageSquare },
    { id: "stream", label: "StreamHub", icon: Video },
    { id: "market", label: "TechMarket", icon: ShoppingBag },
    { id: "wallet", label: "Neural Wallet", icon: Wallet },
    { id: "offers", label: "Offers Inbox", icon: Repeat, badge: pendingOffersCount },
    { id: "learning", label: "Knowledge Hub", icon: GraduationCap },
    { id: "features", label: "Capabilities", icon: Zap },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "chat": return <AIChat highlightId={highlightId} onHighlightComplete={() => setHighlightId(null)} />;
      case "stream": return <StreamHub />;
      case "market": return <TechMarket />;
      case "wallet": return <WalletView />;
      case "offers": return <OffersInbox />;
      case "features": return <Capabilities />;
      case "admin": return user?.role === 'admin' ? <AdminPanel /> : <AIChat />;
      case "learning": return <KnowledgeHub />;
      case "notifications": return <NotificationsView onSmartRoute={() => {}} />;
      case "dashboard": return <UserDashboard />;
      default: return <AIChat />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background hero-gradient overflow-hidden">
        <Sidebar className="border-r border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Layers className="text-white size-6" />
              </div>
              <h1 className="font-headline font-bold text-xl tracking-tight text-white">NexusAI</h1>
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
                      "h-12 gap-4 px-4 rounded-xl transition-all",
                      activeTab === item.id ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    <item.icon className="size-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                       <Badge className="ml-auto bg-indigo-500 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            {/* عرض مهام الرفع الجارية في الخلفية */}
            {uploadTasks.length > 0 && (
              <div className="mt-8 px-4 space-y-4">
                <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-[0.2em]">Background Tasks</p>
                {uploadTasks.map(task => (
                  <div key={task.id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-white font-bold truncate flex-1">{task.fileName}</p>
                      {task.status === 'uploading' && <Loader2 className="size-3 animate-spin text-indigo-400" />}
                      {task.status === 'completed' && <CheckCircle2 className="size-3 text-green-400" />}
                      {task.status === 'failed' && <AlertCircle className="size-3 text-red-400" />}
                    </div>
                    <Progress value={task.progress} className="h-1 bg-white/5" />
                    <div className="flex justify-between items-center text-[8px] text-muted-foreground uppercase font-bold">
                      <span>{task.status}</span>
                      <span>{task.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="p-4 mt-auto">
            <div className="flex items-center gap-3 px-2">
              <div className="size-8 rounded-full bg-indigo-900/50 border border-white/10 overflow-hidden">
                <img src={user?.avatar_url || `https://picsum.photos/seed/${user?.username}/32/32`} className="size-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate capitalize">{user?.role} Node</p>
              </div>
              <LogOut className="size-4 text-muted-foreground cursor-pointer hover:text-white" onClick={logout} />
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 z-20">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Scan Nexus..." className="w-64 pl-9 h-9 bg-white/5 border-white/10 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-muted-foreground relative" onClick={() => setActiveTab("notifications")}>
                <Bell className="size-5" />
                {unreadCount > 0 && <Badge className="absolute top-2 right-2 h-4 w-4 p-0 flex items-center justify-center bg-red-500 border border-slate-900 text-[9px]">{unreadCount}</Badge>}
              </Button>
              <div className="h-8 w-px bg-white/10" />
              <div className="size-10 rounded-full border border-white/10 overflow-hidden cursor-pointer" onClick={() => setActiveTab("dashboard")}>
                <img src={user?.avatar_url || `https://picsum.photos/seed/${user?.username}/32/32`} className="size-full object-cover" />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto relative bg-slate-900/20">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
