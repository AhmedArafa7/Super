
"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ShieldAlert, Zap, Inbox } from "lucide-react";
import { IconSafe } from "@/components/ui/icon-safe";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { getTransactions, useWalletStore } from "@/lib/wallet-store";
import { getReceivedOffers } from "@/lib/market-store";
import { getNotifications } from "@/lib/notification-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { DashboardOverview } from "./dashboard/dashboard-overview";
import { ProfileSettings } from "./dashboard/profile-settings";
import { OrdersHistory } from "./dashboard/orders-history";
import { OffersReceived } from "./offers-received";
import { DropInbox } from "./dashboard/drop-inbox";

/**
 * [STABILITY_ANCHOR: USER_DASHBOARD_ORCHESTRATOR_V2]
 * المنسق الرئيسي للوحة المستخدم - تم تفكيكه إلى عقد مستقلة لضمان الاستقرار.
 */
export function UserDashboard({ onNavigate }: { onNavigate?: (tab: any) => void }) {
  const { user } = useAuth();
  const wallet = useWalletStore(state => state.wallet);
  const { getTotalUsedSpace, storageLimitMB, cachedAssets } = useGlobalStorage();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [pendingOffersCount, setPendingOffersCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadOrders();
      loadOffersCount();
    }
  }, [user?.id]);

  const loadOrders = async () => {
    if (!user?.id) return;
    setIsLoadingOrders(true);
    try {
      const allTx = await getTransactions(user.id);
      const purchaseTxs = (allTx || []).filter(tx =>
        tx.type === 'purchase_hold' || tx.type === 'purchase_release' || tx.type === 'purchase_refund'
      );
      setOrders(purchaseTxs);
    } catch (err) {
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadOffersCount = async () => {
    if (!user?.id) return;
    try {
      const offers = await getReceivedOffers(user.id);
      setPendingOffersCount(offers.filter(o => o.status === 'pending').length);
    } catch (err) { }
  };

  const usedSpace = getTotalUsedSpace();
  const storagePercentage = Math.round((usedSpace / storageLimitMB) * 100);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 font-sans">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-row-reverse">
          <div className="size-16 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl">
            <IconSafe icon={Sparkles} className="size-8 text-primary animate-pulse" />
          </div>
          <div className="text-right">
            <h2 dir="auto" className="text-4xl font-headline font-bold text-white tracking-tight">أهلاً بك، {user?.name}</h2>
            <p className="text-muted-foreground mt-1">نظام NexusAI جاهز لتنفيذ أوامرك.</p>
          </div>
        </div>
        <div className="flex gap-3">
          {['founder', 'cofounder', 'admin', 'management'].includes(user?.role || '') && (
            <button onClick={() => onNavigate?.("admin")} className="flex items-center gap-2 border border-indigo-500/30 text-indigo-400 rounded-xl font-bold px-4 py-2 hover:bg-indigo-500/10 transition-all">
              <IconSafe icon={ShieldAlert} className="size-4" /> Neural Console
            </button>
          )}
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2 rounded-xl text-xs font-bold">
            <IconSafe icon={Zap} className="size-3 mr-2 inline" /> Node Active
          </Badge>
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 flex flex-wrap h-auto gap-1 flex-row-reverse">
          <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary flex-1 sm:flex-none">نظرة عامة</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary flex-1 sm:flex-none">الملف الشخصي</TabsTrigger>
          <TabsTrigger value="business" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary flex-1 sm:flex-none relative">
            مركز الأعمال
            {pendingOffersCount > 0 && <Badge className="ml-2 bg-red-500 h-4 w-4 p-0 flex items-center justify-center text-[8px] rounded-full">{pendingOffersCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary flex-1 sm:flex-none">سجل العمليات</TabsTrigger>
          <TabsTrigger value="vault" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 flex-1 sm:flex-none gap-2">
            <IconSafe icon={Inbox} className="size-3.5" /> صندوق الوارد
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DashboardOverview user={user} wallet={wallet} usedSpace={usedSpace} storageLimitMB={storageLimitMB} storagePercentage={storagePercentage} cachedAssets={cachedAssets} onNavigate={onNavigate} />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileSettings user={user} />
        </TabsContent>

        <TabsContent value="business">
          <OffersReceived />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersHistory orders={orders} isLoading={isLoadingOrders} />
        </TabsContent>

        <TabsContent value="vault">
          <DropInbox />
        </TabsContent>
      </Tabs>
    </div>
  );
}
