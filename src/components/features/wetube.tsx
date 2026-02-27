
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, addVideo, deleteVideo, Video } from "@/lib/video-store";
import { addSubscription, deleteSubscription, listenToSubscriptions, YouTubeSubscription } from "@/lib/subscription-store";
import { fetchAllSubscriptionsFeed, FeedVideo } from "@/lib/youtube-feed-store";
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
import { Youtube, Plus, Trash2, ExternalLink, Globe, Lock, Loader2, Zap, LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * [STABILITY_ANCHOR: WETUBE_ORCHESTRATOR_V8.0]
 * محرك WeTube المطور - تم تفعيل خلاصة الاشتراكات الحقيقية (Sub Feed).
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
  const [activeView, setActiveView] = useState<'explore' | 'feed' | 'studio' | 'subs'>('explore');
  const [newSubUrl, setNewSubUrl] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubId, setNewSubId] = useState("");
  const [isFetchingName, setIsFetchingName] = useState(false);
  const [isFeedLoading, setIsFeedLoading] = useState(false);

  const loadData = async () => {
    try {
      const data = await getStoredVideos();
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      setVideos([]);
    }
  };

  const loadFeed = useCallback(async (subs: YouTubeSubscription[]) => {
    if (subs.length === 0) {
      setFeedVideos([]);
      return;
    }
    setIsFeedLoading(true);
    try {
      const channelIds = subs.map(s => s.channelId).filter(Boolean);
      const feed = await fetchAllSubscriptionsFeed(channelIds);
      setFeedVideos(feed);
    } catch (err) {
      console.error("Feed Sync Failure", err);
    } finally {
      setIsFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('videos-update', loadData);
    if (user?.id) {
      const unsubscribe = listenToSubscriptions(user.id, (subs) => {
        setSubscriptions(subs);
        // تحديث الخلاصة عند تغيير الاشتراكات
        if (activeView === 'feed') loadFeed(subs);
      });
      return () => {
        window.removeEventListener('videos-update', loadData);
        unsubscribe();
      };
    }
    return () => window.removeEventListener('videos-update', loadData);
  }, [user?.id, activeView, loadFeed]);

  const fetchChannelMetadata = async (url: string) => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return;
    setIsFetchingName(true);
    try {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // استخراج الاسم
      const title = doc.querySelector('title')?.textContent;
      if (title) {
        setNewSubName(title.replace(' - YouTube', '').trim());
      }

      // استخراج channelId بدقة
      const channelIdMatch = html.match(/"channelId":"(.*?)"/) || html.match(/meta itemprop="channelId" content="(.*?)"/);
      if (channelIdMatch) {
        setNewSubId(channelIdMatch[1]);
      }
    } catch (e) {
      console.error("Neural Fetch Fail:", e);
    } finally {
      setIsFetchingName(false);
    }
  };

  const handleUrlInput = (val: string) => {
    setNewSubUrl(val);
    if (val.length > 10) {
      fetchChannelMetadata(val);
    }
  };

  const handleSyncToLocal = (video: Video) => {
    const assetId = `video-${video.id}`;
    if (cachedAssets.some(a => a.id === assetId)) {
      removeAsset(assetId);
      toast({ title: "تم فك الارتباط", description: "تمت إزالة الفيديو من الذاكرة المحلية." });
    } else {
      addAsset({ id: assetId, type: 'video', title: video.title, sizeMB: Math.floor(Math.random() * 50 + 10) });
      toast({ title: "مزامنة ناجحة", description: "الفيديو متاح الآن أوفلاين." });
    }
  };

  const handleUpload = async (source: any, uploadData: any) => {
    if (!user) return;
    if (source === 'youtube' || source === 'drive') {
      await addVideo({
        title: uploadData.title,
        author: user.name,
        authorId: user.id,
        thumbnail: source === 'youtube' ? `https://img.youtube.com/vi/${uploadData.externalUrl.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg` : "https://images.unsplash.com/photo-1544391496-1ca7c974b711",
        time: source === 'youtube' ? "YouTube" : "Vault",
        status: user.role === 'admin' ? 'published' : 'pending_review',
        visibility: 'public',
        allowedUserIds: [],
        uploaderRole: user.role as any,
        source: source,
        externalUrl: uploadData.externalUrl
      });
      toast({ title: "تم ربط العقدة" });
    } else {
      addTask(uploadData.file, 'video', { title: uploadData.title, author: user.name, authorId: user.id, status: user.role === 'admin' ? 'published' : 'pending_review' });
      toast({ title: "بدأ الإرسال العصبي" });
    }
  };

  const handleAddSubscription = async () => {
    if (!user || !newSubUrl || !newSubName || !newSubId) return;
    try {
      await addSubscription(user.id, newSubUrl, newSubName, newSubId);
      toast({ title: "تمت الإضافة للمنطقة الخاصة", description: "هذه القناة تظهر لك أنت فقط." });
      setNewSubUrl("");
      setNewSubName("");
      setNewSubId("");
    } catch (e) {
      toast({ variant: "destructive", title: "فشل إضافة الاشتراك" });
    }
  };

  const safeVideos = Array.isArray(videos) ? videos : [];
  const publicVideos = safeVideos.filter(v => v.status === 'published' && (v.visibility === 'public' || v.authorId === user?.id));

  return (
    <div className={cn("p-8 max-w-7xl mx-auto min-h-screen transition-all duration-500", activeVideo && "pt-[45vh] md:pt-[55vh]")}>
      <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse text-right">
          <div className="text-right">
            <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
              WeTube
              <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary uppercase">v8.0</Badge>
            </h2>
            <p className="text-muted-foreground mt-2 text-lg text-right">بث مخصص وخلاصة اشتراكات حقيقية في منطقتك العصبية.</p>
          </div>

          <div className="flex items-center gap-4 flex-row-reverse">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex flex-row-reverse flex-wrap justify-center">
              <TabsList className="bg-transparent h-11 flex-row-reverse border-none">
                <TabsTrigger value="explore" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">اكتشاف</TabsTrigger>
                <TabsTrigger value="feed" className="rounded-xl px-6 data-[state=active]:bg-indigo-600 font-bold gap-2">
                  <LayoutGrid className="size-3" /> خلاصتي
                </TabsTrigger>
                <TabsTrigger value="subs" className="rounded-xl px-6 data-[state=active]:bg-indigo-600 font-bold gap-2">
                  <Lock className="size-3" /> اشتراكاتي
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

        <TabsContent value="explore" className="mt-0">
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

        <TabsContent value="feed" className="mt-0 animate-in fade-in slide-in-from-bottom-4">
          {isFeedLoading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="size-12 animate-spin text-primary" />
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs animate-pulse">جاري تجميع الخلاصة العصبية...</p>
            </div>
          ) : feedVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
              <div className="size-20 bg-indigo-500/10 rounded-full flex items-center justify-center">
                <Youtube className="size-10 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">خلاصتك فارغة حالياً</h3>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  اشترك في قنوات يوتيوب من تبويب "اشتراكاتي" لتظهر لك أحدث فيديوهاتهم هنا تلقائياً.
                </p>
              </div>
              <Button onClick={() => setActiveView('subs')} className="bg-indigo-600 rounded-xl px-8 h-12 font-bold">الذهاب للاشتراكات</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {feedVideos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={{
                    ...video,
                    externalUrl: video.url,
                    views: "YouTube",
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
                    time: "Now",
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

        <TabsContent value="subs" className="mt-0 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-8">
            <Card className="glass border-white/5 rounded-[2.5rem] p-8 text-right space-y-6 max-w-2xl ml-auto">
              <div className="flex items-center gap-3 justify-end">
                <h3 className="text-xl font-bold text-white">إضافة قناة خاصة</h3>
                <Youtube className="text-red-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input 
                    dir="auto"
                    placeholder="اسم القناة..." 
                    className="bg-white/5 border-white/10 h-12 text-right pr-4"
                    value={newSubName}
                    onChange={e => setNewSubName(e.target.value)}
                  />
                  {isFetchingName && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin" />}
                </div>
                <Input 
                  placeholder="رابط القناة على يوتيوب..." 
                  className="bg-white/5 border-white/10 h-12 text-right"
                  value={newSubUrl}
                  onChange={e => handleUrlInput(e.target.value)}
                />
              </div>
              <Button onClick={handleAddSubscription} disabled={!newSubUrl || !newSubName || !newSubId || isFetchingName} className="w-full bg-indigo-600 h-12 rounded-xl font-bold gap-2">
                <Plus className="size-4" /> حفظ في المنطقة خاصة
              </Button>
              <p className="text-[10px] text-muted-foreground text-center italic">
                * هذه الروابط مخزنة في عقدتك الخاصة ولن تظهر لأي مستخدم آخر.
              </p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map(sub => (
                <Card key={sub.id} className="p-6 glass border-white/5 rounded-3xl flex items-center justify-between flex-row-reverse group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-4 flex-row-reverse text-right">
                    <div className="size-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <Youtube className="size-6 text-red-500" />
                    </div>
                    <div>
                      <h4 dir="auto" className="font-bold text-white truncate max-w-[150px]">{sub.channelName}</h4>
                      <p className="text-[9px] text-muted-foreground uppercase font-mono mt-0.5">ID: {sub.channelId.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => window.open(sub.channelUrl, '_blank')} className="size-9 rounded-xl hover:bg-white/5 text-indigo-400">
                      <ExternalLink className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteSubscription(user!.id, sub.id)} className="size-9 rounded-xl hover:bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </Card>
              ))}
              {subscriptions.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  لا توجد قنوات خاصة محفوظة حالياً.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="studio" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {safeVideos.filter(v => v.authorId === user?.id).map((video) => (
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
