
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, addVideo, deleteVideo, Video } from "@/lib/video-store";
import { listenToSubscriptions, YouTubeSubscription } from "@/lib/subscription-store";
import { fetchAllSubscriptionsFeed, FeedVideo } from "@/lib/youtube-feed-store";
import { useStreamStore } from "@/lib/stream-store"; 
import { useGlobalStorage } from "@/lib/global-storage-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { StreamSettings } from "./stream/stream-settings";
import { StreamUploadDialog } from "./stream/stream-upload-dialog";
import { VideoCard } from "./stream/video-card";
import { Youtube, Loader2, PlaySquare } from "lucide-react";

import { SubscriptionBar } from "./wetube/subscription-bar";
import { AddChannelModal } from "./wetube/add-channel-modal";
import { ManageChannelsModal } from "./wetube/manage-channels-modal";

export const runtime = 'edge';

/**
 * [STABILITY_ANCHOR: WETUBE_MODULAR_V1.0]
 * المنسق الرئيسي لـ WeTube - تم تفكيك المكونات لضمان الاستقرار وسهولة الصيانة.
 */
export function WeTube({ onOpenVault }: { onOpenVault?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addAsset, cachedAssets, removeAsset } = useGlobalStorage();
  const { 
    activeVideo, setActiveVideo, quality, setQuality, 
    backgroundPlayback, setBackgroundPlayback, autoFloat, setAutoFloat 
  } = useStreamStore();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [subscriptions, setSubscriptions] = useState<YouTubeSubscription[]>([]);
  const [feedVideos, setFeedVideos] = useState<FeedVideo[]>([]);
  const [filteredFeed, setFilteredFeed] = useState<FeedVideo[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  
  const [activeView, setActiveView] = useState<'explore' | 'subscriptions' | 'studio'>('explore');
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getStoredVideos();
      setVideos(data || []);
    };
    load();
    if (user?.id) {
      return listenToSubscriptions(user.id, (subs) => {
        setSubscriptions(subs);
        if (activeView === 'subscriptions') loadFeed(subs);
      });
    }
  }, [user?.id, activeView]);

  const loadFeed = async (subs: YouTubeSubscription[]) => {
    if (subs.length === 0) return;
    setIsFeedLoading(true);
    const feed = await fetchAllSubscriptionsFeed(subs.map(s => s.channelId));
    setFeedVideos(feed);
    setFilteredFeed(feed);
    setIsFeedLoading(false);
  };

  useEffect(() => {
    if (!selectedChannelId) setFilteredFeed(feedVideos);
    else setFilteredFeed(feedVideos.filter(v => v.authorId === selectedChannelId));
  }, [selectedChannelId, feedVideos]);

  const handleSyncToLocal = (video: Video) => {
    const assetId = `video-${video.id}`;
    if (cachedAssets.some(a => a.id === assetId)) {
      removeAsset(assetId);
      toast({ title: "تم إلغاء المزامنة" });
    } else {
      addAsset({ id: assetId, type: 'video', title: video.title, sizeMB: 40 });
      toast({ title: "تم الحفظ للمشاهدة أوفلاين" });
    }
  };

  const handleUpload = async (source: any, uploadData: any) => {
    if (!user) return;
    await addVideo({
      title: uploadData.title,
      author: user.name,
      authorId: user.id,
      thumbnail: uploadData.thumbnail || "https://picsum.photos/seed/yt/800/450",
      time: source === 'youtube' ? "YouTube" : "Vault",
      status: user.role === 'admin' ? 'published' : 'pending_review',
      visibility: 'public',
      allowedUserIds: [],
      uploaderRole: user.role as any,
      source: source,
      externalUrl: uploadData.externalUrl
    });
    toast({ title: "تمت الإضافة بنجاح" });
  };

  const publicVideos = videos.filter(v => v.status === 'published');

  return (
    <div className={cn("p-8 max-w-7xl mx-auto min-h-screen", activeVideo && "pt-[45vh]")}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse text-right">
        <div className="text-right">
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            WeTube
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">V12</Badge>
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">بث فيديوهاتك المفضلة وإدارة اشتراكاتك في مكان واحد.</p>
        </div>

        <div className="flex items-center gap-4 flex-row-reverse">
          <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="bg-white/5 border border-white/10 rounded-2xl p-1 flex-row-reverse">
            <TabsList className="bg-transparent h-11 flex-row-reverse border-none">
              <TabsTrigger value="explore" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">اكتشاف</TabsTrigger>
              <TabsTrigger value="subscriptions" className="rounded-xl px-6 data-[state=active]:bg-indigo-600 font-bold gap-2">الاشتراكات</TabsTrigger>
              <TabsTrigger value="studio" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">قنواتي</TabsTrigger>
            </TabsList>
          </Tabs>
          <StreamSettings quality={quality} setQuality={setQuality} backgroundPlayback={backgroundPlayback} setBackgroundPlayback={setBackgroundPlayback} autoFloat={autoFloat} setAutoFloat={setAutoFloat} />
          <StreamUploadDialog onUpload={handleUpload} onOpenVault={onOpenVault} />
        </div>
      </div>

      <TabsContent value="explore" className="animate-in fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {publicVideos.map(v => <VideoCard key={v.id} video={v} isActive={activeVideo?.id === v.id} isCached={cachedAssets.some(a => a.id === `video-${v.id}`)} currentUser={user} onClick={() => setActiveVideo(v)} onSync={handleSyncToLocal} onDelete={deleteVideo} />)}
        </div>
      </TabsContent>

      <TabsContent value="subscriptions" className="animate-in fade-in space-y-10">
        <SubscriptionBar subscriptions={subscriptions} selectedChannelId={selectedChannelId} onSelectChannel={setSelectedChannelId} onOpenAddModal={() => setIsAddModalOpen(true)} onOpenManageModal={() => setIsManageModalOpen(true)} />
        {isFeedLoading ? <div className="grid grid-cols-1 md:grid-cols-3 gap-10">{Array(6).fill(0).map((_, i) => <div key={i} className="aspect-video rounded-[2.5rem] bg-white/5 animate-pulse" />)}</div> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {filteredFeed.map(v => <VideoCard key={v.id} video={{...v, externalUrl: v.url, time: "Live"}} isActive={activeVideo?.externalUrl === v.url} onClick={() => setActiveVideo({...v, source: 'youtube', externalUrl: v.url} as any)} />)}
          </div>
        )}
      </TabsContent>

      <TabsContent value="studio">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {videos.filter(v => v.authorId === user?.id).map(v => <VideoCard key={v.id} video={v} isActive={activeVideo?.id === v.id} currentUser={user} onClick={() => setActiveVideo(v)} onDelete={deleteVideo} />)}
        </div>
      </TabsContent>

      <AddChannelModal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} userId={user?.id || ""} />
      <ManageChannelsModal isOpen={isManageModalOpen} onOpenChange={setIsManageModalOpen} subscriptions={subscriptions} userId={user?.id || ""} />
    </div>
  );
}
