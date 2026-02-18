
"use client";

import React, { useState, useEffect } from "react";
import { Play, Plus, Upload, Trash2, Youtube, FileVideo, Radio, Settings2, Zap, CheckCircle2, Loader2, HardDrive, Volume2, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, addVideo, deleteVideo, Video, Visibility, VideoSource } from "@/lib/video-store";
import { useUploadStore } from "@/lib/upload-store";
import { useStreamStore } from "@/lib/stream-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";

const VAULT_FOLDER_URL = "https://drive.google.com/drive/folders/16JnrGafk5X3lwbrrrspXE0P8d-DeJi0g?usp=sharing";

/**
 * دالة مساعدة لاستخراج ID الفيديو من روابط يوتيوب.
 */
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
  const { 
    activeVideo, setActiveVideo, quality, setQuality, 
    backgroundPlayback, setBackgroundPlayback, autoFloat, setAutoFloat 
  } = useStreamStore();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'explore' | 'studio'>('explore');
  
  const [uploadSource, setUploadSource] = useState<VideoSource>('drive');
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
    
    if (uploadSource === 'youtube' || uploadSource === 'drive') {
      if (!uploadData.externalUrl) return;
      await addVideo({
        title: uploadData.title,
        author: user.name,
        authorId: user.id,
        thumbnail: uploadSource === 'youtube' ? "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1074&auto=format&fit=crop" : "https://images.unsplash.com/photo-1544391496-1ca7c974b711?q=80&w=1170&auto=format&fit=crop",
        time: uploadSource === 'youtube' ? "YouTube Broadcast" : "Nexus Vault Sync",
        status: user.role === 'admin' ? 'published' : 'pending_review',
        visibility: uploadData.visibility,
        allowedUserIds: [],
        uploaderRole: user.role as any,
        source: uploadSource,
        externalUrl: uploadData.externalUrl
      });
      toast({ title: "تم ربط العقدة", description: `تمت إضافة فيديو من ${uploadSource} بنجاح.` });
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
        description: "الفيديو يرفع في الخلفية الآن لتوفير الوقت." 
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
    <div className={cn("p-8 max-w-7xl mx-auto min-h-screen transition-all duration-500", activeVideo && "pt-[45vh] md:pt-[55vh]")}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 flex-row-reverse">
        <div className="text-right">
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            StreamHub
            <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary uppercase tracking-widest">Vault Integration v5.5</Badge>
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">بث مخصص يدعم Nexus Vault لتوفير مساحات تخزين ضخمة.</p>
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
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 relative">
                  <Settings2 className="size-6 text-indigo-400" />
                  <Badge className="absolute -top-2 -right-2 bg-primary text-[8px] h-4 px-1">{quality}p</Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-slate-900 border-white/10 p-6 rounded-[2rem] shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <h4 className="font-bold text-sm text-white">تخصيص تجربة البث</h4>
                    <Settings2 className="size-4 text-indigo-400" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block text-right">جودة الفيديو الافتراضية</Label>
                      <Select value={quality} onValueChange={setQuality}>
                        <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                          <SelectItem value="240">240p (حفظ البيانات)</SelectItem>
                          <SelectItem value="360">360p (متوازن)</SelectItem>
                          <SelectItem value="480">480p (جودة متوسطة)</SelectItem>
                          <SelectItem value="720">720p (عالية HD)</SelectItem>
                          <SelectItem value="1080">1080p (فائقة FHD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <div className="flex items-center justify-between flex-row-reverse">
                        <div className="text-right">
                          <p className="text-xs font-bold text-white">التشغيل في الخلفية</p>
                          <p className="text-[9px] text-muted-foreground">استمرار الصوت عند مغادرة الصفحة</p>
                        </div>
                        <Switch checked={backgroundPlayback} onCheckedChange={setBackgroundPlayback} />
                      </div>

                      <div className="flex items-center justify-between flex-row-reverse">
                        <div className="text-right">
                          <p className="text-xs font-bold text-white">العقدة العائمة (PIP)</p>
                          <p className="text-[9px] text-muted-foreground">عرض الفيديو فوق الصفحات الأخرى</p>
                        </div>
                        <Switch checked={autoFloat} onCheckedChange={setAutoFloat} />
                      </div>
                    </div>
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
                    استخدم Nexus Vault للمساحات الكبيرة، أو يوتيوب للبث العام.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-6">
                  {uploadSource === 'drive' && (
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between flex-row-reverse animate-in fade-in duration-500">
                      <div className="text-right">
                        <p className="text-xs font-bold text-indigo-300">خزنة نكسوس المركزية</p>
                        <p className="text-[10px] text-muted-foreground">ارفع ملفك هنا أولاً ثم انسخ الرابط</p>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-2 text-indigo-400 font-bold" onClick={() => window.open(VAULT_FOLDER_URL, '_blank')}>
                        <ExternalLink className="size-3" /> فتح الخزنة
                      </Button>
                    </div>
                  )}

                  <Tabs value={uploadSource} onValueChange={(v: any) => setUploadSource(v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-white/5 p-1 rounded-xl flex-row-reverse">
                      <TabsTrigger value="drive" className="rounded-lg gap-2 text-[10px] sm:text-sm"><HardDrive className="size-3" /> Drive/Vault</TabsTrigger>
                      <TabsTrigger value="youtube" className="rounded-lg gap-2 text-[10px] sm:text-sm"><Youtube className="size-3" /> YouTube</TabsTrigger>
                      <TabsTrigger value="local" className="rounded-lg gap-2 text-[10px] sm:text-sm"><FileVideo className="size-3" /> محلي</TabsTrigger>
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

                  {uploadSource !== 'local' ? (
                    <div className="grid gap-2">
                      <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1 text-right">رابط المصدر ({uploadSource})</Label>
                      <Input 
                        placeholder={uploadSource === 'youtube' ? "https://www.youtube.com/watch?v=..." : "رابط فيديو من الخزنة أو الدرايف..."} 
                        className="bg-white/5 border-white/10 rounded-xl h-12 text-right"
                        value={uploadData.externalUrl}
                        onChange={(e) => setUploadData({ ...uploadData, externalUrl: e.target.value })}
                      />
                      <p className="text-[9px] text-indigo-400 text-right italic">تأكد أن الرابط متاح للعرض العام (Anyone with the link).</p>
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
                    disabled={!uploadData.title || (uploadSource === 'local' && !uploadData.file) || (uploadSource !== 'local' && !uploadData.externalUrl)}
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
            : video.thumbnail;

          const isActive = activeVideo?.id === video.id;

          return (
            <div 
              key={video.id} 
              className={cn(
                "group flex flex-col glass border-white/5 hover:border-primary/40 rounded-[2.5rem] overflow-hidden transition-all duration-500 cursor-pointer shadow-2xl relative",
                isActive && "ring-2 ring-primary border-primary/50"
              )}
              onClick={() => setActiveVideo(video)}
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
                    {isActive ? <Volume2 className="text-white size-8 animate-pulse" /> : <Play className="text-white size-8 fill-white ml-1" />}
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <div className="flex gap-2">
                    <Badge className="bg-black/60 backdrop-blur-md border-white/10 gap-1.5">
                      {video.source === 'youtube' ? <Youtube className="size-3 text-red-500" /> : video.source === 'drive' ? <HardDrive className="size-3 text-emerald-400" /> : <Radio className="size-3 text-indigo-400" />}
                      <span className="text-[9px] uppercase font-bold">{video.source === 'youtube' ? 'YouTube' : video.source === 'drive' ? 'Nexus Vault' : 'Nexus Clip'}</span>
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="text-[8px] h-4 border-white/10 opacity-50 uppercase">{video.time}</Badge>
                  {isActive && <Badge className="bg-primary text-white text-[8px] animate-pulse">جاري العرض الآن</Badge>}
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
    </div>
  );
}
