'use client';

import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIChat } from "@/components/features/ai-chat";
import { PeerChat } from "@/components/features/peer-chat";
import { WeTube } from "@/components/features/wetube";
import { TechMarket } from "@/components/features/tech-market";
import { Capabilities } from "@/components/features/capabilities";
import { AdminPanel } from "@/components/features/admin-panel";
import { NotificationsView } from "@/components/features/notifications-view";
import { KnowledgeHub } from "@/components/features/knowledge-hub";
import { WalletView } from "@/components/features/wallet-view";
import { UserDashboard } from "@/components/features/user-dashboard";
import { OffersInbox } from "@/components/features/offers-inbox";
import { HisnAlMuslim } from "@/components/features/hisn-al-muslim";
import { PersistentPlayer } from "@/components/features/persistent-player";
import { AppLauncher } from "@/components/features/app-launcher";
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
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { DulmsLayout } from "./dulms-layout";
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
  const [activeTab, setActiveTab] = useState<NavItemId>("dashboard");
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOffersCount, setPendingOffersCount] = useState(0);

  const [activeRecipientId, setActiveRecipientId] = useState<string | undefined>(undefined);
  const [launchedApp, setLaunchedApp] = useState<{ url: string, title: string, isVault?: boolean } | null>(null);

  const setCurrentTab = useStreamStore(state => state.setCurrentTab);
  const { isPinned, togglePin } = useSidebarStore();
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

  if (!isAuthenticated) return <LoginView />;

  // Theme Routing: slug-based check from the centralized registry
  const activeThemeSlug = user?.activeTheme;
  if (activeThemeSlug && activeThemeSlug !== 'nexus') {
    const themeDef = getThemeBySlug(activeThemeSlug);
    if (themeDef) {
      // Map slug → layout component
      if (activeThemeSlug === 'dulms') return <DulmsLayout user={user as any} />;
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
      case "launcher": return <AppLauncher />;
      case "wallet": return <WalletView />;
      case "offers": return <OffersInbox />;
      case "deals": return <LocalDeals />;
      case "lab": return <NeuralLab />;
      case "directory": return <NodeDirectory onNavigate={(tab, payload) => {
        if (tab === 'peer-chat' && payload) handleNavigateToPeerChat(payload);
        else setActiveTab(tab);
      }} />;
      case "features": return <Capabilities />;
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background hero-gradient overflow-hidden">
        <AppSidebar
          activeTab={activeTab} onTabChange={(id: any) => { setActiveTab(id); setLaunchedApp(null); setActiveRecipientId(undefined); }}
          user={user} logout={logout} isPinned={isPinned} togglePin={togglePin}
          uploadTasks={uploadTasks} unreadCount={unreadCount} pendingOffersCount={pendingOffersCount}
        />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <AppHeader unreadCount={unreadCount} onTabChange={setActiveTab} onNavigateToWallet={() => setActiveTab("wallet")} />
          <main className="flex-1 overflow-y-auto relative bg-slate-900/20">{renderContent()}</main>
        </div>
      </div>
      <PersistentPlayer />
    </SidebarProvider>
  );
}
