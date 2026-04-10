'use client';

import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { X, ExternalLink, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, hexToHSL } from "@/lib/utils";
import { AIChat } from "@/components/features/ai-chat";
import { PeerChat } from "@/components/features/peer-chat";
import { WeTube } from "@/components/features/wetube";
import { TechMarket } from "@/components/features/tech-market";
import { ModulesGuide } from "@/components/features/modules-guide";
import { AdminPanel } from "@/components/features/admin-panel";
import { NotificationsView } from "@/components/features/notifications-view";
import { KnowledgeHub } from "@/components/features/knowledge-hub";
import { WalletView } from "@/components/features/wallet-view";
import { UserDashboard } from "@/components/features/user-dashboard";
import { OffersInbox } from "@/components/features/offers-inbox";
import { HisnAlMuslim } from "@/components/features/hisn-al-muslim";
import { PersistentPlayer } from "@/components/features/persistent-player";
import { AppLauncher } from "@/components/features/app-launcher";
import { StudyQuizView } from "@/components/features/study-ai/study-quiz-view";
import { NeuralLab } from "@/components/features/neural-lab";
import { NodeDirectory } from "@/components/features/node-directory";
import { AgentAI } from "@/components/features/agent-ai";
import { AdsCenter } from "@/components/features/ads-center";
import { VaultExplorer } from "@/components/features/vault-explorer";
import { DownloadCenter } from "@/components/features/download-center";
import { TimeManagement } from "@/components/features/time-management";
import { LocalDeals } from "@/components/features/local-deals";
import { HealthView } from "@/components/features/health-view";
import { LibraryView } from "@/components/features/library/library-view";
import { MicrocontrollerLab } from "@/components/features/microcontroller-lab";
import { SettingsView } from "@/components/features/settings-view";
import { getNotifications } from "@/lib/notification-store";
import { useWalletStore } from "@/lib/wallet-store";
import { useUploadStore } from "@/lib/upload-store";
import { useStreamStore } from "@/lib/stream-store";
import { useSidebarStore, NavItemId } from "@/lib/sidebar-store";
import { getReceivedOffers } from "@/lib/market-store";
import { useAuth } from "@/components/auth/auth-provider";
import { LoginView } from "@/components/auth/login-view";
import { toast } from "@/hooks/use-toast";
import { AppSidebar, getVisibleNavItems, ALL_NAV_ITEMS } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { DulmsLayout } from "./dulms-layout";
import { SafeComponentWrapper, SidebarFallback } from "./safe-component-wrapper";
import { IconSafe } from "@/components/ui/icon-safe";
import { getThemeBySlug } from "@/lib/theme-store";
import { useSettingsStore } from "@/lib/settings-store";
import { QAView } from "@/components/features/qa-view";

const VAULT_EMBED_URL = "https://drive.google.com/embeddedfolderview?id=16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g#list";
const VAULT_SHARE_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

/**
 * [STABILITY_ANCHOR: APPSHELL_ORCHESTRATOR_V8.0]
 * المكون المركزي المحدث - تم إضافة قسم تنظيم الوقت.
 */
export function AppShell() {
  const { user, isAuthenticated, logout } = useAuth();
  const { settings } = useSettingsStore();
  
  // Dynamic Initial Tab Logic
  const [activeTab, setActiveTab] = useState<NavItemId>("chat"); // Default safe fallback
  const [hasInitializedTab, setHasInitializedTab] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && settings && !hasInitializedTab) {
      const visible = getVisibleNavItems(user, settings, ALL_NAV_ITEMS);
      // If "dashboard" is visible, use it, otherwise use the first visible item
      const initial = visible.some(i => i.id === 'dashboard') 
        ? "dashboard" 
        : (visible[0]?.id as NavItemId || "chat");
      setActiveTab(initial);
      setHasInitializedTab(true);
    }
  }, [isAuthenticated, user, settings, hasInitializedTab]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOffersCount, setPendingOffersCount] = useState(0);

  const [activeRecipientId, setActiveRecipientId] = useState<string | undefined>(undefined);
  const [launchedApp, setLaunchedApp] = useState<{ url: string, title: string, isVault?: boolean } | null>(null);

  const setCurrentTab = useStreamStore(state => state.setCurrentTab);
  const { isPinned, togglePin, isCollapsed, isVisible, setCollapsed } = useSidebarStore();
  const uploadTasks = useUploadStore(state => state.tasks);
  const initSettingsListener = useSettingsStore(state => state.initSettingsListener);

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
  if (activeThemeSlug && activeThemeSlug !== 'nexus') {
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

    const visibleItems = getVisibleNavItems(user, settings, ALL_NAV_ITEMS);
    const isTabVisible = visibleItems.some(item => item.id === activeTab);

    // Protection Layer: if tab is not visible/allowed, fallback to a safe component or "Access Denied"
    if (!isTabVisible && activeTab !== 'notifications' && activeTab !== 'settings') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in duration-500">
          <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
            <X className="size-10" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">منطقة مقيدة</h2>
          <p className="text-muted-foreground max-w-md">أنت لا تملك صلاحية الوصول لهذا القسم حالياً (نسخة Beta أو مقيد للإدارة).</p>
          <Button 
            variant="outline" 
            className="mt-8 rounded-xl border-white/10"
            onClick={() => setActiveTab(visibleItems[0]?.id as NavItemId || "qa")}
          >العودة للأقسام المتاحة</Button>
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
      case "ads": return <AdsCenter />;
      case "downloads": return <DownloadCenter />;
      case "peer-chat": return <PeerChat initialTargetId={activeRecipientId} />;
      case "stream": return <WeTube onOpenVault={() => setLaunchedApp({ url: VAULT_EMBED_URL, title: "Nexus Central Vault", isVault: true })} />;
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
      case "library": return <LibraryView />;
      case "hisn": return <HisnAlMuslim />;
      case "notifications": return <NotificationsView onSmartRoute={() => { }} />;
      case "settings": return <SettingsView />;
      default: return <UserDashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <SidebarProvider open={!isCollapsed} onOpenChange={setCollapsed}>
      <div className="flex min-h-screen w-full bg-background hero-gradient overflow-hidden relative">
        {isVisible && (
          <SafeComponentWrapper name="AppSidebar" fallback={<SidebarFallback />}>
            <AppSidebar
              activeTab={activeTab} onTabChange={(id: any) => { setActiveTab(id); setLaunchedApp(null); setActiveRecipientId(undefined); }}
              user={user} logout={logout} isPinned={isPinned} togglePin={togglePin}
              uploadTasks={uploadTasks} unreadCount={unreadCount} pendingOffersCount={pendingOffersCount}
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

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <SafeComponentWrapper name="AppHeader">
            <AppHeader unreadCount={unreadCount} onTabChange={setActiveTab} onNavigateToWallet={() => setActiveTab("wallet")} />
          </SafeComponentWrapper>
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
    </SidebarProvider>
  );
}
