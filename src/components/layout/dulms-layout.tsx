"use client";

/**
 * [STABILITY_ANCHOR: DULMS_LAYOUT_V2.0]
 * تصميم DULMS — إعادة تصميم كاملة لـ AppShell بنمط جامعة الدلتا.
 * هذا ليس نسخة بصرية فارغة، بل هو shell حقيقي يعرض جميع أقسام المشروع
 * بتصميم DULMS (ألوان، تخطيط، خطوط).
 */

import React, { useState, useEffect } from "react";
import {
    LayoutDashboard, Clock, MessageSquare, Cpu, HardDrive,
    MessageCircle, Video, ShoppingBag, Megaphone, DownloadCloud,
    Rocket, Wallet, GraduationCap, Microscope,
    Users, BookOpen, Zap, Bell, Tag, CircuitBoard, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/lib/auth/types";
import { activateTheme } from "@/lib/theme-store";
import { NavItemId } from "@/lib/sidebar-store";
import { useStreamStore } from "@/lib/stream-store";
import { getNotifications } from "@/lib/notification-store";
import { getReceivedOffers } from "@/lib/market-store";
import { PersistentPlayer } from "@/components/features/persistent-player";
import { DulmsHeader } from "./dulms/dulms-header";
import { DulmsSidebar } from "./dulms/dulms-sidebar";

// Views (same as AppShell)
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
import { AppLauncher } from "@/components/features/app-launcher";
import { NeuralLab } from "@/components/features/neural-lab";
import { NodeDirectory } from "@/components/features/node-directory";
import { AgentAI } from "@/components/features/agent-ai";
import { AdsCenter } from "@/components/features/ads-center";
import { VaultExplorer } from "@/components/features/vault-explorer";
import { DownloadCenter } from "@/components/features/download-center";
import { TimeManagement } from "@/components/features/time-management";
import { LocalDeals } from "@/components/features/local-deals";
import { MicrocontrollerLab } from "@/components/features/microcontroller-lab";
import { SettingsView } from "@/components/features/settings-view";

const VAULT_EMBED_URL = "https://drive.google.com/embeddedfolderview?id=16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g#list";

interface DulmsLayoutProps {
    user: User | null;
}

// Navigation items grouped by category for the DULMS sidebar
const NAV_GROUPS = [
    {
        label: "الرئيسية",
        items: [
            { id: "dashboard" as NavItemId, label: "لوحة التحكم", icon: LayoutDashboard },
            { id: "time" as NavItemId, label: "تنظيم الوقت", icon: Clock },
            { id: "notifications" as NavItemId, label: "التنبيهات", icon: Bell },
            { id: "settings" as NavItemId, label: "الإعدادات", icon: Settings },
        ]
    },
    {
        label: "الذكاء الاصطناعي",
        items: [
            { id: "chat" as NavItemId, label: "الدردشة الذكية", icon: MessageSquare },
            { id: "agent-ai" as NavItemId, label: "المهندس المساعد", icon: Cpu },
            { id: "lab" as NavItemId, label: "المختبر التجريبي", icon: Microscope },
        ]
    },
    {
        label: "التواصل والمحتوى",
        items: [
            { id: "peer-chat" as NavItemId, label: "التواصل المباشر", icon: MessageCircle },
            { id: "stream" as NavItemId, label: "WeTube", icon: Video },
            { id: "directory" as NavItemId, label: "دليل المستخدمين", icon: Users },
        ]
    },
    {
        label: "الأدوات والخدمات",
        items: [
            { id: "market" as NavItemId, label: "المتجر التقني", icon: ShoppingBag },
            { id: "deals" as NavItemId, label: "عروض المحلات", icon: Tag },
            { id: "vault" as NavItemId, label: "خزنة الملفات", icon: HardDrive },
            { id: "wallet" as NavItemId, label: "المحفظة الرقمية", icon: Wallet },
            { id: "ads" as NavItemId, label: "مركز الإعلانات", icon: Megaphone },
            { id: "downloads" as NavItemId, label: "التحميلات", icon: DownloadCloud },
            { id: "launcher" as NavItemId, label: "مشغل المواقع", icon: Rocket },
        ]
    },
    {
        label: "المعرفة",
        items: [
            { id: "learning" as NavItemId, label: "المكتبة المعرفية", icon: GraduationCap },
            { id: "hisn" as NavItemId, label: "حصن المسلم", icon: BookOpen },
            { id: "micro-ide" as NavItemId, label: "برمجة المتحكمات", icon: CircuitBoard },
            { id: "features" as NavItemId, label: "المميزات", icon: Zap },
        ]
    },
];

export function DulmsLayout({ user }: DulmsLayoutProps) {
    const [activeTab, setActiveTab] = useState<NavItemId>("dashboard");
    const [showDropdown, setShowDropdown] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState<string | null>("الرئيسية");
    const [unreadCount, setUnreadCount] = useState(0);
    const [pendingOffersCount, setPendingOffersCount] = useState(0);
    const [activeRecipientId, setActiveRecipientId] = useState<string | undefined>(undefined);
    const [launchedApp, setLaunchedApp] = useState<{ url: string; title: string; isVault?: boolean } | null>(null);

    const setCurrentTab = useStreamStore(state => state.setCurrentTab);
    const isDark = user?.themeMode === 'dark';
    const hasAdminAccess = user && ['founder', 'cofounder', 'admin', 'management'].includes(user.role);

    useEffect(() => {
        setCurrentTab(activeTab);
    }, [activeTab, setCurrentTab]);

    useEffect(() => {
        if (!user) return;
        const updateCount = async () => {
            const all = getNotifications(user.id);
            setUnreadCount(all.filter(n => !n.isRead).length);
            const offers = await getReceivedOffers(user.id);
            setPendingOffersCount(offers.filter(o => o.status === 'pending').length);
        };
        updateCount();
        window.addEventListener('notifications-update', updateCount);
        return () => window.removeEventListener('notifications-update', updateCount);
    }, [user]);

    const handleExitDulms = async () => {
        if (user?.id) {
            await activateTheme(user.id, 'nexus');
            window.location.reload();
        }
    };

    const handleNavigateToPeerChat = (userId: string) => {
        setActiveRecipientId(userId);
        setActiveTab("peer-chat");
    };

    // Find which group contains the active tab and expand it
    const getGroupForTab = (tab: NavItemId): string | null => {
        for (const group of NAV_GROUPS) {
            if (group.items.some(item => item.id === tab)) return group.label;
        }
        return null;
    };

    const handleTabChange = (id: NavItemId) => {
        setActiveTab(id);
        setLaunchedApp(null);
        setActiveRecipientId(undefined);
        const group = getGroupForTab(id);
        if (group) setExpandedGroup(group);
    };

    // Badge count for a nav item
    const getBadge = (id: NavItemId): number | undefined => {
        if (id === 'notifications') return unreadCount > 0 ? unreadCount : undefined;
        if (id === 'offers') return pendingOffersCount > 0 ? pendingOffersCount : undefined;
        return undefined;
    };

    // Content renderer — identical logic to AppShell
    const renderContent = () => {
        if (launchedApp) {
            return (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                    <header className={cn(
                        "h-12 flex items-center justify-between px-4 shrink-0 border-b",
                        isDark ? "bg-[#151822] border-white/5" : "bg-[#ecf0f1] border-slate-200"
                    )}>
                        <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-700")}>{launchedApp.title}</span>
                        <button onClick={() => setLaunchedApp(null)} className="text-xs text-red-400 font-bold hover:text-red-300">✕ إغلاق</button>
                    </header>
                    <iframe src={launchedApp.url} className="flex-1 w-full border-none bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" title={launchedApp.title} />
                </div>
            );
        }

        switch (activeTab) {
            case "dashboard": return <UserDashboard onNavigate={(tab) => handleTabChange(tab)} />;
            case "time": return <TimeManagement />;
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
                else handleTabChange(tab);
            }} />;
            case "features": return <Capabilities />;
            case "micro-ide": return <MicrocontrollerLab />;
            case "admin":
                if (hasAdminAccess) return <AdminPanel />;
                return <UserDashboard onNavigate={(tab) => handleTabChange(tab)} />;
            case "learning": return <KnowledgeHub />;
            case "hisn": return <HisnAlMuslim />;
            case "notifications": return <NotificationsView onSmartRoute={() => { }} />;
            case "settings": return <SettingsView />;
            default: return <UserDashboard onNavigate={(tab) => handleTabChange(tab)} />;
        }
    };

    return (
        <div className={cn(
            "min-h-screen w-full flex flex-col font-sans transition-colors duration-300",
            isDark ? "bg-[#0f111a] text-slate-200" : "bg-[#ecf0f1] text-[#333]"
        )}>

            <DulmsHeader
                user={user}
                isDark={isDark}
                hasAdminAccess={!!hasAdminAccess}
                unreadCount={unreadCount}
                showDropdown={showDropdown}
                setShowDropdown={setShowDropdown}
                onTabChange={handleTabChange}
                onExitDulms={handleExitDulms}
            />

            {/* ─── Main Layout ─── */}
            <div className="flex flex-1 overflow-hidden h-[calc(100vh-50px)]">

                <DulmsSidebar
                    user={user}
                    isDark={isDark}
                    hasAdminAccess={!!hasAdminAccess}
                    activeTab={activeTab}
                    expandedGroup={expandedGroup}
                    setExpandedGroup={setExpandedGroup}
                    onTabChange={handleTabChange}
                    getBadge={getBadge}
                    navGroups={NAV_GROUPS}
                />

                {/* ─── Main Content ─── */}
                <main className={cn(
                    "flex-1 overflow-y-auto",
                    isDark ? "bg-[#0f111a]" : "bg-[#ecf0f1]"
                )}>
                    {renderContent()}
                </main>
            </div>

            <PersistentPlayer />
        </div>
    );
}
