
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Megaphone, RefreshCcw, Search, Sparkles, ChevronDown, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAds, Ad } from "@/lib/ads-store";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { AdCard } from "./ads/ad-card";
import { AdSubmissionForm } from "./ads/ad-submission-form";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentSnapshot } from "firebase/firestore";
import { getUserAds } from "@/lib/ads-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Clock, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: ADS_CENTER_V1.2]
 * المنسق المطور لمركز الإعلانات - يدعم التجزئة الاحترافية لتقليل الضغط.
 */
export function AdsCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isMySubmissionsOpen, setIsMySubmissionsOpen] = useState(false);
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [isLoadingUserAds, setIsLoadingUserAds] = useState(false);

  const loadAds = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setIsLoading(true);
      setAds([]);
    }
    try {
      const { ads: fetchedAds, lastVisible: nextCursor } = await getAds(
        'active',
        15,
        isLoadMore ? (lastVisible || undefined) : undefined
      );

      setAds(prev => isLoadMore ? [...prev, ...fetchedAds] : fetchedAds);
      setLastVisible(nextCursor);
      setHasMore(fetchedAds.length === 15);
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ في المزامنة" });
    } finally {
      setIsLoading(false);
    }
  }, [lastVisible, toast]);

  const loadUserAds = async () => {
    if (!user?.id) return;
    setIsLoadingUserAds(true);
    try {
      const fetched = await getUserAds(user.id);
      setUserAds(fetched);
    } catch (err) {
      toast({ variant: "destructive", title: "فشل تحميل طلباتك" });
    } finally {
      setIsLoadingUserAds(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const filteredAds = ads.filter(ad =>
    ad.title.toLowerCase().includes(search.toLowerCase()) ||
    ad.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-row-reverse text-right">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-2">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-widest">Neural Billboard Active</span>
          </div>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            مركز الإعلانات
            <Megaphone className="text-amber-400 size-10" />
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl text-right">
            اكتشف أحدث العروض والخدمات التقنية في النخاع. يمكنك أيضاً تقديم إعلانك الخاص ليظهر في الشبكة.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadAds()}
            disabled={isLoading}
            className="size-12 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10"
          >
            <RefreshCcw className={isLoading ? "animate-spin" : ""} />
          </Button>

          {user && (
            <Dialog open={isMySubmissionsOpen} onOpenChange={(open) => {
              setIsMySubmissionsOpen(open);
              if (open) loadUserAds();
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-14 px-6 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold gap-2">
                  <Clock className="size-4" /> طلباتي
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-right text-2xl font-bold">تتبع طلباتك الإعلانية</DialogTitle></DialogHeader>
                <div className="space-y-4 py-6">
                  {isLoadingUserAds ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                  ) : userAds.length === 0 ? (
                    <div className="text-center py-10 opacity-30 italic">لم تقم بتقديم أي طلبات إعلانية بعد.</div>
                  ) : (
                    userAds.map(ad => (
                      <div key={ad.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-start flex-row-reverse text-right">
                          <h4 className="font-bold text-white">{ad.title}</h4>
                          <Badge variant="outline" className={cn(
                            "px-2 py-0.5",
                            ad.status === 'active' ? "text-green-400 border-green-400/20" :
                            ad.status === 'pending_review' ? "text-amber-400 border-amber-400/20" :
                            ad.status === 'rejected' ? "text-red-400 border-red-400/20" : "text-white/40 border-white/10"
                          )}>
                            {ad.status === 'active' && <><CheckCircle2 className="size-3 mr-1" /> نشط</>}
                            {ad.status === 'pending_review' && <><Clock className="size-3 mr-1" /> قيد المراجعة</>}
                            {ad.status === 'rejected' && <><XCircle className="size-3 mr-1" /> مرفوض</>}
                          </Badge>
                        </div>
                        {ad.status === 'rejected' && ad.rejectionReason && (
                          <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-3 flex-row-reverse text-right">
                            <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">سبب الرفض</p>
                              <p className="text-xs text-slate-400 italic">"{ad.rejectionReason}"</p>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2 border-t border-white/5">
                           <span>نوع: {ad.type}</span>
                           <span>تاريخ: {new Date(ad.createdAt).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {user && <AdSubmissionForm user={user} onSuccess={() => loadAds()} />}
        </div>
      </header>

      <div className="relative max-w-2xl ml-auto">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <Input
          dir="auto"
          placeholder="ابحث عن عروض، خدمات، أو دروس..."
          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pr-12 text-right focus-visible:ring-amber-500 shadow-2xl text-white text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
        {isLoading && ads.length === 0 ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="aspect-video rounded-[2.5rem] bg-white/5 animate-pulse border border-white/5" />
          ))
        ) : filteredAds.length === 0 ? (
          <div className="col-span-full py-32">
            <EmptyState
              icon={Sparkles}
              title="اللوحة فارغة حالياً"
              description="لا توجد إعلانات نشطة مطابقة في منطقتك العصبية. شاركنا بإعلانك الأول الآن!"
            />
          </div>
        ) : (
          filteredAds.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              userId={user?.id}
              onRewardClaimed={() => toast({ title: "تم استحقاق المكافأة" })}
            />
          ))
        )}
      </div>

      {hasMore && ads.length > 0 && (
        <div className="flex justify-center pb-20">
          <Button
            variant="ghost"
            onClick={() => loadAds(true)}
            disabled={isLoading}
            className="h-12 px-10 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 font-bold gap-2"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ChevronDown className="size-4" />}
            عرض المزيد من اللوحات
          </Button>
        </div>
      )}
    </div>
  );
}
