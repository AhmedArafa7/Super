"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, addVideo, deleteVideo, Video } from "@/lib/video-store";
import { addSubscription, deleteSubscription, listenToSubscriptions, YouTubeSubscription } from "@/lib/subscription-store";
import { fetchAllSubscriptionsFeed, FeedVideo, fetchChannelVideos } from "@/lib/youtube-feed-store";
import { useUploadStore } from "@/lib/upload-store";
import { useStreamStore } from "@/lib/stream-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { StreamSettings } from "./stream/stream-settings";
import { StreamUploadDialog } from "./stream/stream-upload-dialog";
import { VideoCard } from "./stream/video-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Youtube, Plus, Trash2, ExternalLink, Globe, Lock, Loader2, Zap, LayoutGrid, UserCircle, Settings2, MoreVertical, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";

/**
 * [STABILITY_ANCHOR: WETUBE_ORCHESTRATOR_V10.0_FINAL]
 * محرك WeTube السيادي - جلب الصور الحقيقية والقضاء على التخمينات الوهمية.
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
  
  const [newSubUrl, setNewSubUrl] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubId, setNewSubId] = useState("");
  const [newSubAvatar, setNewSubAvatar] = useState("");
  const [isFetchingName, setIsFetchingName] = useState(false);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const fetchChannelMetadata = async (url: string) => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return;
    setIsFetchingName(true);
    try {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // جلب الاسم الحقيقي
      const title = doc.querySelector('title')?.textContent;
      if (title) {
        setNewSubName(title.replace(' - YouTube', '').trim());
      }

      // جلب معرف القناة الحقيقي
      const channelIdMatch = html.match(/"channelId":"(.*?)"/) || 
                           html.match(/meta itemprop="channelId" content="(.*?)"/) ||
                           html.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
      
      if (channelIdMatch) {
        setNewSubId(channelIdMatch[1]);
      }

      // جلب صورة البروفايل الحقيقية
      const avatarMatch = html.match(/<meta property="og:image" content="(.*?)"/) ||
                         html.match(/<link rel="image_src" href="(.*?)"/);
      if (avatarMatch) {
        setNewSubAvatar(avatarMatch[1]);
      }
    } catch (e) {
      console.error("Metadata Sync Interrupt:", e);
    } finally {
      setIsFetchingName(false);
    }
  };

  const handleAddSubscription = async () => {
    if (!user || !newSubUrl || !newSubName || !newSubId) return;
    try {
      await addSubscription(user.id, newSubUrl, newSubName, newSubId, newSubAvatar);
      toast({ title: "تم التشفير والارتباط", description: "القناة أصبحت جزءاً من خلاصتك السيادية." });
      setNewSubUrl("");
      setNewSubName("");
      setNewSubId("");
      setNewSubAvatar("");
      setIsAddModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الارتباط" });
    }
  };

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
              <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary uppercase">v10.0</Badge>
            </h2>
            <p className="text-muted-foreground mt-2 text-lg text-right">بوابة البث السيادي والاشتراكات العميقة بصور حقيقية.</p>
          </div>

          <div className="flex items-center gap-4 flex-row-reverse">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex flex-row-reverse flex-wrap justify-center">
              <TabsList className="bg-transparent h-11 flex-row-reverse border-none">
                <TabsTrigger value="explore" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">اكتشاف</TabsTrigger>
                <TabsTrigger value="subscriptions" className="rounded-xl px-6 data-[state=active]:bg-indigo-600 font-bold gap-2">
                  <Youtube className="size-3" /> اشتراكاتي
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
          <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl py-4 border-b border-white/5 -mx-8 px-8">
            <div className="flex items-center justify-between flex-row-reverse gap-6">
              <ScrollArea className="flex-1" dir="rtl">
                <div className="flex items-center gap-4 pb-4">
                  <Button 
                    variant={selectedChannelId === null ? 'default' : 'outline'}
                    onClick={() => setSelectedChannelId(null)}
                    className={cn(
                      "rounded-2xl h-14 px-6 font-bold gap-2 shrink-0 transition-all",
                      selectedChannelId === null ? "bg-indigo-600 shadow-lg shadow-indigo-600/20" : "border-white/10"
                    )}
                  >
                    <LayoutGrid className="size-4" /> الكل
                  </Button>
                  
                  {subscriptions.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedChannelId(selectedChannelId === sub.channelId ? null : sub.channelId)}
                      className={cn(
                        "flex flex-col items-center gap-2 group shrink-0 px-2 transition-all",
                        selectedChannelId === sub.channelId ? "scale-110" : "opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className={cn(
                        "size-14 rounded-full flex items-center justify-center border-2 transition-all overflow-hidden bg-slate-900",
                        selectedChannelId === sub.channelId ? "border-indigo-500 shadow-lg shadow-indigo-500/20" : "border-white/10 group-hover:border-white/30"
                      )}>
                        <img src={sub.avatarUrl || `https://picsum.photos/seed/${sub.channelId}/100/100`} className="size-full object-cover" alt={sub.channelName} />
                      </div>
                      <span className="text-[10px] font-bold text-white truncate max-w-[70px]">{sub.channelName}</span>
                    </button>
                  ))}

                  <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="size-14 rounded-full border-dashed border-white/20 shrink-0 hover:bg-white/5">
                        <Plus className="size-6 text-muted-foreground" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right">
                      <DialogHeader>
                        <DialogTitle className="text-right">ربط قناة حقيقية</DialogTitle>
                        <DialogDescription className="text-right">انسخ رابط القناة وسيتم استرداد كافة البيانات البصرية الأصلية.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-6">
                        <Input 
                          placeholder="رابط القناة (URL)..." 
                          className="bg-white/5 border-white/10 h-12 text-right"
                          value={newSubUrl}
                          onChange={e => {
                            setNewSubUrl(e.target.value);
                            if (e.target.value.length > 10) fetchChannelMetadata(e.target.value);
                          }}
                        />
                        <div className="relative">
                          <Input 
                            dir="auto"
                            placeholder="اسم القناة المكتشف..." 
                            className="bg-white/5 border-white/10 h-12 text-right pr-4"
                            value={newSubName}
                            onChange={e => setNewSubName(e.target.value)}
                          />
                          {isFetchingName && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin" />}
                        </div>
                        {newSubAvatar && (
                          <div className="flex items-center gap-3 justify-end p-2 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                            <span className="text-[10px] font-bold text-indigo-400">تم اكتشاف أيقونة القناة</span>
                            <div className="size-10 rounded-full overflow-hidden border border-white/10">
                              <img src={newSubAvatar} className="size-full object-cover" alt="Preview" />
                            </div>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleAddSubscription} 
                          disabled={!newSubUrl || !newSubName || !newSubId || isFetchingName} 
                          className="w-full bg-indigo-600 h-12 rounded-xl font-bold"
                        >
                          تأكيد الاشتراك السيادي
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <ScrollBar orientation="horizontal" className="hidden" />
              </ScrollArea>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => loadFullFeed(subscriptions)} className="rounded-xl border border-white/5">
                  <Zap className={cn("size-4 text-amber-400", isFeedLoading && "animate-pulse")} />
                </Button>
              </div>
            </div>
          </div>

          {isFeedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-20">
              {Array(6).fill(0).map((_, i) => <div key={i} className="aspect-video rounded-[2.5rem] bg-white/5 animate-pulse" />)}
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 opacity-30 text-center">
              <Youtube className="size-20 mb-6" />
              <p className="text-xl font-bold">لا يوجد نبض بصري في هذا النطاق حالياً</p>
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
                  isActive={activeVideo?.url === video.url} 
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
    </div>
  );
}
