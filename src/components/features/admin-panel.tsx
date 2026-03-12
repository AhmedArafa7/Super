
"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert, RefreshCcw, Users, MessageSquare,
  Video, ShoppingBag, Wallet, Megaphone, Activity, Coins,
  GraduationCap, CheckCircle2, XCircle, Rocket, Crown, Tag, MessageCircle, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { UsersManagement } from "./admin/users-management";
import { ChatReview } from "./admin/chat-review";
import { MediaCensorship } from "./admin/media-censorship";
import { MarketManagement } from "./admin/market-management";
import { FinancialLedger } from "./admin/financial-ledger";
import { AdsManagement } from "./admin/ads-management";
import { QuotaMonitor } from "./admin/quota-monitor";
import { AppReview } from "./admin/app-review";
import { CurrencyManagement } from "./admin/currency-management";
import { SectionsManagement } from "./admin/sections-management";

import { getStoredMessages } from "@/lib/chat-store";
import { getStoredUsers } from "@/lib/auth-store";
import { getStoredVideos } from "@/lib/video-store";
import { getAllOffersAdmin, getMarketItems, updateMarketItem, getCategoryRequests } from "@/lib/market-store";
import { getAllTransactionsAdmin } from "@/lib/wallet-store";
import { getAds } from "@/lib/ads-store";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

export function AdminPanel() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState({
    messages: [] as any[],
    users: [] as any[],
    videos: [] as any[],
    offers: [] as any[],
    transactions: [] as any[],
    ads: [] as any[],
    pendingProducts: [] as any[],
    categoryRequests: [] as any[]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState<Record<string, string>>({});

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [msgs, allUsers, allVideos, allOffers, txResult, adsResult, marketRes, catReqs] = await Promise.all([
        getStoredMessages(undefined, true),
        getStoredUsers(),
        getStoredVideos(),
        getAllOffersAdmin(),
        getAllTransactionsAdmin(),
        getAds(),
        getMarketItems(100, undefined, undefined, undefined, undefined, true),
        getCategoryRequests()
      ]);

      setData({
        messages: msgs || [],
        users: allUsers || [],
        videos: allVideos || [],
        offers: allOffers || [],
        transactions: (txResult as any)?.transactions || [],
        ads: (adsResult as any)?.ads || [],
        pendingProducts: marketRes.items.filter(i => i.status === 'pending_review'),
        categoryRequests: catReqs || []
      });
    } catch (err) {
      console.error("Admin Sync Error:", err);
      toast({ variant: "destructive", title: "Sync Failure" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleProductAction = async (id: string, status: 'active' | 'rejected') => {
    const feedback = rejectFeedback[id] || "";
    try {
      await updateMarketItem(id, { status, adminFeedback: feedback });
      toast({ title: status === 'active' ? "تم نشر المنتج" : "تم رفض المنتج" });
      loadAllData();
    } catch (e) { toast({ variant: "destructive", title: "فشل العملية" }); }
  };

  const handleCategoryAction = async (id: string, status: 'approved' | 'rejected') => {
    const { firestore } = initializeFirebase();
    try {
      await updateDoc(doc(firestore, 'category_requests', id), { status, adminFeedback: rejectFeedback[id] || "" });
      toast({ title: "تم معالجة الطلب" });
      loadAllData();
    } catch (e) { toast({ variant: "destructive", title: "فشل العملية" }); }
  };

  const allowedRoles = ['founder', 'cofounder', 'admin', 'management'];
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <div className="p-20 text-center text-red-400 font-bold">Unauthorized Access</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen gap-8 animate-in fade-in duration-700 font-sans">
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h2 className="text-4xl font-headline font-bold text-white flex items-center gap-4 justify-end">
            لوحة القيادة السيادية
            <Crown className="text-amber-400 size-10" />
          </h2>
          <p className="text-muted-foreground mt-1">إدارة العقد، المتجر الشامل، واقتراحات التصنيفات.</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadAllData} disabled={isLoading} className="size-12 rounded-xl border-white/5 bg-white/5">
          <RefreshCcw className={cn("size-5 text-indigo-400", isLoading && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="products" className="flex-1">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 w-fit flex-wrap flex-row-reverse self-end h-auto gap-1">
          <TabsTrigger value="products" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse">
            <ShoppingBag className="size-4" />
            المنتجات
            {data.pendingProducts.length > 0 && <Badge className="bg-red-500 h-4 w-4 p-0 flex items-center justify-center text-[10px]">{data.pendingProducts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse">
            <Tag className="size-4" />
            اقتراحات التصنيف
            {data.categoryRequests.filter(r => r.status === 'pending').length > 0 && <Badge className="bg-red-500 h-4 w-4 p-0 flex items-center justify-center text-[10px]">{data.categoryRequests.filter(r => r.status === 'pending').length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse"><Users className="size-4" /> العقد</TabsTrigger>
          <TabsTrigger value="chat" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse"><MessageSquare className="size-4" /> الدردشة</TabsTrigger>
          <TabsTrigger value="media" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse"><Video className="size-4" /> الرقابة</TabsTrigger>
          <TabsTrigger value="ads" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse"><Megaphone className="size-4" /> الإعلانات</TabsTrigger>
          <TabsTrigger value="currency" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse"><Coins className="size-4" /> العملات</TabsTrigger>
          <TabsTrigger value="sections" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse"><Layers className="size-4" /> الأقسام</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="space-y-4">
            {data.pendingProducts.length === 0 ? (
              <div className="py-20 text-center opacity-30 border-2 border-dashed border-white/5 rounded-[2rem]">لا توجد منتجات معلقة.</div>
            ) : (
              data.pendingProducts.map((p) => (
                <Card key={p.id} className="p-8 glass border-amber-500/20 rounded-3xl space-y-6">
                  <div className="flex justify-between items-start flex-row-reverse">
                    <div className="text-right">
                      <h4 className="text-2xl font-bold text-white">{p.title}</h4>
                      <p className="text-sm text-muted-foreground">بواسطة: @{p.sellerId.substring(0, 8)} | السعر: {p.price} Credits</p>
                    </div>
                    <Badge variant="outline" className="border-amber-500/20 text-amber-400">PRODUCT REVIEW</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                    <div className="space-y-2">
                      <p className="text-xs font-black text-indigo-400 uppercase">الوصف</p>
                      <p className="text-sm text-slate-300 italic">"{p.description}"</p>
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-black text-red-400 uppercase">سبب الرفض (إرسال للمستخدم)</p>
                      <Input dir="auto" className="bg-white/5 border-white/10 text-right" placeholder="اذكر سبب الرفض هنا..." value={rejectFeedback[p.id] || ""} onChange={e => setRejectFeedback({ ...rejectFeedback, [p.id]: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse pt-4 border-t border-white/5">
                    <Button className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl h-12 font-bold" onClick={() => handleProductAction(p.id, 'active')}><CheckCircle2 className="size-4 mr-2" /> نشر المنتج</Button>
                    <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 rounded-xl px-8" onClick={() => handleProductAction(p.id, 'rejected')}><XCircle className="size-4 mr-2" /> رفض</Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-4">
            {data.categoryRequests.filter(r => r.status === 'pending').length === 0 ? (
              <div className="py-20 text-center opacity-30 border-2 border-dashed border-white/5 rounded-[2rem]">لا توجد طلبات تصنيفات.</div>
            ) : (
              data.categoryRequests.filter(r => r.status === 'pending').map((r) => (
                <Card key={r.id} className="p-6 glass border-indigo-500/20 rounded-3xl flex flex-col gap-4 text-right">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <h4 className="text-lg font-bold text-white">تصنيف مقترح: <span className="text-indigo-400">{r.suggestedName}</span></h4>
                    <Badge variant="outline">تحت: {r.parentCategory}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">بواسطة: @{r.userName} ({r.userId.substring(0, 8)})</p>
                  <Input dir="auto" className="bg-white/5 border-white/10 text-right mt-2" placeholder="ملاحظات أو سبب الرفض..." value={rejectFeedback[r.id] || ""} onChange={e => setRejectFeedback({ ...rejectFeedback, [r.id]: e.target.value })} />
                  <div className="flex gap-2 justify-end">
                    <Button className="bg-indigo-600 rounded-xl" onClick={() => handleCategoryAction(r.id, 'approved')}>اعتماد وإضافة</Button>
                    <Button variant="ghost" className="text-red-400" onClick={() => handleCategoryAction(r.id, 'rejected')}>رفض الطلب</Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="users"><UsersManagement users={data.users} currentUser={currentUser} onRefresh={loadAllData} /></TabsContent>
        <TabsContent value="chat"><ChatReview messages={data.messages} onRefresh={loadAllData} /></TabsContent>
        <TabsContent value="media"><MediaCensorship videos={data.videos} onRefresh={loadAllData} /></TabsContent>
        <TabsContent value="ads"><AdsManagement ads={data.ads} onRefresh={loadAllData} /></TabsContent>
        <TabsContent value="currency"><CurrencyManagement users={data.users} currentUser={currentUser} onRefresh={loadAllData} /></TabsContent>
        <TabsContent value="sections"><SectionsManagement /></TabsContent>
      </Tabs>
    </div>
  );
}
