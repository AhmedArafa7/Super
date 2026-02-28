
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, Video, deleteVideo } from "@/lib/video-store";
import { listenToSubscriptions, YouTubeSubscription } from "@/lib/subscription-store";
import { fetchAllSubscriptionsFeed, FeedVideo } from "@/lib/youtube-feed-store";
import { useStreamStore } from "@/lib/stream-store"; 
import { useGlobalStorage } from "@/lib/global-storage-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { StreamSettings } from "./stream/stream-settings";
import { StreamUploadDialog } from "./stream/stream-upload-dialog";
import { VideoCard } from "./stream/video-card";
import { PlaySquare, Sparkles, Loader2 } from "lucide-react";

import { SubscriptionBar } from "./wetube/subscription-bar";
import { AddChannelModal } from "./wetube/add-channel-modal";
import { ManageChannelsModal } from "./wetube/manage-channels-modal";

/**
 * [STABILITY_ANCHOR: WETUBE_FINAL_V11.0]
 * المنسق الرئيسي المصحح لـ WeTube - تم إصلاح خطأ TabsContext عبر هيكلية مسطحة ونظيفة.
 */
export function WeTube({ onOpenVault }: { onOpenVault?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { cachedAssets, addAsset, removeAsset } = useGlobalStorage();
  const { 
    activeVideo, setActiveVideo, quality, setQuality, 
    backgroundPlayback, setBackgroundPlayback, autoFloat, setAutoFloat 
  } = useStreamStore();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [subscriptions, setSubscriptions] = useState<YouTubeSubscription[]>([]);
  const [feedVideos, setFeedVideos] = useState<FeedVideo[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'explore' | 'subs' | 'studio'>('explore');
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const runAutoSync = useCallback(async (subs: YouTubeSubscription[], feed: FeedVideo[]) => {
    const favorites = subs.filter(s => s.isFavorite);
    if (favorites.length === 0) return;

    let syncCount = 0;
    for (const sub of favorites) {
      const channelFeed = feed.filter(v => v.authorId === sub.channelId);
      const toSync = channelFeed.filter(v => {
        if (cachedAssets.some(a => a.id === `video-${v.id}`)) return false;
        if (sub.autoSyncType === 'long') return !v.isShorts;
        if (sub.autoSyncType === 'shorts') return v.isShorts;
        return true; 
      });

      if (toSync.length > 0) {
        toSync.forEach(v => {
          addAsset({ id: `video-${v.id}`, type: 'video', title: v.title, sizeMB: v.isShorts ? 15 : 45 });
          syncCount++;
        });
      }
    }
    if (syncCount > 0) {
      toast({ title: "تم التحميل التلقائي", description: `تمت مزامنة ${syncCount} فيديوهات من القنوات المفضلة.` });
    }
  }, [cachedAssets, addAsset, toast]);

  useEffect(() => {
    const loadVideos = async () => {
      const data = await getStoredVideos();
      setVideos(data || []);
    };
    loadVideos();

    if (user?.id) {
      const unsubscribeSubs = listenToSubscriptions(user.id, (subs) => {
        setSubscriptions(subs);
        syncFeed(subs);
      });
      return () => unsubscribeSubs();
    }
  }, [user?.id]);

  const syncFeed = async (subs: YouTubeSubscription[]) => {
    if (subs.length === 0) {
      setFeedVideos([]);
      return;
    }
    setIsFeedLoading(true);
    try {
      const feed = await fetchAllSubscriptionsFeed(subs.map(s => s.channelId));
      setFeedVideos(feed);
      runAutoSync(subs, feed);
    } catch (e) {
      console.error("Feed Sync Failure", e);
    } finally {
      setIsFeedLoading(false);
    }
  };

  const filteredFeed = useMemo(() => {
    if (!selectedChannelId) return feedVideos;
    return feedVideos.filter(v => v.authorId === selectedChannelId);
  }, [selectedChannelId, feedVideos]);

  const handleToggleLocal = (video: any) => {
    const assetId = `video-${video.id}`;
    if (cachedAssets.some(a => a.id === assetId)) {
      removeAsset(assetId);
      toast({ title: "تم الحذف من الجهاز" });
    } else {
      addAsset({ id: assetId, type: 'video', title: video.title, sizeMB: 45 });
      toast({ title: "تم الحفظ للمشاهدة أوفلاين" });
    }
  };

  return (
    <div className={cn("p-8 max-w-7xl mx-auto min-h-screen", activeVideo && "pt-[45vh]")}>
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse text-right">
          <div className="space-y-1">
            <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
              WeTube
              <PlaySquare className="text-red-500 size-10" />
            </h2>
            <p className="text-muted-foreground text-lg">بث ذكي يدعم المزامنة التلقائية لمحتوى قنواتك المفضلة.</p>
          </div>

          <div className="flex items-center gap-4 flex-row-reverse">
            <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 h-11 flex-row-reverse">
              <TabsTrigger value="explore" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">اكتشاف</TabsTrigger>
              <TabsTrigger value="subs" className="rounded-xl px-6 data-[state=active]:bg-indigo-600 font-bold">الاشتراكات</TabsTrigger>
              <TabsTrigger value="studio" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">قنواتي</TabsTrigger>
            </TabsList>
            <StreamSettings 
              quality={quality} setQuality={setQuality} 
              backgroundPlayback={backgroundPlayback} setBackgroundPlayback={setBackgroundPlayback} 
              autoFloat={autoFloat} setAutoFloat={setAutoFloat} 
            />
            <StreamUploadDialog onUpload={() => {}} onOpenVault={onOpenVault} />
          </div>
        </header>

        <div className="mt-8">
          <TabsContent value="explore" className="m-0 focus-visible:ring-0 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {videos.filter(v => v.status === 'published').map(v => (
                <VideoCard 
                  key={v.id} video={v} isActive={activeVideo?.id === v.id} 
                  isCached={cachedAssets.some(a => a.id === `video-${v.id}`)} 
                  currentUser={user} onClick={() => setActiveVideo(v)} 
                  onSync={handleToggleLocal} onDelete={deleteVideo} 
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="subs" className="m-0 focus-visible:ring-0 outline-none">
            <div className="space-y-10">
              <SubscriptionBar 
                subscriptions={subscriptions} selectedChannelId={selectedChannelId} 
                onSelectChannel={setSelectedChannelId} onOpenAddModal={() => setIsAddModalOpen(true)} 
                onOpenManageModal={() => setIsManageModalOpen(true)} 
              />
              {isFeedLoading ? (
                <div className="flex flex-col items-center py-20">
                  <Loader2 className="size-10 animate-spin text-indigo-400 mb-4" />
                  <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">جاري مزامنة آخر الفيديوهات...</p>
                </div>
              ) : filteredFeed.length === 0 ? (
                <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                  <Sparkles className="size-16 text-indigo-400" />
                  <p className="text-xl font-bold">لا توجد فيديوهات جديدة حالياً.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {filteredFeed.map(v => (
                    <VideoCard 
                      key={v.id} video={{...v, externalUrl: v.url, time: "اليوم"}} 
                      isActive={activeVideo?.externalUrl === v.url} 
                      isCached={cachedAssets.some(a => a.id === `video-${v.id}`)}
                      onSync={handleToggleLocal} onClick={() => setActiveVideo({...v, externalUrl: v.url, source: 'youtube'} as any)} 
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="studio" className="m-0 focus-visible:ring-0 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {videos.filter(v => v.authorId === user?.id).map(v => (
                <VideoCard 
                  key={v.id} video={v} isActive={activeVideo?.id === v.id} 
                  currentUser={user} onClick={() => setActiveVideo(v)} 
                  onDelete={deleteVideo} 
                />
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <AddChannelModal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} userId={user?.id || ""} />
      <ManageChannelsModal isOpen={isManageModalOpen} onOpenChange={setIsManageModalOpen} subscriptions={subscriptions} userId={user?.id || ""} />
    </div>
  );
}
