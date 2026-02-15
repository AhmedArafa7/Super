
"use client";

import React, { useState, useEffect, useRef } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { MessageSquare, Video, ShoppingBag, Zap, Layers, LogOut, Search, Bell, ShoppingCart, User, ShieldCheck, GraduationCap, Wallet, Settings, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getNotifications, AppNotification, clearAllUnreadNotifications } from "@/lib/notification-store";
import { useAuth } from "@/components/auth/auth-provider";
import { LoginView } from "@/components/auth/login-view";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type NavItem = "chat" | "stream" | "market" | "features" | "admin" | "notifications" | "learning" | "wallet" | "dashboard";

export function AppShell() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<NavItem>("chat");
  const [unreadCount, setUnreadCount] = useState(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const updateCount = () => {
      const all = getNotifications(user.id);
      setUnreadCount(all.filter(n => !n.isRead).length);
    };

    updateCount();
    window.addEventListener('notifications-update', updateCount);
    window.addEventListener('storage', updateCount);
    
    return () => {
      window.removeEventListener('notifications-update', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      setActiveTab("admin");
    } else {
      setActiveTab("chat");
    }
  }, [user]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const navItems = [
    { id: "chat", label: "AI Chat", icon: MessageSquare },
    { id: "stream", label: "StreamHub", icon: Video },
    { id: "market", label: "TechMarket", icon: ShoppingBag },
    { id: "wallet", label: "Neural Wallet", icon: Wallet },
    { id: "learning", label: "Knowledge Hub", icon: GraduationCap },
    { id: "features", label: "Capabilities", icon: Zap },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const handleSmartRoute = (n: AppNotification) => {
    switch (n.type) {
      case 'chat_correction':
        if (n.metadata?.messageId) {
          setHighlightId(n.metadata.messageId);
          setActiveTab("chat");
        }
        break;
      case 'content_new':
        setActiveTab("stream");
        break;
      case 'learning_reminder':
        setActiveTab("learning");
        break;
      case 'market_restock':
        setActiveTab("market");
        break;
      case 'system_broadcast':
        setActiveTab("notifications");
        break;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "chat": return <AIChat highlightId={highlightId} onHighlightComplete={() => setHighlightId(null)} />;
      case "stream": return <StreamHub />;
      case "market": return <TechMarket />;
      case "wallet": return <WalletView />;
      case "features": return <Capabilities />;
      case "admin": return user?.role === 'admin' ? <AdminPanel /> : <AIChat />;
      case "learning": return <KnowledgeHub />;
      case "notifications": return <NotificationsView onSmartRoute={handleSmartRoute} />;
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
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Layers className="text-white size-6" />
              </div>
              <div>
                <h1 className="font-headline font-bold text-xl tracking-tight text-white">NexusAI</h1>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Wizard Edition</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3">
            <SidebarMenu className="gap-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => {
                      setActiveTab(item.id as NavItem);
                      if (item.id === 'chat') setHighlightId(null);
                      if (item.id === 'notifications' && user) clearAllUnreadNotifications(user.id);
                    }}
                    className={`h-12 gap-4 px-4 rounded-xl transition-all duration-300 ${
                      activeTab === item.id 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                    tooltip={item.label}
                  >
                    <item.icon className="size-5 shrink-0" />
                    <span className="font-medium">{item.label}</span>
                    {item.id === 'notifications' && unreadCount > 0 && (
                       <Badge className="ml-auto bg-indigo-500 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full border border-slate-900">
                        {unreadCount}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 mt-auto">
            {user?.role === 'admin' && (
              <Button 
                variant="outline" 
                onClick={() => setActiveTab(activeTab === "admin" ? "chat" : "admin")}
                className={`w-full mb-4 h-11 rounded-xl border-white/10 hover:bg-white/5 gap-2 text-xs font-bold ${activeTab === 'admin' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'text-muted-foreground'}`}
              >
                <ShieldCheck className="size-4" />
                {activeTab === "admin" ? "Exit Console" : "Admin Neural Console"}
              </Button>
            )}
            <div className="flex items-center gap-3 px-2">
              <div className="size-8 rounded-full bg-indigo-900/50 border border-white/10 overflow-hidden">
                <img src={user?.avatar_url || `https://picsum.photos/seed/${user?.username}/32/32`} alt="User" className="size-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate capitalize">{user?.role} Node</p>
              </div>
              <LogOut 
                className="size-4 text-muted-foreground cursor-pointer hover:text-white" 
                onClick={logout}
              />
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 z-20 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search Nexus..." 
                  className="w-64 pl-9 h-9 bg-white/5 border-white/10 focus-visible:ring-primary rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "text-muted-foreground hover:text-white relative transition-colors",
                  unreadCount > 0 && "text-indigo-400"
                )}
                onClick={() => setActiveTab("notifications")}
              >
                <Bell className="size-5" />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center"
                    >
                       <Badge className="h-full w-full p-0 bg-red-500 text-[9px] font-bold flex items-center justify-center border border-slate-900">
                        {unreadCount}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
              
              <div className="h-8 w-px bg-white/10 mx-2" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border border-white/10 hover:border-primary/50 transition-colors">
                    <img src={user?.avatar_url || `https://picsum.photos/seed/${user?.username}/32/32`} alt="Profile" className="h-full w-full object-cover" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-950 border-white/10" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-white">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">@{user?.username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={() => setActiveTab("dashboard")} className="hover:bg-white/5 cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>User Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("wallet")} className="hover:bg-white/5 cursor-pointer">
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Neural Wallet</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("features")} className="hover:bg-white/5 cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Node Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={logout} className="text-red-400 hover:bg-red-500/10 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Initiate Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-900/20">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
