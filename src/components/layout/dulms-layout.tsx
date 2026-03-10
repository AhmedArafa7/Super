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
    Rocket, Wallet, Repeat, GraduationCap, Microscope,
    Users, BookOpen, Zap, Bell, ShieldCheck,
    ChevronDown, LogOut, Settings, ChevronRight, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/lib/auth/types";
import { activateTheme } from "@/lib/theme-store";
import { NavItemId, useSidebarStore } from "@/lib/sidebar-store";
import { useStreamStore } from "@/lib/stream-store";
import { useUploadStore } from "@/lib/upload-store";
import { getNotifications } from "@/lib/notification-store";
import { getReceivedOffers } from "@/lib/market-store";
import { PersistentPlayer } from "@/components/features/persistent-player";

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
            case "admin":
                if (hasAdminAccess) return <AdminPanel />;
                return <UserDashboard onNavigate={(tab) => handleTabChange(tab)} />;
            case "learning": return <KnowledgeHub />;
            case "hisn": return <HisnAlMuslim />;
            case "notifications": return <NotificationsView onSmartRoute={() => { }} />;
            default: return <UserDashboard onNavigate={(tab) => handleTabChange(tab)} />;
        }
    };

    return (
        <div className={cn(
            "min-h-screen w-full flex flex-col font-sans transition-colors duration-300",
            isDark ? "bg-[#0f111a] text-slate-200" : "bg-[#ecf0f1] text-[#333]"
        )}>

            {/* ─── Top Navbar ─── */}
            <header className={cn(
                "h-[50px] w-full flex items-center justify-between px-4 shrink-0 transition-colors z-20 shadow-sm",
                isDark ? "bg-[#151822] border-b border-white/5" : "bg-[#34495e] text-white"
            )}>
                <div className="flex items-center gap-2">
                    <div className="flex flex-col select-none">
                        <span className="text-[#f1c40f] font-black text-xl leading-none tracking-wide">DULMS</span>
                        <span className={cn("text-[8px] uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-300")}>
                            NexusAI — Theme Edition
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-5 mr-2">
                    {/* Notifications badge */}
                    <button onClick={() => handleTabChange('notifications')} className="relative">
                        <Bell className={cn("size-4", isDark ? "text-slate-400" : "text-white/80")} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 size-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Wallet shortcut */}
                    <button onClick={() => handleTabChange('wallet')} className="relative">
                        <Wallet className={cn("size-4", isDark ? "text-slate-400" : "text-white/80")} />
                    </button>

                    {/* User Dropdown */}
                    <div className="relative pl-4 border-l border-white/20">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                            <div className="size-8 rounded-full border border-white/30 overflow-hidden flex items-center justify-center bg-white/10 shrink-0">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="User" className="size-full object-cover" />
                                ) : (
                                    <span className="text-white text-xs">{user?.name?.charAt(0) || "U"}</span>
                                )}
                            </div>
                            <div className="hidden sm:flex items-center gap-1">
                                <span className="text-sm font-medium">{user?.name || 'مستخدم'}</span>
                                <ChevronDown className="size-3 opacity-70" />
                            </div>
                        </button>

                        {showDropdown && (
                            <div className={cn(
                                "absolute top-full right-0 mt-2 w-52 rounded-md shadow-lg py-1 border z-50",
                                isDark ? "bg-[#1e2130] border-white/10" : "bg-white border-slate-200"
                            )}>
                                <button
                                    onClick={() => { handleTabChange('dashboard'); setShowDropdown(false); }}
                                    className={cn(
                                        "w-full text-right px-4 py-2.5 text-sm flex items-center gap-2 flex-row-reverse transition-colors",
                                        isDark ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                                    )}
                                >
                                    <Settings className="size-4" />
                                    الإعدادات
                                </button>
                                {hasAdminAccess && (
                                    <button
                                        onClick={() => { handleTabChange('admin'); setShowDropdown(false); }}
                                        className={cn(
                                            "w-full text-right px-4 py-2.5 text-sm flex items-center gap-2 flex-row-reverse transition-colors",
                                            isDark ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                                        )}
                                    >
                                        <ShieldCheck className="size-4" />
                                        لوحة الإدارة
                                    </button>
                                )}
                                <div className={cn("h-px my-1", isDark ? "bg-white/5" : "bg-slate-200")} />
                                <button
                                    onClick={handleExitDulms}
                                    className={cn(
                                        "w-full text-right px-4 py-2.5 text-sm flex items-center gap-2 flex-row-reverse transition-colors",
                                        isDark ? "text-amber-400 hover:bg-white/5" : "text-amber-600 hover:bg-slate-50"
                                    )}
                                >
                                    <LogOut className="size-4" />
                                    العودة إلى Nexus
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ─── Main Layout ─── */}
            <div className="flex flex-1 overflow-hidden h-[calc(100vh-50px)]">

                {/* ─── Sidebar ─── */}
                <aside className={cn(
                    "w-[240px] flex flex-col shrink-0 overflow-y-auto overflow-x-hidden transition-colors border-r",
                    isDark ? "bg-[#151822] border-white/5" : "bg-[#34495e] border-transparent shadow-[2px_0_5px_rgba(0,0,0,0.1)] text-white"
                )}>
                    {/* User info strip */}
                    <div className="p-3 bg-[#2ecc71] text-white flex items-center gap-3 flex-row-reverse">
                        <div className="size-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="size-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold">{user?.name?.charAt(0)}</span>
                            )}
                        </div>
                        <div className="flex flex-col text-right min-w-0">
                            <span className="text-sm font-bold truncate">{user?.name || 'مستخدم'}</span>
                            <span className="text-[10px] opacity-90 truncate">@{user?.username}</span>
                        </div>
                    </div>

                    {/* Navigation Groups */}
                    <div className="flex flex-col w-full py-1">
                        {NAV_GROUPS.map(group => {
                            const isExpanded = expandedGroup === group.label;
                            const hasActiveItem = group.items.some(item => item.id === activeTab);

                            return (
                                <div key={group.label} className="flex flex-col w-full">
                                    {/* Group Header */}
                                    <button
                                        onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors border-b",
                                            hasActiveItem
                                                ? (isDark ? "bg-[#c088b6] text-white" : "bg-[#c582b4] text-white")
                                                : (isDark ? "border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200" : "border-white/5 text-white/80 hover:bg-white/10")
                                        )}
                                    >
                                        <span className="text-right flex-1">{group.label}</span>
                                        <ChevronDown className={cn("size-3 transition-transform", isExpanded ? "rotate-0" : "-rotate-90")} />
                                    </button>

                                    {/* Group Items */}
                                    {isExpanded && (
                                        <div className={cn(
                                            "flex flex-col w-full py-0.5",
                                            isDark ? "bg-[#0b0d14]" : "bg-[#2c3e50]"
                                        )}>
                                            {group.items.map(item => {
                                                const badge = getBadge(item.id);
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleTabChange(item.id)}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 px-5 py-2.5 text-xs transition-colors flex-row-reverse",
                                                            activeTab === item.id
                                                                ? (isDark ? "bg-[#22273b] text-white font-bold border-l-2 border-slate-400" : "bg-[#1a252f] text-white font-bold border-l-2 border-white/50")
                                                                : (isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5")
                                                        )}
                                                    >
                                                        <item.icon className="size-4 opacity-70" />
                                                        <span className="flex-1 text-right">{item.label}</span>
                                                        {badge !== undefined && (
                                                            <span className="size-5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                                                                {badge}
                                                            </span>
                                                        )}
                                                        {!badge && <ChevronRight className="size-3 opacity-40" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Admin Panel — special restricted item */}
                        {hasAdminAccess && (
                            <button
                                onClick={() => handleTabChange('admin')}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 text-xs transition-colors border-t flex-row-reverse",
                                    activeTab === 'admin'
                                        ? (isDark ? "bg-amber-500/20 text-amber-300 font-bold" : "bg-amber-500/20 text-amber-100 font-bold")
                                        : (isDark ? "border-white/5 text-slate-400 hover:bg-white/5" : "border-white/5 text-white/70 hover:bg-white/10")
                                )}
                            >
                                <ShieldCheck className="size-4" />
                                <span className="flex-1 text-right font-bold">لوحة الإدارة</span>
                            </button>
                        )}
                    </div>
                </aside>

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
