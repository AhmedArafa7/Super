
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
import { PlaySquare, Loader2, Sparkles, Zap } from "lucide-react";

import { SubscriptionBar } from "./wetube/subscription-bar";
import { AddChannelModal } from "./wetube/add-channel-modal";
import { ManageChannelsModal } from "./wetube/manage-channels-modal";

/**
 * [STABILITY_ANCHOR: WETUBE_PRO_V7.0]
 * المنسق الرئيسي المطور لـ WeTube - يدعم القنوات المفضلة والتحميل التلقائي (Auto-Sync).
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

  // [FEATURE] بروتوكول التحميل التلقائي للقنوات المفضلة
  const runAutoSync = useCallback(async (subs: YouTubeSubscription[], feed: FeedVideo[]) => {
    const favoriteChannelIds = subs.filter(s => s.isFavorite).map(s => s.channelId);
    if (favoriteChannelIds.length === 0) return;

    const newFavoriteVideos = feed.filter(v => 
      favoriteChannelIds.includes(v.authorId) && 
      !cachedAssets.some(a => a.id === `video-${v.id}`)
    );

    if (newFavoriteVideos.length > 0) {
      toast({ 
        title: "جاري المزامنة التلقائية", 
        description: `تم اكتشاف ${newFavoriteVideos.length} فيديوهات جديدة في قنواتك المفضلة.` 
      });

      newFavoriteVideos.forEach(v => {
        addAsset({ 
          id: `video-${v.id}`, 
          type: 'video', 
          title: v.title, 
          sizeMB: 45 // مساحة تقديرية
        });
      });
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
        // تحديث الخلاصة تلقائياً عند تغيير الاشتراكات
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
      // تشغيل المزامنة التلقائية بعد جلب الخلاصة
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
      toast({ title: "تم إزالة الفيديو من الجهاز" });
    } else {
      addAsset({ id: assetId, type: 'video', title: video.title, sizeMB: 45 });
      toast({ title: "تم الحفظ للمشاهدة أوفلاين" });
    }
  };

  const handleVideoSelect = (v: any) => {
    setActiveVideo({
      ...v,
      source: v.source || 'youtube',
      externalUrl: v.url || v.externalUrl
    } as any);
  };

  return (
    <div className={cn("p-8 max-w-7xl mx-auto min-h-screen transition-all duration-500", activeVideo && "pt-[45vh]")}>
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse text-right">
        <div className="space-y-1">
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            WeTube
            <PlaySquare className="text-red-500 size-10 shadow-lg" />
          </h2>
          <p className="text-muted-foreground text-lg">بث ذكي يدعم التحميل التلقائي للمحتوى المفضل لديك.</p>
        </div>

        <div className="flex items-center gap-4 flex-row-reverse">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="bg-white/5 border border-white/10 rounded-2xl p-1 flex-row-reverse">
            <TabsList className="bg-transparent h-11 flex-row-reverse">
              <TabsTrigger value="explore" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">اكتشاف</TabsTrigger>
              <TabsTrigger value="subs" className="rounded-xl px-6 data-[state=active]:bg-indigo-600 font-bold">الاشتراكات</TabsTrigger>
              <TabsTrigger value="studio" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">قنواتي</TabsTrigger>
            </TabsList>
          </Tabs>
          <StreamSettings 
            quality={quality} setQuality={setQuality} 
            backgroundPlayback={backgroundPlayback} setBackgroundPlayback={setBackgroundPlayback} 
            autoFloat={autoFloat} setAutoFloat={setAutoFloat} 
          />
          <StreamUploadDialog onUpload={() => {}} onOpenVault={onOpenVault} />
        </div>
      </header>

      <div className="animate-in fade-in duration-700">
        {activeTab === 'explore' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {videos.filter(v => v.status === 'published').map(v => (
              <VideoCard 
                key={v.id} video={v} 
                isActive={activeVideo?.id === v.id} 
                isCached={cachedAssets.some(a => a.id === `video-${v.id}`)} 
                currentUser={user} 
                onClick={() => handleVideoSelect(v)} 
                onSync={handleToggleLocal} 
                onDelete={deleteVideo} 
              />
            ))}
          </div>
        )}

        {activeTab === 'subs' && (
          <div className="space-y-10">
            <SubscriptionBar 
              subscriptions={subscriptions} 
              selectedChannelId={selectedChannelId} 
              onSelectChannel={setSelectedChannelId} 
              onOpenAddModal={() => setIsAddModalOpen(true)} 
              onOpenManageModal={() => setIsManageModalOpen(true)} 
            />
            
            {isFeedLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {Array(6).fill(0).map((_, i) => <div key={i} className="aspect-video rounded-[2.5rem] bg-white/5 animate-pulse border border-white/5" />)}
              </div>
            ) : filteredFeed.length === 0 ? (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <Sparkles className="size-16 text-indigo-400" />
                <p className="text-xl font-bold">لا توجد فيديوهات جديدة في اشتراكاتك حالياً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredFeed.map(v => {
                  const isCached = cachedAssets.some(a => a.id === `video-${v.id}`);
                  return (
                    <VideoCard 
                      key={v.id} 
                      video={{...v, externalUrl: v.url, time: "اليوم"}} 
                      isActive={activeVideo?.externalUrl === v.url} 
                      isCached={isCached}
                      onSync={handleToggleLocal}
                      onClick={() => handleVideoSelect(v)} 
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {videos.filter(v => v.authorId === user?.id).map(v => (
              <VideoCard 
                key={v.id} video={v} 
                isActive={activeVideo?.id === v.id} 
                currentUser={user} 
                onClick={() => handleVideoSelect(v)} 
                onDelete={deleteVideo} 
              />
            ))}
          </div>
        )}
      </div>

      <AddChannelModal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} userId={user?.id || ""} />
      <ManageChannelsModal isOpen={isManageModalOpen} onOpenChange={setIsManageModalOpen} subscriptions={subscriptions} userId={user?.id || ""} />
    </div>
  );
}
