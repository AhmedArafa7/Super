'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { X, ExternalLink, Layers, LogOut, ShieldCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, hexToHSL } from "@/lib/utils";
import dynamic from 'next/dynamic';

// Dynamic Loaders for Heavy Features (Phase 1 Optimization)
const AIChat = dynamic(() => import("@/components/features/ai-chat").then(m => m.AIChat), { ssr: false });
const PeerChat = dynamic(() => import("@/components/features/peer-chat").then(m => m.PeerChat), { ssr: false });
const WeTube = dynamic(() => import("@/components/features/wetube").then(m => m.WeTube), { ssr: false });
const TechMarket = dynamic(() => import("@/components/features/tech-market").then(m => m.TechMarket), { ssr: false });
const ModulesGuide = dynamic(() => import("@/components/features/modules-guide").then(m => m.ModulesGuide), { ssr: false });
const AdminPanel = dynamic(() => import("@/components/features/admin-panel").then(m => m.AdminPanel), { ssr: false });
const NotificationsView = dynamic(() => import("@/components/features/notifications-view").then(m => m.NotificationsView), { ssr: false });
const KnowledgeHub = dynamic(() => import("@/components/features/knowledge-hub").then(m => m.KnowledgeHub), { ssr: false });
const WalletView = dynamic(() => import("@/components/features/wallet-view").then(m => m.WalletView), { ssr: false });
const UserDashboard = dynamic(() => import("@/components/features/user-dashboard").then(m => m.UserDashboard), { ssr: false });
const OffersInbox = dynamic(() => import("@/components/features/offers-inbox").then(m => m.OffersInbox), { ssr: false });
const HisnAlMuslim = dynamic(() => import("@/components/features/hisn-al-muslim").then(m => m.HisnAlMuslim), { ssr: false });
const PersistentPlayer = dynamic(() => import("@/components/features/persistent-player").then(m => m.PersistentPlayer), { ssr: false });
const AppLauncher = dynamic(() => import("@/components/features/app-launcher").then(m => m.AppLauncher), { ssr: false });
const StudyQuizView = dynamic(() => import("@/components/features/study-ai/study-quiz-view").then(m => m.StudyQuizView), { ssr: false });
const NeuralLab = dynamic(() => import("@/components/features/neural-lab").then(m => m.NeuralLab), { ssr: false });
const NodeDirectory = dynamic(() => import("@/components/features/node-directory").then(m => m.NodeDirectory), { ssr: false });
const AgentAI = dynamic(() => import("@/components/features/agent-ai").then(m => m.AgentAI), { ssr: false });
const AdsCenter = dynamic(() => import("@/components/features/ads-center").then(m => m.AdsCenter), { ssr: false });
const VaultExplorer = dynamic(() => import("@/components/features/vault-explorer").then(m => m.VaultExplorer), { ssr: false });
const DownloadCenter = dynamic(() => import("@/components/features/download-center").then(m => m.DownloadCenter), { ssr: false });
const TimeManagement = dynamic(() => import("@/components/features/time-management").then(m => m.TimeManagement), { ssr: false });
const LocalDeals = dynamic(() => import("@/components/features/local-deals").then(m => m.LocalDeals), { ssr: false });
const HealthView = dynamic(() => import("@/components/features/health-view").then(m => m.HealthView), { ssr: false });
const LibraryView = dynamic(() => import("@/components/features/library/library-view").then(m => m.LibraryView), { ssr: false });
const MicrocontrollerLab = dynamic(() => import("@/components/features/microcontroller-lab").then(m => m.MicrocontrollerLab), { ssr: false });
const SettingsView = dynamic(() => import("@/components/features/settings-view").then(m => m.SettingsView), { ssr: false });
const ArcadeHub = dynamic(() => import("@/components/features/arcade/arcade-hub").then(m => m.ArcadeHub), { ssr: false });
const SiNeuroSheets = dynamic(() => import("@/components/features/nexus-sheets").then(m => m.SiNeuroSheets), { ssr: false });
const WeTubeStudioView = dynamic(() => import("@/components/features/wetube/wetube-studio-view").then(m => m.WeTubeStudioView), { ssr: false });
const QAView = dynamic(() => import("@/components/features/qa-view").then(m => m.QAView), { ssr: false });

import { getNotifications } from "@/lib/notification-store";
import { useUploadStore } from "@/lib/upload-store";
import { useStreamStore } from "@/lib/stream-store";
import { useSidebarStore, NavItemId } from "@/lib/sidebar-store";
import { getReceivedOffers } from "@/lib/market-store";
import { useAuth } from "@/components/auth/auth-provider";
import { LoginView } from "@/components/auth/login-view";
import { AppSidebar, getVisibleNavItems, ALL_NAV_ITEMS } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { DulmsLayout } from "./dulms-layout";
import { SafeComponentWrapper, SidebarFallback } from "./safe-component-wrapper";
import { IconSafe } from "@/components/ui/icon-safe";
import { getThemeBySlug } from "@/lib/theme-store";
import { useSettingsStore } from "@/lib/settings-store";
import { SectionSettingsModal } from "./section-settings-modal";

const VAULT_EMBED_URL = "https://drive.google.com/embeddedfolderview?id=16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g#list";
const VAULT_SHARE_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

/**
 * [STABILITY_ANCHOR: APPSHELL_ORCHESTRATOR_V8.0]
 */
export function AppShell() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white font-bold animate-pulse">جاري تحميل النظام...</div>}>
       <AppShellInternal />
    </Suspense>
  );
}

function AppShellInternal() {
  const { user, isAuthenticated, logout } = useAuth();
  const settings = useSettingsStore(s => s.settings);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Dynamic Initial Tab Logic
  const [activeTab, setActiveTab] = useState<NavItemId>("dashboard"); // Start with dashboard
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // 1. Sync State with URL on Load
  useEffect(() => {
    const tabParam = searchParams.get('tab') as NavItemId;
    if (tabParam && ALL_NAV_ITEMS.some(item => item.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 2. Sync URL with State on Change
  useEffect(() => {
    if (activeTab) {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (current.get('tab') !== activeTab) {
        current.set('tab', activeTab);
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.replace(`${pathname}${query}`);
      }
    }
  }, [activeTab, pathname, router, searchParams]);

  useEffect(() => {
    if (isAuthenticated && user && settings) {
      if (user.id !== lastUserId) {
        const visible = getVisibleNavItems(user, settings, ALL_NAV_ITEMS, isAuthenticated);
        // Reset to dashboard if available, else first visible
        const initial = visible.some(i => i.id === 'dashboard') 
          ? "dashboard" 
          : (visible[0]?.id as NavItemId || "chat");
        setActiveTab(initial);
        setLastUserId(user.id);
      }
    } else if (!isAuthenticated) {
      setLastUserId(null);
    }
  }, [isAuthenticated, user, settings, lastUserId]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOffersCount, setPendingOffersCount] = useState(0);

  const [activeRecipientId, setActiveRecipientId] = useState<string | undefined>(undefined);
  const [launchedApp, setLaunchedApp] = useState<{ url: string, title: string, isVault?: boolean } | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // Phase 3: Atomic Selectors — each value has its own subscription
  // so changing 'width' won't re-render components that only read 'position'
  // ═══════════════════════════════════════════════════════════════
  const isCollapsed = useSidebarStore(s => s.isCollapsed);
  const isVisible = useSidebarStore(s => s.isVisible);
  const isHeaderVisible = useSidebarStore(s => s.isHeaderVisible);
  const toggleHeader = useSidebarStore(s => s.toggleHeader);
  const width = useSidebarStore(s => s.width);
  const position = useSidebarStore(s => s.position);
  const isPinned = useSidebarStore(s => s.isPinned);
  const togglePin = useSidebarStore(s => s.togglePin);
  const setCollapsed = useSidebarStore(s => s.setCollapsed);

  const setCurrentTab = useStreamStore(s => s.setCurrentTab);
  const uploadTasks = useUploadStore(s => s.tasks);
  const initSettingsListener = useSettingsStore(s => s.initSettingsListener);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab, setCurrentTab]);

  useEffect(() => {
    const unsubSettings = initSettingsListener();
    return () => unsubSettings();
  }, [initSettingsListener]);

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
    return () => window.removeEventListener('notifications-update', updateCount);
  }, [isAuthenticated, user]);

  // CSS Variables Injection for Custom Themes
  useEffect(() => {
    if (user?.customThemeDef && user.activeTheme === user.customThemeDef.slug) {
      const colors = user.customThemeDef.customColors;
      if (colors?.primary) document.documentElement.style.setProperty('--primary', hexToHSL(colors.primary));
      if (colors?.background) document.documentElement.style.setProperty('--background', hexToHSL(colors.background));
    } else {
       document.documentElement.style.removeProperty('--primary');
       document.documentElement.style.removeProperty('--background');
    }
  }, [user]);

  if (!isAuthenticated) return <LoginView />;

  // Theme Routing: slug-based check from the centralized registry or Custom defined layout Engine
  const activeThemeSlug = user?.activeTheme;
  if (activeThemeSlug && activeThemeSlug !== 'Si-Neuro') {
    // Check if it's a hardcoded theme
    const themeDef = getThemeBySlug(activeThemeSlug);
    if (themeDef) {
      if (themeDef.layoutEngine === 'dulms') return <DulmsLayout user={user as any} />;
    }
    // Check if it's a dynamic custom built theme
    if (user?.customThemeDef && activeThemeSlug === user.customThemeDef.slug) {
      if (user.customThemeDef.layoutEngine === 'dulms') return <DulmsLayout user={user as any} />;
    }
  }

  const handleNavigateToPeerChat = (userId: string) => {
    setActiveRecipientId(userId);
    setActiveTab("peer-chat");
  };

  const renderContent = () => {
    if (launchedApp) {
      return (
        <div className="flex flex-col h-full bg-black animate-in fade-in duration-500">
          <header className="h-14 border-b border-white/5 bg-slate-900 flex items-center justify-between px-6 shrink-0 flex-row-reverse">
            <div className="flex items-center gap-3 flex-row-reverse">
              <h2 className="text-sm font-bold text-white">{launchedApp.title}</h2>
              <div className="flex items-center gap-2 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] uppercase font-black text-green-400 tracking-tighter">Vault Protocol Active</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {launchedApp.isVault && <Button variant="outline" size="sm" onClick={() => window.open(VAULT_SHARE_URL, '_blank')} className="h-8 rounded-lg px-4 font-bold text-xs gap-2 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10"><ExternalLink className="size-3" /> فتح نافذة مستقلة</Button>}
              <Button variant="destructive" size="sm" onClick={() => setLaunchedApp(null)} className="h-8 rounded-lg px-4 font-bold text-xs gap-2"><X className="size-3" /> إغلاق العقدة</Button>
            </div>
          </header>
          <iframe src={launchedApp.url} className="flex-1 w-full border-none bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" title={launchedApp.title} />
        </div>
      );
    }

    const visibleItems = getVisibleNavItems(user, settings, ALL_NAV_ITEMS, isAuthenticated);
    const isTabVisible = visibleItems.some(item => item.id === activeTab);

    // Protection Layer: if tab is not visible/allowed, fallback to a safe component or "Access Denied"
    if (!isTabVisible && activeTab !== 'notifications' && activeTab !== 'settings') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-12 animate-in fade-in zoom-in duration-700 bg-slate-950/40 backdrop-blur-3xl">
          <div className="size-24 bg-gradient-to-br from-red-500/20 to-amber-500/20 rounded-full flex items-center justify-center text-red-500 mb-8 border border-white/10 shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]">
            <ShieldCheck className="size-12" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">هذه المنطقة مغلقة</h2>
          <p className="text-muted-foreground max-w-sm leading-relaxed">
            يتطلب الوصول لهذه الميزة صلاحيات إدارية أو اشتراكاً نشطاً. 
            يرجى التأكد من أنك مسجل دخولك بالحساب الصحيح.
          </p>
          <div className="flex items-center gap-4 mt-12">
            <Button 
              variant="outline" 
              className="rounded-2xl border-white/10 h-12 px-8 font-bold hover:bg-white/5 transition-all"
              onClick={() => setActiveTab(visibleItems[0]?.id as NavItemId || "qa")}
            >العودة للأقسام المتاحة</Button>
            <Button 
              variant="ghost" 
              className="rounded-2xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-12 px-8 font-bold gap-2 group"
              onClick={logout}
            >
              <LogOut className="size-4 group-hover:-translate-x-1 transition-transform" />
              تغيير الحساب
            </Button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "qa": return <QAView />;
      case "dashboard": return <UserDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case "time": return <TimeManagement />;
      case "health": return <HealthView />;
      case "chat": return <AIChat />;
      case "agent-ai": return <AgentAI />;
      case "vault": return <VaultExplorer />;
      case "sheets": return <SiNeuroSheets />;
      case "ads": return <AdsCenter />;
      case "downloads": return <DownloadCenter />;
      case "peer-chat": return <PeerChat initialTargetId={activeRecipientId} />;
      case "stream": return <WeTube onOpenVault={() => setLaunchedApp({ url: VAULT_EMBED_URL, title: "Si-Neuro Central Vault", isVault: true })} />;
      case "wetube-studio": return <WeTubeStudioView />;
      case "market": return <TechMarket onLaunchApp={(url, title) => setLaunchedApp({ url, title })} />;
      case "study-ai": return <StudyQuizView />;
      case "launcher": return <AppLauncher />;
      case "wallet": return <WalletView />;
      case "offers": return <OffersInbox />;
      case "deals": return <LocalDeals />;
      case "lab": return <NeuralLab />;
      case "directory": return <NodeDirectory onNavigate={(tab, payload) => {
        if (tab === 'peer-chat' && payload) handleNavigateToPeerChat(payload);
        else setActiveTab(tab);
      }} />;
      case "features": return <ModulesGuide onNavigate={(tab: string) => setActiveTab(tab as NavItemId)} />;
      case "micro-ide": return <MicrocontrollerLab />;
      case "admin":
        if (['founder', 'cofounder', 'admin', 'management'].includes(user?.role || '')) return <AdminPanel />;
        return <UserDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case "learning": return <KnowledgeHub />;
      case "arcade": return <ArcadeHub />;
      case "library": return <LibraryView />;
      case "hisn": return <HisnAlMuslim />;
      case "notifications": return <NotificationsView onSmartRoute={() => { }} />;
      case "settings": return <SettingsView />;
      default: return <UserDashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <SidebarProvider 
      id="main-sidebar-provider"
      open={!isCollapsed && position !== 'floating'} 
      onOpenChange={setCollapsed}
      style={{ "--sidebar-width": (position === 'top' || position === 'bottom') ? '100%' : `${width}px` } as React.CSSProperties}
    >
      <div className={cn(
        "flex min-h-screen w-full bg-background hero-gradient overflow-hidden relative",
        position === "right" && "flex-row-reverse",
        position === "top" && "flex-col",
        position === "bottom" && "flex-col-reverse"
      )}>
        {isVisible && (
          <SafeComponentWrapper name="AppSidebar" fallback={<SidebarFallback />}>
            <AppSidebar
              activeTab={activeTab} onTabChange={(id: any) => { setActiveTab(id); setLaunchedApp(null); setActiveRecipientId(undefined); }}
              user={user} isAuthenticated={isAuthenticated} logout={logout} isPinned={isPinned} togglePin={togglePin}
              uploadTasks={uploadTasks} unreadCount={unreadCount} pendingOffersCount={pendingOffersCount}
              position={position}
            />
          </SafeComponentWrapper>
        )}

        {/* Floating Trigger when Sidebar is Hidden */}
        {!isVisible && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-4 left-4 z-50 size-10 rounded-2xl bg-slate-900/80 border border-white/10 text-primary shadow-2xl backdrop-blur-md hover:scale-110 transition-all animate-in zoom-in-50"
            onClick={() => useSidebarStore.getState().setVisible(true)}
          >
            <IconSafe icon={Layers} className="size-5" />
          </Button>
        )}

        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Header Restore Trigger (When hidden) */}
          {!isHeaderVisible && (
            <div className="absolute top-0 inset-x-0 h-1 z-[100] group flex justify-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-6 rounded-full bg-slate-900/60 border border-white/10 text-white/40 hover:text-white hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 -translate-y-1 hover:translate-y-1"
                onClick={toggleHeader}
              >
                <IconSafe icon={ChevronDown} className="size-4" />
              </Button>
            </div>
          )}

          {isHeaderVisible && (
            <SafeComponentWrapper name="AppHeader">
              <AppHeader 
                unreadCount={unreadCount} 
                onTabChange={setActiveTab} 
                onNavigateToWallet={() => setActiveTab("wallet")} 
                onToggleHeader={toggleHeader}
              />
            </SafeComponentWrapper>
          )}
          <main className={cn(
            "flex-1 overflow-y-auto relative transition-colors duration-500",
            isVisible ? "bg-slate-900/20" : "bg-slate-900/40"
          )}>
            <SafeComponentWrapper name={`ContentNode:${activeTab}`}>
              {renderContent()}
            </SafeComponentWrapper>
          </main>
        </div>
      </div>
      <SafeComponentWrapper name="PersistentPlayer">
        <PersistentPlayer />
      </SafeComponentWrapper>
      <SectionSettingsModal />
    </SidebarProvider>
  );
}
