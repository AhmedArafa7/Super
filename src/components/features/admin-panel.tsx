
"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, RefreshCcw, Users, MessageSquare, 
  Video, ShoppingBag, Wallet, Megaphone, Activity, GraduationCap, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { UsersManagement } from "./admin/users-management";
import { ChatReview } from "./admin/chat-review";
import { MediaCensorship } from "./admin/media-censorship";
import { MarketManagement } from "./admin/market-management";
import { FinancialLedger } from "./admin/financial-ledger";
import { AdsManagement } from "./admin/ads-management";
import { QuotaMonitor } from "./admin/quota-monitor";

import { getStoredMessages } from "@/lib/chat-store";
import { getStoredUsers } from "@/lib/auth-store";
import { getStoredVideos } from "@/lib/video-store";
import { getAllOffersAdmin } from "@/lib/market-store";
import { getAllTransactionsAdmin } from "@/lib/wallet-store";
import { getAds } from "@/lib/ads-store";
import { getSubjects, getCollections, getLearningItems, approveSubject, approveCollection, approveLearningItem, deleteSubject, deleteCollection, deleteLearningItem } from "@/lib/learning-store";

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
    pendingKnowledge: [] as any[]
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [msgs, allUsers, allVideos, allOffers, txResult, adsResult, allSubjects] = await Promise.all([
        getStoredMessages(undefined, true),
        getStoredUsers(),
        getStoredVideos(),
        getAllOffersAdmin(),
        getAllTransactionsAdmin(),
        getAds(),
        getSubjects(undefined, true)
      ]);
      
      // جلب العناصر المعلقة في المحتوى التعليمي
      const pendingItems: any[] = [];
      for (const s of allSubjects) {
        if (s.status === 'pending') pendingItems.push({ ...s, type: 'subject' });
        const cols = await getCollections(s.id, undefined, true);
        for (const c of cols) {
          if (c.status === 'pending') pendingItems.push({ ...c, type: 'collection', subjectId: s.id });
          const items = await getLearningItems(s.id, c.id, undefined, true);
          for (const i of items) {
            if (i.status === 'pending') pendingItems.push({ ...i, type: 'item' });
          }
        }
      }

      setData({
        messages: msgs || [],
        users: allUsers || [],
        videos: allVideos || [],
        offers: allOffers || [],
        transactions: (txResult as any)?.transactions || [],
        ads: (adsResult as any)?.ads || [],
        pendingKnowledge: pendingItems
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

  const handleApproveKnowledge = async (item: any) => {
    try {
      if (item.type === 'subject') await approveSubject(item.id);
      else if (item.type === 'collection') await approveCollection(item.subjectId, item.id);
      else if (item.type === 'item') await approveLearningItem(item.subjectId, item.collectionId, item.id);
      
      toast({ title: "تم اعتماد المحتوى" });
      loadAllData();
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الاعتماد" });
    }
  };

  const handleRejectKnowledge = async (item: any) => {
    try {
      if (item.type === 'subject') await deleteSubject(item.id);
      else if (item.type === 'collection') await deleteCollection(item.subjectId, item.id);
      else if (item.type === 'item') await deleteLearningItem(item.subjectId, item.collectionId, item.id);
      
      toast({ title: "تم رفض وحذف المحتوى" });
      loadAllData();
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الرفض" });
    }
  };

  if (currentUser?.role !== 'admin') {
    return <div className="p-20 text-center text-red-400 font-bold">Unauthorized Access</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen gap-8 animate-in fade-in duration-700 font-sans">
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h2 className="text-4xl font-headline font-bold text-white flex items-center gap-4 justify-end">
            لوحة القيادة السيادية
            <ShieldAlert className="text-indigo-400 size-10" />
          </h2>
          <p className="text-muted-foreground mt-1 text-base">إدارة العقد، الرقابة على المحتوى، ومزامنة الموارد.</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadAllData} disabled={isLoading} className="size-12 rounded-xl border-white/5 bg-white/5">
          <RefreshCcw className={cn("size-5 text-indigo-400", isLoading && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="knowledge" className="flex-1 flex flex-col">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 w-fit flex-wrap flex-row-reverse self-end h-auto gap-1">
          <TabsTrigger value="knowledge" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-indigo-600">
            <GraduationCap className="size-4" /> 
            مراجعة المعرفة 
            {data.pendingKnowledge.length > 0 && <Badge className="bg-red-500 h-4 w-4 p-0 flex items-center justify-center text-[10px]">{data.pendingKnowledge.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-indigo-600"><Users className="size-4" /> العقد</TabsTrigger>
          <TabsTrigger value="vitals" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-red-600"><Activity className="size-4" /> المرصد</TabsTrigger>
          <TabsTrigger value="chat" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-indigo-600"><MessageSquare className="size-4" /> الدردشة</TabsTrigger>
          <TabsTrigger value="media" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-indigo-600"><Video className="size-4" /> الرقابة</TabsTrigger>
          <TabsTrigger value="market" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-indigo-600"><ShoppingBag className="size-4" /> المتجر</TabsTrigger>
          <TabsTrigger value="ads" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-indigo-600"><Megaphone className="size-4" /> الإعلانات</TabsTrigger>
          <TabsTrigger value="finances" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-indigo-600"><Wallet className="size-4" /> المالية</TabsTrigger>
        </TabsList>

        <div className="flex-1">
          <TabsContent value="knowledge">
            <div className="space-y-4">
              {data.pendingKnowledge.length === 0 ? (
                <div className="py-20 text-center opacity-30 border-2 border-dashed border-white/5 rounded-[2rem]">لا توجد طلبات إضافة جديدة في المكتبة.</div>
              ) : (
                data.pendingKnowledge.map((item, idx) => (
                  <Card key={idx} className="p-6 glass border-amber-500/20 rounded-3xl flex items-center justify-between flex-row-reverse">
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <h4 className="font-bold text-white text-lg">{item.title}</h4>
                        <Badge variant="outline" className="text-[10px]">{item.type.toUpperCase()}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">بواسطة: @{item.authorId.substring(0,8)}</p>
                      {item.url && <p className="text-[10px] text-indigo-400 mt-2 truncate max-w-md">{item.url}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-green-600 hover:bg-green-500 rounded-xl" onClick={() => handleApproveKnowledge(item)}><CheckCircle2 className="size-4 mr-2" /> اعتماد</Button>
                      <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 rounded-xl" onClick={() => handleRejectKnowledge(item)}><XCircle className="size-4 mr-2" /> رفض</Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement users={data.users} currentUser={currentUser} onRefresh={loadAllData} />
          </TabsContent>

          <TabsContent value="vitals">
            <QuotaMonitor data={data} />
          </TabsContent>

          <TabsContent value="chat">
            <ChatReview messages={data.messages} onRefresh={loadAllData} />
          </TabsContent>

          <TabsContent value="media">
            <MediaCensorship videos={data.videos} onRefresh={loadAllData} />
          </TabsContent>

          <TabsContent value="market">
            <MarketManagement offers={data.offers} />
          </TabsContent>

          <TabsContent value="ads">
            <AdsManagement ads={data.ads} onRefresh={loadAllData} />
          </TabsContent>

          <TabsContent value="finances">
            <FinancialLedger transactions={data.transactions} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
