
"use client";

import React, { useState, useEffect } from "react";
import { Play, Plus, Upload, MoreVertical, Clock, Eye, Trash2, ShieldCheck, Lock, EyeOff, CheckCircle2, AlertCircle, LayoutDashboard, Globe, Loader2, X, Zap, Share2, MessageSquare, Youtube, ExternalLink, FileVideo, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, addVideo, deleteVideo, Video, Visibility, VideoSource } from "@/lib/video-store";
import { useUploadStore } from "@/lib/upload-store";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

export function StreamHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const addTask = useUploadStore(state => state.addTask);
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'explore' | 'studio'>('explore');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
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
      toast({ title: "Link Synchronized", description: "YouTube broadcast added to your node." });
      setIsModalOpen(false);
    } else {
      if (!uploadData.file) return;
      
      // استخدام نظام الرفع في الخلفية
      addTask(uploadData.file, 'video', {
        title: uploadData.title,
        author: user.name,
        authorId: user.id,
        time: "0:00",
        status: user.role === 'admin' ? 'published' : 'pending_review',
        visibility: uploadData.visibility,
        allowedUserIds: [],
        uploaderRole: user.role,
      });

      toast({ 
        title: "Neural Transmission Started", 
        description: "Your video is uploading in the background. You can browse freely." 
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4">
            StreamHub
            <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary uppercase tracking-widest">Neural v4.2</Badge>
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">Unlimited background uploads and decentralized streaming.</p>
        </div>

        <div className="flex items-center gap-4">
          <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="bg-white/5 border border-white/10 rounded-2xl p-1">
            <TabsList className="bg-transparent h-11">
              <TabsTrigger value="explore" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">Explore Hub</TabsTrigger>
              <TabsTrigger value="studio" className="rounded-xl px-6 data-[state=active]:bg-primary font-bold">My Studio</TabsTrigger>
            </TabsList>
          </Tabs>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-2xl px-8 h-14 shadow-xl shadow-primary/20 font-bold text-base">
                <Plus className="mr-2 size-6" />
                New Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-slate-950 border-white/10 rounded-[2.5rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-3xl font-headline font-bold text-white">Neural Transmission</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  Upload files of any size. We handle the sync in the background so you don't have to wait.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-6">
                <Tabs value={uploadSource} onValueChange={(v: any) => setUploadSource(v)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-xl">
                    <TabsTrigger value="local" className="rounded-lg gap-2"><FileVideo className="size-4" /> Local Video</TabsTrigger>
                    <TabsTrigger value="youtube" className="rounded-lg gap-2"><Youtube className="size-4" /> YouTube Link</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="grid gap-2">
                  <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1">Broadcast Title</Label>
                  <Input 
                    dir="auto"
                    placeholder="Describe your transmission..." 
                    className="bg-white/5 border-white/10 rounded-xl h-12 focus-visible:ring-primary text-right"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  />
                </div>

                {uploadSource === 'youtube' ? (
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1">YouTube URL</Label>
                    <Input 
                      placeholder="https://www.youtube.com/watch?v=..." 
                      className="bg-white/5 border-white/10 rounded-xl h-12"
                      value={uploadData.externalUrl}
                      onChange={(e) => setUploadData({ ...uploadData, externalUrl: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1">Select Media Node</Label>
                    <div className="relative h-24 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})} accept="video/*" />
                      {uploadData.file ? (
                        <div className="text-center">
                          <CheckCircle2 className="size-6 text-green-400 mx-auto mb-1" />
                          <p className="text-[10px] text-white font-bold truncate max-w-[200px]">{uploadData.file.name}</p>
                          <p className="text-[8px] text-muted-foreground">{(uploadData.file.size / 1024 / 1024).toFixed(2)} MB Detected</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="size-6 text-muted-foreground mb-2" />
                          <p className="text-[10px] text-muted-foreground font-bold">Tap to sync local file</p>
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
                  Initiate Background Sync
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {(activeView === 'explore' ? publicVideos : safeVideos.filter(v => v.authorId === user?.id)).map((video) => (
          <div 
            key={video.id} 
            className="group flex flex-col glass border-white/5 hover:border-primary/40 rounded-[2.5rem] overflow-hidden transition-all duration-500 cursor-pointer shadow-2xl relative"
            onClick={() => video.source === 'youtube' ? window.open(video.externalUrl, '_blank') : setSelectedVideo(video)}
          >
            <div className="relative aspect-video overflow-hidden bg-slate-900">
              <Image 
                src={video.thumbnail} 
                alt={video.title} 
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <div className="size-16 bg-primary/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                  {video.source === 'youtube' ? <ExternalLink className="text-white size-8" /> : <Play className="text-white size-8 fill-white ml-1" />}
                </div>
              </div>
              <div className="absolute top-4 left-4">
                <Badge className="bg-black/60 backdrop-blur-md border-white/10 gap-1.5">
                  {video.source === 'youtube' ? <Youtube className="size-3 text-red-500" /> : <Radio className="size-3 text-indigo-400" />}
                  <span className="text-[9px] uppercase font-bold">{video.source === 'youtube' ? 'YouTube' : 'Nexus Clip'}</span>
                </Badge>
              </div>
            </div>
            
            <div className="p-8 flex flex-col flex-1">
              <h3 dir="auto" className="font-bold text-xl text-white group-hover:text-primary transition-colors line-clamp-2 text-right mb-6">{video.title}</h3>
              <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                    <img src={`https://picsum.photos/seed/${video.author}/40/40`} className="size-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">@{video.author}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{video.views} Links</p>
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
        ))}
      </div>

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-5xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem]">
          <div className="aspect-video bg-slate-900 relative">
            {selectedVideo && (
              <ReactPlayer url={selectedVideo.thumbnail} width="100%" height="100%" playing controls />
            )}
          </div>
          <div className="p-8 bg-slate-950">
            <h2 dir="auto" className="text-3xl font-headline font-bold text-white text-right mb-4">{selectedVideo?.title}</h2>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 w-fit ml-auto">
              <p className="text-sm font-bold text-white">@{selectedVideo?.author}</p>
              <img src={`https://picsum.photos/seed/${selectedVideo?.author}/40/40`} className="size-10 rounded-xl" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
