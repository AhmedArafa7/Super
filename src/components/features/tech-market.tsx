
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Loader2, Zap, RefreshCcw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  getMarketItems, addMarketItem, updateMarketItem, MarketItem,
  MainCategory, SUB_CATEGORIES, uploadMarketImage, decrementStock
} from "@/lib/market-store";
import { uploadLearningFile } from "@/lib/learning-store";
import { useWalletStore } from "@/lib/wallet-store";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentSnapshot } from "firebase/firestore";

import { MarketSidebar } from "./market/market-sidebar";
import { MarketItemCard } from "./market/market-item-card";
import { MarketItemDetails } from "./market/market-item-details";
import { MarketFormDialog } from "./market/market-form-dialog";

const ITEMS_PER_PAGE = 12;

export function TechMarket({ onLaunchApp }: { onLaunchApp?: (url: string, title: string) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { wallet, adjustFunds, fetchWallet } = useWalletStore();

  const [items, setItems] = useState<MarketItem[]>([]);
  const [activeView, setActiveView] = useState<'buy' | 'mine'>('buy');
  const [viewingItem, setViewingItem] = useState<MarketItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketItem | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");
  const [mainCat, setMainCat] = useState<MainCategory>("all");
  const [subCat, setSubCat] = useState<string>("all_subs");

  const loadData = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setIsLoading(true);
      setItems([]);
    }

    try {
      const { items: fetchedItems, lastVisible: nextCursor } = await getMarketItems(
        ITEMS_PER_PAGE,
        isLoadMore ? lastVisible || undefined : undefined,
        mainCat,
        subCat,
        search
      );

      setItems(prev => isLoadMore ? [...prev, ...fetchedItems] : fetchedItems);
      setLastVisible(nextCursor);
      setHasMore(fetchedItems.length === ITEMS_PER_PAGE);
    } catch (e) {
      console.error("Market Load Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [search, mainCat, subCat, lastVisible]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(false), 400);
    return () => clearTimeout(timer);
  }, [search, mainCat, subCat]);

  useEffect(() => {
    if (user?.id) fetchWallet(user.id);
  }, [user?.id, fetchWallet]);

  const handleSaveListing = async (formData: any) => {
    if (!user) return;
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let finalImageUrl = formData.imageUrl;
      let finalDownloadUrl = formData.downloadUrl;

      if (formData.imageFile) {
        finalImageUrl = await uploadMarketImage(formData.imageFile, (pct) => setUploadProgress(pct * 0.5));
      }

      if (formData.mainCategory === 'software' && formData.buildFile) {
        finalDownloadUrl = await uploadLearningFile(formData.buildFile, (pct) => setUploadProgress(50 + pct * 0.5));
      }

      if (editingItem) {
        await updateMarketItem(editingItem.id, { ...formData, imageUrl: finalImageUrl, downloadUrl: finalDownloadUrl });
        toast({ title: "تم التحديث", description: "تمت مزامنة بيانات العقدة بنجاح." });
      } else {
        await addMarketItem({ ...formData, sellerId: user.id, imageUrl: finalImageUrl, downloadUrl: finalDownloadUrl });
        toast({ title: "تم الإطلاق", description: "الأصل متاح الآن في السجل العالمي للمتجر." });
      }

      setIsModalOpen(false);
      setEditingItem(null);
      loadData(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل العملية", description: err.message });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleAcquire = async (item: MarketItem) => {
    if (!user) return;

    try {
      const success = await adjustFunds(user.id, item.price, 'purchase_hold');
      if (success) {
        // تحديث المخزون في السيرفر مع تسجيل المشتري
        const stockSuccess = await decrementStock(item.id, user.id);

        if (stockSuccess) {
          toast({
            title: "تم الاستحواذ بنجاح",
            description: `لقد حجزت "${item.title}". تم تحديث سجلاتك والمخزون.`
          });
          setViewingItem(null);
          loadData(false);
          if (user.id) fetchWallet(user.id);
        } else {
          // استرداد المبلغ في حال فشل تحديث المخزون (نادر)
          await adjustFunds(user.id, item.price, 'purchase_refund');
          throw new Error("عذراً، نفذت الكمية في اللحظة الأخيرة.");
        }
      } else {
        throw new Error("فشلت المعالجة المالية في النخاع العصبي.");
      }
    } catch (err: any) {
      throw err; // إعادة الخطأ ليتم التعامل معه في واجهة التفاصيل
    }
  };

  const filteredItems = items.filter(item => {
    const isOwner = item.sellerId === user?.id;
    const isBuyer = item.purchasedBy?.includes(user?.id || "");
    
    if (activeView === 'mine') {
      return isOwner || isBuyer;
    }
    
    return !isOwner && !isBuyer && item.status === 'active';
  });

  if (viewingItem) {
    return (
      <MarketItemDetails
        item={viewingItem}
        userId={user?.id}
        userBalance={wallet?.balance || 0}
        onBack={() => setViewingItem(null)}
        onLaunch={onLaunchApp}
        onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
        onAcquire={handleAcquire}
      />
    );
  }

  const availableSubs = SUB_CATEGORIES.filter(s => s.parent === mainCat);

  return (
    <div className="flex h-full bg-slate-950/50">
      <MarketSidebar currentCat={mainCat} onSelect={(cat) => { setMainCat(cat); setSubCat('all_subs'); }} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="p-8 border-b border-white/5 bg-slate-900/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 flex-row-reverse text-right">
            <div className="space-y-1">
              <div className="flex items-center gap-3 justify-end">
                <h1 className="text-4xl font-headline font-bold text-white tracking-tight">TechMarket</h1>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary uppercase">v5.0</Badge>
              </div>
              <p className="text-muted-foreground">سوق الأصول البرمجية والحلول الذكية اللامركزي.</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-row-reverse">
              <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="bg-white/5 border border-white/10 rounded-xl p-1 flex-1 md:flex-none">
                <TabsList className="bg-transparent h-10 w-full grid grid-cols-2">
                  <TabsTrigger value="buy" className="rounded-lg data-[state=active]:bg-primary">استحواذ</TabsTrigger>
                  <TabsTrigger value="mine" className="rounded-lg data-[state=active]:bg-primary">أصولي</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="bg-primary rounded-xl px-6 h-12 shadow-lg shadow-primary/20 flex-1 md:flex-none font-bold">
                <Plus className="mr-2 size-5" /> إضافة منتج
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 flex-row-reverse">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                dir="auto"
                placeholder="البحث في السجل العصبي العالمي..."
                className="w-full h-14 bg-white/5 border-white/10 rounded-2xl pr-12 text-right text-lg focus-visible:ring-primary shadow-inner text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {availableSubs.length > 0 && (
              <ScrollArea className="w-full md:w-auto h-14 whitespace-nowrap">
                <div className="flex gap-2 p-1 flex-row-reverse">
                  <Badge
                    variant={subCat === 'all_subs' ? 'default' : 'outline'}
                    className={cn("h-10 px-6 rounded-xl cursor-pointer transition-all", subCat === 'all_subs' ? "bg-indigo-600" : "border-white/10 hover:bg-white/5")}
                    onClick={() => setSubCat('all_subs')}
                  >
                    كل الفئات
                  </Badge>
                  {availableSubs.map(s => (
                    <Badge
                      key={s.id}
                      variant={subCat === s.id ? 'default' : 'outline'}
                      className={cn("h-10 px-6 rounded-xl cursor-pointer whitespace-nowrap transition-all", subCat === s.id ? "bg-indigo-600" : "border-white/10 hover:bg-white/5")}
                      onClick={() => setSubCat(s.id)}
                    >
                      {s.label}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-8">
            {isLoading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground animate-pulse font-bold tracking-widest text-xs uppercase">جاري مزامنة العقد...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <EmptyState
                icon={Search}
                title="السجل فارغ"
                description={activeView === 'buy' ? "لم يتم العثور على أصول تناسب معايير البحث." : "لم تقم برفع أي أصول بعد."}
                className="py-24"
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-10">
                  {filteredItems.map((item) => (
                    <MarketItemCard
                      key={item.id}
                      item={item}
                      userId={user?.id}
                      onClick={() => setViewingItem(item)}
                      onEdit={(e) => { e.stopPropagation(); setEditingItem(item); setIsModalOpen(true); }}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center pb-20">
                    <Button
                      variant="outline"
                      onClick={() => loadData(true)}
                      disabled={isLoading}
                      className="h-12 px-8 rounded-xl border-white/10 hover:bg-white/5 gap-2 font-bold"
                    >
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ChevronDown className="size-4" />}
                      تحميل المزيد من العقد
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </main>

      <MarketFormDialog
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSaveListing}
        editingItem={editingItem}
        isSubmitting={isSubmitting}
        progress={uploadProgress}
        defaultCat={mainCat !== 'all' ? mainCat : 'digital_assets'}
      />
    </div>
  );
}

