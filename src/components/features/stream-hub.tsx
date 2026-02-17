
"use client";

import React, { useState, useEffect } from "react";
import { Play, Plus, Upload, MoreVertical, Clock, Eye, Trash2, ShieldCheck, Lock, EyeOff, CheckCircle2, AlertCircle, LayoutDashboard, Globe, Loader2, X, Zap, Share2, MessageSquare, Youtube, ExternalLink, FileVideo, Radio, Sparkles, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, addVideo, deleteVideo, Video, Visibility, VideoSource } from "@/lib/video-store";
import { useUploadStore } from "@/lib/upload-store";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

// Helper to extract YouTube ID
const getYoutubeId = (url?: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export function StreamHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const addTask = useUploadStore(state => state.addTask);
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'explore' | 'studio'>('explore');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  // Quality Settings Logic
  const [videoQuality, setVideoQuality] = useState<string>("240");

  useEffect(() => {
    // Load saved quality preference
    const savedQuality = localStorage.getItem("nexus_stream_quality");
    if (savedQuality) {
      setVideoQuality(savedQuality);
    }
  }, []);

  const handleQualityUpdate = (val: string) => {
    setVideoQuality(val);
    localStorage.setItem("nexus_stream_quality", val);
    toast({
      title: "تم تحديث الجودة",
      description: `تم ضبط جودة البث الافتراضية على ${val}p لجميع الفيديوهات.`
    });
  };

  const [uploadSource, setUploadSource] = useState<VideoSource>('local');
  const [uploadData, setUploadData] = useState({
    title: "",
    visibility: "public" as Visibility,
    allowedUsers: "",
    externalUrl: "",
    file: null as File | null
  });

  const loadData = async () => {
    try {
      const data = await getStoredVideos();
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to sync neural stream:", err);
      setVideos([]);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('videos-update', loadData);
    return () => window.removeEventListener('videos-update', loadData);
  }, []);

  const handleFinalizeUpload = async () => {
    if (!uploadData.title || !user) return;
    
    if (uploadSource === 'youtube') {
      if (!uploadData.externalUrl) return;
      await addVideo({
        title: uploadData.title,
        author: user.name,
        authorId: user.id,
        thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1074&auto=format&fit=crop",
        time: "YouTube Broadcast",
        status: user.role === 'admin' ? 'published' : 'pending_review',
        visibility: uploadData.visibility,
        allowedUserIds: [],
        uploaderRole: user.role,
        source: 'youtube',
        externalUrl: uploadData.externalUrl
      });
      toast({ title: "تم ربط الرابط", description: "بث يوتيوب تمت إضافته لعقدتك." });
      setIsModalOpen(false);
    } else {
      if (!uploadData.file) return;
      
      addTask(uploadData.file, 'video', {
        title: uploadData.title,
        author: user.name,
        authorId: user.id,
        time: "Neural Clip",
        status: user.role === 'admin' ? 'published' : 'pending_review',
        visibility: uploadData.visibility,
        allowedUserIds: [],
        uploaderRole: user.role,
      });

      toast({ 
        title: "بدأ الإرسال العصبي", 
        description: "الفيديو يرفع في الخلفية الآن. يمكنك التنقل بحرية." 
      });
      setIsModalOpen(false);
    }

    setUploadData({ title: "", visibility: "public", allowedUsers: "", externalUrl: "", file: null });
  };

  const safeVideos = Array.isArray(videos) ? videos : [];
  const publicVideos = safeVideos.filter(v => {
    if (v.status !== 'published') return false;
    if (v.visibility === 'public') return true;
    return v.authorId === user?.id;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse">
        <div className="text-right">
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            StreamHub
            <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary uppercase tracking-widest">Neural v4.2</Badge>
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">بث لامركزي: ارفع فيديوهاتك أو اربط روابط يوتيوب لمساحة غير محدودة.</p>
        </div>

        <div className="flex items-center gap-4 flex-row-reverse">
          <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="bg-white/5 border border-white/10 rounded-2xl p-1 flex-row-reverse">
            <TabsList className="bg-transparent h-11 flex-row-reverse">
              <TabsTrigger value="explore" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">اكتشاف</TabsTrigger>
              <TabsTrigger value="studio" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">استوديو العقدة</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10">
                  <Settings2 className="size-6 text-indigo-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-slate-900 border-white/10 p-4 rounded-2xl">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-white text-right">إعدادات البث العصبي</h4>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block text-right">جودة الفيديو الافتراضية</Label>
                    <Select value={videoQuality} onValueChange={handleQualityUpdate}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="240">240p (الأقل استهلاكاً)</SelectItem>
                        <SelectItem value="360">360p (متوازن)</SelectItem>
                        <SelectItem value="480">480p (جودة جيدة)</SelectItem>
                        <SelectItem value="720">720p (عالية HD)</SelectItem>
                        <SelectItem value="1080">1080p (فائقة FHD)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[9px] text-muted-foreground text-right italic leading-relaxed mt-2">
                      * ملاحظة: يتم حفظ هذا التفضيل في العقدة المحلية وسيتم تطبيقه على كافة الفيديوهات تلقائياً.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90 rounded-2xl px-8 h-14 shadow-xl shadow-primary/20 font-bold text-base">
                  <Plus className="mr-2 size-6" />
                  بث جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] bg-slate-950 border-white/10 rounded-[2.5rem] p-8">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-headline font-bold text-white text-right">إرسال عصبي جديد</DialogTitle>
                  <DialogDescription className="text-muted-foreground text-sm text-right">
                    اختر "رابط يوتيوب" لتجاوز قيود المساحة، أو "ملف محلي" للمقاطع الحصرية.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-6">
                  <Tabs value={uploadSource} onValueChange={(v: any) => setUploadSource(v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-xl flex-row-reverse">
                      <TabsTrigger value="youtube" className="rounded-lg gap-2"><Youtube className="size-4" /> رابط يوتيوب (غير محدود)</TabsTrigger>
                      <TabsTrigger value="local" className="rounded-lg gap-2"><FileVideo className="size-4" /> ملف محلي</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="grid gap-2">
                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1 text-right">عنوان البث</Label>
                    <Input 
                      dir="auto"
                      placeholder="صف موضوع البث..." 
                      className="bg-white/5 border-white/10 rounded-xl h-12 focus-visible:ring-primary text-right"
                      value={uploadData.title}
                      onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    />
                  </div>

                  {uploadSource === 'youtube' ? (
                    <div className="grid gap-2">
                      <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1 text-right">رابط يوتيوب</Label>
                      <Input 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        className="bg-white/5 border-white/10 rounded-xl h-12 text-right"
                        value={uploadData.externalUrl}
                        onChange={(e) => setUploadData({ ...uploadData, externalUrl: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1 text-right">اختر الوسائط (1GB Limit)</Label>
                      <div className="relative h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})} accept="video/*" />
                        {uploadData.file ? (
                          <div className="text-center">
                            <CheckCircle2 className="size-8 text-green-400 mx-auto mb-2" />
                            <p className="text-xs text-white font-bold truncate max-w-[250px]">{uploadData.file.name}</p>
                            <p className="text-[10px] text-muted-foreground">{(uploadData.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="size-8 text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground font-bold">اضغط لمزامنة ملف محلي</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button 
                    onClick={handleFinalizeUpload} 
                    className="w-full bg-primary text-white hover:bg-primary/90 h-14 rounded-2xl font-bold text-lg" 
                    disabled={!uploadData.title || (uploadSource === 'local' && !uploadData.file) || (uploadSource === 'youtube' && !uploadData.externalUrl)}
                  >
                    <Zap className="mr-2 size-5" />
                    بدء المزامنة العصبية
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {(activeView === 'explore' ? publicVideos : safeVideos.filter(v => v.authorId === user?.id)).map((video) => {
          const ytId = video.source === 'youtube' ? getYoutubeId(video.externalUrl) : null;
          const thumbSrc = video.source === 'youtube' && ytId 
            ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` 
            : (video.thumbnail && !video.thumbnail.endsWith('.mp4') ? video.thumbnail : "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1074&auto=format&fit=crop");

          return (
            <div 
              key={video.id} 
              className="group flex flex-col glass border-white/5 hover:border-primary/40 rounded-[2.5rem] overflow-hidden transition-all duration-500 cursor-pointer shadow-2xl relative"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="relative aspect-video overflow-hidden bg-slate-900">
                <Image 
                  src={thumbSrc} 
                  alt={video.title} 
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40">
                  <div className="size-16 bg-primary/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                    <Play className="text-white size-8 fill-white ml-1" />
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <div className="flex gap-2">
                    <Badge className="bg-black/60 backdrop-blur-md border-white/10 gap-1.5">
                      {video.source === 'youtube' ? <Youtube className="size-3 text-red-500" /> : <Radio className="size-3 text-indigo-400" />}
                      <span className="text-[9px] uppercase font-bold">{video.source === 'youtube' ? 'YouTube' : 'Nexus Clip'}</span>
                    </Badge>
                    <Badge variant="outline" className="bg-black/40 border-white/5 text-[8px] h-5">{videoQuality}p</Badge>
                  </div>
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="text-[8px] h-4 border-white/10 opacity-50 uppercase">{video.time}</Badge>
                  {video.status === 'pending_review' && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[8px]">قيد المراجعة</Badge>}
                </div>
                <h3 dir="auto" className="font-bold text-xl text-white group-hover:text-primary transition-colors line-clamp-2 text-right mb-6">{video.title}</h3>
                
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5 flex-row-reverse">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div className="size-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                      <img src={`https://picsum.photos/seed/${video.author}/40/40`} className="size-full object-cover" alt={video.author} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">@{video.author}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{video.views} مشاهدة</p>
                    </div>
                  </div>
                  {video.authorId === user?.id && (
                    <Button variant="ghost" size="icon" className="text-red-400/50 hover:text-red-400" onClick={(e) => { e.stopPropagation(); deleteVideo(video.id); }}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-5xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem]">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedVideo?.title || "مشغل الفيديو"}</DialogTitle>
            <DialogDescription>
              مشاهدة البث العصبي: {selectedVideo?.title} بواسطة {selectedVideo?.author} بجودة {videoQuality}p
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-slate-900 relative">
            <Button onClick={() => setSelectedVideo(null)} variant="ghost" size="icon" className="absolute top-4 right-4 z-50 text-white hover:bg-white/10 rounded-full">
              <X className="size-6" />
            </Button>
            {selectedVideo && (
              <ReactPlayer 
                url={selectedVideo.source === 'youtube' ? selectedVideo.externalUrl : selectedVideo.thumbnail} 
                width="100%" 
                height="100%" 
                playing 
                controls 
                config={{
                  youtube: {
                    playerVars: { 
                      vq: videoQuality === "1080" ? "hd1080" : videoQuality === "720" ? "hd720" : videoQuality === "480" ? "large" : "small"
                    }
                  }
                }}
              />
            )}
          </div>
          <div className="p-8 bg-slate-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-row-reverse">
            <div className="flex-1 text-right">
              <h2 dir="auto" className="text-3xl font-headline font-bold text-white mb-2">{selectedVideo?.title}</h2>
              <div className="flex items-center gap-2 justify-end text-muted-foreground text-sm">
                <span>بث عبر عقدة Nexus بجودة {videoQuality}p</span>
                <Sparkles className="size-3 text-indigo-400" />
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 flex-row-reverse">
              <div className="text-right">
                <p className="text-sm font-bold text-white">@{selectedVideo?.author}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{selectedVideo?.source === 'youtube' ? 'YouTube Network' : 'Neural Node'}</p>
              </div>
              <img src={`https://picsum.photos/seed/${selectedVideo?.author}/40/40`} className="size-12 rounded-xl" alt={selectedVideo?.author || 'Author'} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
