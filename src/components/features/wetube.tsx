
"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, addVideo, deleteVideo, Video } from "@/lib/video-store";
import { addSubscription, deleteSubscription, listenToSubscriptions, YouTubeSubscription } from "@/lib/subscription-store";
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
import { Youtube, Plus, Trash2, ExternalLink, Globe, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * [STABILITY_ANCHOR: WETUBE_ORCHESTRATOR_V1.2]
 * محرك WeTube المطور - تم إضافة ميزة استخراج اسم القناة تلقائياً من الرابط.
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
  const [activeView, setActiveView] = useState<'explore' | 'studio' | 'subs'>('explore');
  const [newSubUrl, setNewSubUrl] = useState("");
  const [newSubName, setNewSubName] = useState("");

  const loadData = async () => {
    try {
      const data = await getStoredVideos();
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      setVideos([]);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('videos-update', loadData);
    if (user?.id) {
      const unsubscribe = listenToSubscriptions(user.id, (subs) => setSubscriptions(subs));
      return () => {
        window.removeEventListener('videos-update', loadData);
        unsubscribe();
      };
    }
    return () => window.removeEventListener('videos-update', loadData);
  }, [user?.id]);

  const extractChannelName = (url: string) => {
    try {
      if (url.includes('@')) {
        return url.split('@')[1].split('/')[0].split('?')[0];
      }
      if (url.includes('/channel/')) {
        return "Channel Node";
      }
      if (url.includes('/c/')) {
        return url.split('/c/')[1].split('/')[0].split('?')[0];
      }
      return "";
    } catch (e) { return ""; }
  };

  const handleUrlInput = (val: string) => {
    setNewSubUrl(val);
    if (!newSubName) {
      const detected = extractChannelName(val);
      if (detected) setNewSubName(detected);
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
        thumbnail: source === 'youtube' ? "https://images.unsplash.com/photo-1611162617474-5b21e879e113" : "https://images.unsplash.com/photo-1544391496-1ca7c974b711",
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
    if (!user || !newSubUrl || !newSubName) return;
    try {
      await addSubscription(user.id, newSubUrl, newSubName);
      toast({ title: "تمت الإضافة للمنطقة الخاصة", description: "هذه القناة تظهر لك أنت فقط." });
      setNewSubUrl("");
      setNewSubName("");
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
              <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary uppercase">v7.0</Badge>
            </h2>
            <p className="text-muted-foreground mt-2 text-lg text-right">بث مخصص واشتراكات خاصة في منطقتك العصبية.</p>
          </div>

          <div className="flex items-center gap-4 flex-row-reverse">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex flex-row-reverse">
              <TabsList className="bg-transparent h-11 flex-row-reverse border-none">
                <TabsTrigger value="explore" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">اكتشاف</TabsTrigger>
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

        <TabsContent value="subs" className="mt-0 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-8">
            <Card className="glass border-white/5 rounded-[2.5rem] p-8 text-right space-y-6 max-w-2xl ml-auto">
              <div className="flex items-center gap-3 justify-end">
                <h3 className="text-xl font-bold text-white">إضافة قناة خاصة</h3>
                <Youtube className="text-red-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  dir="auto"
                  placeholder="اسم القناة..." 
                  className="bg-white/5 border-white/10 h-12 text-right"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                />
                <Input 
                  placeholder="رابط القناة على يوتيوب..." 
                  className="bg-white/5 border-white/10 h-12 text-right"
                  value={newSubUrl}
                  onChange={e => handleUrlInput(e.target.value)}
                />
              </div>
              <Button onClick={handleAddSubscription} disabled={!newSubUrl || !newSubName} className="w-full bg-indigo-600 h-12 rounded-xl font-bold gap-2">
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
                      <p className="text-[9px] text-muted-foreground uppercase font-mono mt-0.5">Private Node</p>
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
