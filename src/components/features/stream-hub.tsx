
"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, addVideo, deleteVideo, Video } from "@/lib/video-store";
import { useUploadStore } from "@/lib/upload-store";
import { useStreamStore } from "@/lib/stream-store";
import { useGlobalStorage } from "@/lib/global-storage-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { StreamSettings } from "./stream/stream-settings";
import { StreamUploadDialog } from "./stream/stream-upload-dialog";
import { VideoCard } from "./stream/video-card";

/**
 * [STABILITY_ANCHOR: STREAMHUB_ORCHESTRATOR_V6.0]
 * المنسق الرئيسي لمنصة الفيديو - تم تفكيكه لضمان استقرار العقد البصرية.
 */
export function StreamHub({ onOpenVault }: { onOpenVault?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const addTask = useUploadStore(state => state.addTask);
  const { addAsset, cachedAssets, removeAsset } = useGlobalStorage();
  const {
    activeVideo, setActiveVideo, quality, setQuality,
    backgroundPlayback, setBackgroundPlayback, autoFloat, setAutoFloat
  } = useStreamStore();

  const [videos, setVideos] = useState<Video[]>([]);
  const [activeView, setActiveView] = useState<'explore' | 'studio'>('explore');

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
    return () => window.removeEventListener('videos-update', loadData);
  }, []);

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
    if (!user) return null;
    if (source === 'youtube' || source === 'drive') {
      await addVideo({
        title: uploadData.title,
        author: user.name,
        authorId: user.id,
        thumbnail: source === 'youtube' ? "https://images.unsplash.com/photo-1611162617474-5b21e879e113" : "https://images.unsplash.com/photo-1544391496-1ca7c974b711",
        time: source === 'youtube' ? "YouTube" : "Vault",
        status: (user.role === 'admin' || user.role === 'founder') ? 'published' : 'pending_review',
        visibility: 'public',
        allowedUserIds: [],
        uploaderRole: user.role as any,
        source: source,
        externalUrl: uploadData.externalUrl
      });
      toast({ title: "تم ربط العقدة" });
      return null;
    } else {
      const taskId = addTask(uploadData.file, 'video', { title: uploadData.title, author: user.name, authorId: user.id, status: (user.role === 'admin' || user.role === 'founder') ? 'published' : 'pending_review' });
      toast({ title: "بدأ الإرسال العصبي" });
      return taskId;
    }
  };

  const safeVideos = Array.isArray(videos) ? videos : [];
  const publicVideos = safeVideos.filter(v => v.status === 'published' && (v.visibility === 'public' || v.authorId === user?.id));

  return (
    <div className={cn("p-8 max-w-7xl mx-auto min-h-screen transition-all duration-500", activeVideo && "pt-[45vh] md:pt-[55vh]")}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse">
        <div className="text-right">
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            StreamHub
            <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary uppercase">v6.0</Badge>
          </h2>
          <p className="text-muted-foreground mt-2 text-lg text-right">فيديو مخصص يدعم Nexus Vault للوصول للمساحات الضخمة.</p>
        </div>

        <div className="flex items-center gap-4 flex-row-reverse">
          <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="bg-white/5 border border-white/10 rounded-2xl p-1 flex-row-reverse">
            <TabsList className="bg-transparent h-11 flex-row-reverse">
              <TabsTrigger value="explore" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">اكتشاف</TabsTrigger>
              <TabsTrigger value="studio" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">استوديو العقدة</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <StreamSettings quality={quality} setQuality={setQuality} backgroundPlayback={backgroundPlayback} setBackgroundPlayback={setBackgroundPlayback} autoFloat={autoFloat} setAutoFloat={setAutoFloat} />
            <StreamUploadDialog onUpload={handleUpload} onOpenVault={onOpenVault} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {(activeView === 'explore' ? publicVideos : safeVideos.filter(v => v.authorId === user?.id)).map((video) => (
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
    </div>
  );
}
