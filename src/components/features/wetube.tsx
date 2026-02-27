
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, addVideo, deleteVideo, Video } from "@/lib/video-store";
import { listenToSubscriptions, YouTubeSubscription } from "@/lib/subscription-store";
import { fetchAllSubscriptionsFeed, FeedVideo } from "@/lib/youtube-feed-store";
import { useUploadStore } from "@/lib/upload-store";
import { useStreamStore } from "@/lib/stream-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { StreamSettings } from "./stream/stream-settings";
import { StreamUploadDialog } from "./stream/stream-upload-dialog";
import { VideoCard } from "./stream/video-card";
import { Youtube, Loader2, Zap } from "lucide-react";

// استيراد المكونات المقطوعة (Modular Components)
import { SubscriptionBar } from "./wetube/subscription-bar";
import { AddChannelModal } from "./wetube/add-channel-modal";
import { ManageChannelsModal } from "./wetube/manage-channels-modal";

export const runtime = 'edge';

/**
 * [STABILITY_ANCHOR: WETUBE_MODULAR_V1.0]
 * محرك WeTube السيادي المطور: الفصل الهيكلي الكامل لضمان استقرار العقد البرمجية.
 */
export function WeTube({ onOpenVault }: { onOpenVault?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const addTask = useUploadStore(state => state.addTask);
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

  const loadData = async () => {
    try {
      const data = await getStoredVideos();
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      setVideos([]);
    }
  };

  const loadFullFeed = useCallback(async (subs: YouTubeSubscription[]) => {
    if (subs.length === 0) {
      setFeedVideos([]);
      setFilteredFeed([]);
      return;
    }
    setIsFeedLoading(true);
    try {
      const channelIds = subs.map(s => s.channelId).filter(Boolean);
      const feed = await fetchAllSubscriptionsFeed(channelIds);
      setFeedVideos(feed);
      setFilteredFeed(feed);
    } catch (err) {
      console.error("Feed Sync Failure", err);
    } finally {
      setIsFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    if (user?.id) {
      const unsubscribe = listenToSubscriptions(user.id, (subs) => {
        setSubscriptions(subs);
        if (activeView === 'subscriptions') loadFullFeed(subs);
      });
      return () => unsubscribe();
    }
  }, [user?.id, activeView, loadFullFeed]);

  useEffect(() => {
    if (!selectedChannelId) {
      setFilteredFeed(feedVideos);
    } else {
      setFilteredFeed(feedVideos.filter(v => v.authorId === selectedChannelId));
    }
  }, [selectedChannelId, feedVideos]);

  const handleSyncToLocal = (video: Video) => {
    const assetId = `video-${video.id}`;
    if (cachedAssets.some(a => a.id === assetId)) {
      removeAsset(assetId);
      toast({ title: "فك الارتباط الفيزيائي" });
    } else {
      addAsset({ id: assetId, type: 'video', title: video.title, sizeMB: 45 });
      toast({ title: "مزامنة ناجحة للعقدة" });
    }
  };

  const handleUpload = async (source: any, uploadData: any) => {
    if (!user) return;
    
    let finalThumbnail = uploadData.thumbnail;
    if (source === 'youtube' && uploadData.externalUrl) {
      const vid = uploadData.externalUrl.match(/(?:v=|\/embed\/|youtu.be\/)([^&?#]+)/)?.[1];
      if (vid) {
        finalThumbnail = `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`;
      }
    }

    await addVideo({
      title: uploadData.title,
      author: user.name,
      authorId: user.id,
      thumbnail: finalThumbnail || "https://images.unsplash.com/photo-1544391496-1ca7c974b711",
      time: source === 'youtube' ? "YouTube" : "Vault",
      status: user.role === 'admin' ? 'published' : 'pending_review',
      visibility: 'public',
      allowedUserIds: [],
      uploaderRole: user.role as any,
      source: source,
      externalUrl: uploadData.externalUrl
    });
    toast({ title: "تم بث العقدة بنجاح" });
  };

  const publicVideos = videos.filter(v => v.status === 'published' && (v.visibility === 'public' || v.authorId === user?.id));

  return (
    <div className={cn("p-8 max-w-7xl mx-auto min-h-screen transition-all duration-500", activeVideo && "pt-[45vh] md:pt-[55vh]")}>
      <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse text-right">
          <div className="text-right">
            <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
              WeTube
              <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary uppercase">v12.5</Badge>
            </h2>
            <p className="text-muted-foreground mt-2 text-lg text-right">بوابة البث السيادي والاشتراكات العميقة بصور حقيقية.</p>
          </div>

          <div className="flex items-center gap-4 flex-row-reverse">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex flex-row-reverse flex-wrap justify-center">
              <TabsList className="bg-transparent h-11 flex-row-reverse border-none">
                <TabsTrigger value="explore" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">اكتشاف</TabsTrigger>
                <TabsTrigger value="subscriptions" className="rounded-xl px-6 data-[state=active]:bg-indigo-600 font-bold gap-2">
                  <Youtube className="size-3" /> خلاصتي
                </TabsTrigger>
                <TabsTrigger value="studio" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">استوديو العقدة</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-2">
              <StreamSettings quality={quality} setQuality={setQuality} backgroundPlayback={backgroundPlayback} setBackgroundPlayback={setBackgroundPlayback} autoFloat={autoFloat} setAutoFloat={setAutoFloat} />
              <StreamUploadDialog onUpload={handleUpload} onOpenVault={onOpenVault} />
            </div>
          </div>
        </div>

        <TabsContent value="explore" className="mt-0 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {publicVideos.map((video) => (
              <VideoCard 
                key={video.id} 
                video={video} 
                isActive={activeVideo?.id === video.id} 
                isCached={cachedAssets.some(a => a.id === `video-${video.id}`)} 
                currentUser={user} 
                onClick={() => setActiveVideo(video)} 
                onSync={handleSyncToLocal} 
                onDelete={deleteVideo} 
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-0 space-y-10 animate-in fade-in">
          <SubscriptionBar 
            subscriptions={subscriptions}
            selectedChannelId={selectedChannelId}
            onSelectChannel={setSelectedChannelId}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenManageModal={() => setIsManageModalOpen(true)}
          />

          {isFeedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-20">
              {Array(6).fill(0).map((_, i) => <div key={i} className="aspect-video rounded-[2.5rem] bg-white/5 animate-pulse border border-white/5" />)}
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 opacity-30 text-center space-y-6">
              <div className="size-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <Youtube className="size-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold">لا توجد نبضات بصرية</p>
                <p className="text-sm">اشترك في بعض القنوات الحقيقية لتظهر فيديوهاتها هنا.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredFeed.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={{
                    ...video,
                    externalUrl: video.url,
                    views: "YouTube Feed",
                    time: new Date(video.published).toLocaleDateString('ar-EG')
                  }} 
                  isActive={activeVideo?.externalUrl === video.url} 
                  isCached={false} 
                  currentUser={user} 
                  onClick={() => setActiveVideo({
                    id: video.id,
                    title: video.title,
                    thumbnail: video.thumbnail,
                    views: "YouTube",
                    author: video.author,
                    authorId: video.authorId,
                    time: "Live Feed",
                    status: 'published',
                    visibility: 'public',
                    allowedUserIds: [],
                    uploaderRole: 'user',
                    createdAt: video.published,
                    source: 'youtube',
                    externalUrl: video.url
                  })} 
                  onSync={() => {}} 
                  onDelete={() => {}} 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="studio" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {videos.filter(v => v.authorId === user?.id).map((video) => (
              <VideoCard 
                key={video.id} 
                video={video} 
                isActive={activeVideo?.id === video.id} 
                isCached={cachedAssets.some(a => a.id === `video-${video.id}`)} 
                currentUser={user} 
                onClick={() => setActiveVideo(video)} 
                onSync={handleSyncToLocal} 
                onDelete={deleteVideo} 
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {user && (
        <>
          <AddChannelModal 
            isOpen={isAddModalOpen} 
            onOpenChange={setIsAddModalOpen} 
            userId={user.id} 
          />
          <ManageChannelsModal 
            isOpen={isManageModalOpen} 
            onOpenChange={setIsManageModalOpen} 
            subscriptions={subscriptions}
            userId={user.id} 
          />
        </>
      )}
    </div>
  );
}
