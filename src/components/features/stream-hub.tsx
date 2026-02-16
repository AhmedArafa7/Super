
"use client";

import React, { useState, useEffect } from "react";
import { Play, Plus, Upload, MoreVertical, Clock, Eye, Trash2, ShieldCheck, Lock, EyeOff, CheckCircle2, AlertCircle, LayoutDashboard, Globe, Loader2, X, Zap, Share2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, addVideo, deleteVideo, Video, Visibility } from "@/lib/video-store";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// تحميل مشغل الفيديو بشكل ديناميكي لتجنب مشاكل الـ SSR
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

const MAX_FILE_SIZE = 1.5 * 1024 * 1024;

export function StreamHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'explore' | 'studio'>('explore');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  // Upload State
  const [uploadData, setUploadData] = useState({
    title: "",
    visibility: "public" as Visibility,
    allowedUsers: "",
    thumbnail: "",
    fileSize: 0
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getStoredVideos();
        setVideos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to sync neural stream:", err);
        setVideos([]);
      }
    };
    
    load();
    window.addEventListener('videos-update', load);
    return () => window.removeEventListener('videos-update', load);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "Payload Overload",
        description: "File exceeds 1.5MB Nexus limit.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadData(prev => ({ ...prev, thumbnail: reader.result as string, fileSize: file.size }));
    };
    reader.readAsDataURL(file);
  };

  const handleFinalizeUpload = () => {
    if (!uploadData.title || !user) return;

    setIsUploading(true);
    setUploadProgress(10);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 5;
      });
    }, 200);

    setTimeout(async () => {
      const isAdmin = user.role === 'admin';
      const allowedUserList = uploadData.allowedUsers.split(',').map(u => u.trim()).filter(u => u !== "");

      try {
        await addVideo({
          title: uploadData.title,
          author: user.name,
          authorId: user.id,
          thumbnail: uploadData.thumbnail || "https://picsum.photos/seed/nexus/600/400",
          time: "4:32",
          status: isAdmin ? 'published' : 'pending_review',
          visibility: uploadData.visibility,
          allowedUserIds: allowedUserList,
          uploaderRole: user.role
        });

        setUploadProgress(100);
        clearInterval(progressInterval);

        setTimeout(() => {
          toast({
            title: isAdmin ? "Broadcast Live" : "Submission Logged",
            description: isAdmin ? "Video published to the public feed." : "Pending review from the Nexus Command.",
          });

          setIsModalOpen(false);
          setUploadData({ title: "", visibility: "public", allowedUsers: "", thumbnail: "", fileSize: 0 });
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } catch (err) {
        clearInterval(progressInterval);
        setIsUploading(false);
        toast({ variant: "destructive", title: "Transmission Failed" });
      }
    }, 2000);
  };

  const safeVideos = Array.isArray(videos) ? videos : [];

  const publicVideos = safeVideos.filter(v => {
    if (v.status !== 'published') return false;
    if (v.visibility === 'public') return true;
    if (v.visibility === 'private' && v.allowedUserIds.includes(user?.username || "")) return true;
    if (v.authorId === user?.id) return true;
    return false;
  });

  const mySubmissions = safeVideos.filter(v => v.authorId === user?.id);

  const StatusBadge = ({ status }: { status: Video['status'] }) => {
    switch (status) {
      case 'published': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">PUBLISHED</Badge>;
      case 'pending_review': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold">PENDING REVIEW</Badge>;
      case 'rejected': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">REJECTED</Badge>;
      case 'needs_action': return <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">ACTION REQUIRED</Badge>;
      default: return null;
    }
  };

  const VisibilityIcon = ({ visibility }: { visibility: Visibility }) => {
    switch (visibility) {
      case 'public': return <Globe className="size-3" />;
      case 'private': return <Lock className="size-3" />;
      case 'unlisted': return <EyeOff className="size-3" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4">
            StreamHub
            <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary uppercase tracking-widest">Neural v4.2</Badge>
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">Decentralized neural content synchronization and streaming node.</p>
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
                Broadcast Clip
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-slate-950 border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
              <DialogHeader>
                <DialogTitle className="text-3xl font-headline font-bold text-white">Initiate Transmission</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  Neural payloads are scanned for protocol compliance before global synchronization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="grid gap-2">
                  <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1">Transmission Title</Label>
                  <Input 
                    dir="auto"
                    placeholder="e.g. Neural Logic explained..." 
                    disabled={isUploading}
                    className="bg-white/5 border-white/10 rounded-xl h-12 focus-visible:ring-primary text-right"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1">Visibility Level</Label>
                    <Select disabled={isUploading} value={uploadData.visibility} onValueChange={(v: any) => setUploadData({...uploadData, visibility: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="public">Global (Public)</SelectItem>
                        <SelectItem value="unlisted">Neural Key (Unlisted)</SelectItem>
                        <SelectItem value="private">Restricted (Private)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {uploadData.visibility === 'private' && (
                    <div className="grid gap-2">
                      <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1">Target Nodes</Label>
                      <Input 
                        disabled={isUploading}
                        placeholder="admin, nexus_user" 
                        className="bg-white/5 border-white/10 rounded-xl h-12"
                        value={uploadData.allowedUsers}
                        onChange={(e) => setUploadData({ ...uploadData, allowedUsers: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="relative border-2 border-dashed border-white/10 rounded-[2rem] p-10 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-all cursor-pointer group overflow-hidden min-h-[200px]">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} accept="image/*" disabled={isUploading} />
                  {uploadData.thumbnail ? (
                    <div className="absolute inset-0 size-full flex flex-col items-center justify-center bg-slate-950">
                      <img src={uploadData.thumbnail} className="size-full object-cover opacity-40" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <CheckCircle2 className="size-12 text-green-400 mb-2 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                        <p className="text-sm text-white font-bold uppercase tracking-widest">Payload Processed</p>
                        <p className="text-[10px] text-muted-foreground mt-1">DATA SIZE: {(uploadData.fileSize / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="size-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-4 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-500">
                        <Upload className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm font-bold text-white/70 text-center">Drag visual payload or click to scan</p>
                      <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-tighter">MAX SIZE: 1.5MB • JPEG/PNG ONLY</p>
                    </>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-3 animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                      <span className="flex items-center gap-2"><Loader2 className="size-3 animate-spin" /> Syncing Neural Clip</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5 bg-white/5 rounded-full" />
                    <p className="text-[10px] text-muted-foreground italic text-center leading-relaxed">Establishing secure broadcast stream through Nexus firewalls...</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleFinalizeUpload} 
                  className="w-full bg-primary text-white hover:bg-primary/90 h-14 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/20" 
                  disabled={!uploadData.title || !uploadData.thumbnail || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 size-5 animate-spin" />
                      Transmitting Payload...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 size-5" />
                      Authorize Broadcast
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {(activeView === 'explore' ? publicVideos : mySubmissions).map((video) => (
          <div 
            key={video.id} 
            className="group flex flex-col glass border-white/5 hover:border-primary/40 rounded-[2.5rem] overflow-hidden transition-all duration-500 transform hover:-translate-y-2 shadow-2xl relative cursor-pointer"
            onClick={() => setSelectedVideo(video)}
          >
            <div className="relative aspect-video overflow-hidden">
              <Image 
                src={video.thumbnail} 
                alt={video.title} 
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                <div className="size-20 bg-primary/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                  <Play className="text-white size-10 fill-white ml-1.5 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </div>
              </div>

              <div className="absolute top-5 left-5 flex gap-2">
                 <Badge className="bg-black/60 backdrop-blur-md border-white/10 flex items-center gap-1.5 py-1.5 px-3 rounded-xl">
                    <VisibilityIcon visibility={video.visibility} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{video.visibility}</span>
                 </Badge>
                 {activeView === 'studio' && <StatusBadge status={video.status} />}
              </div>
              <div className="absolute bottom-4 right-5 bg-primary/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black text-white flex items-center gap-1.5 border border-primary/30 shadow-lg">
                <Clock className="size-3.5" />
                {video.time}
              </div>
            </div>
            
            <div className="p-8 flex flex-col flex-1">
              <div className="flex justify-between items-start gap-4 mb-6">
                <h3 dir="auto" className="font-bold text-2xl leading-tight text-white/90 group-hover:text-primary transition-colors line-clamp-2 text-right w-full">{video.title}</h3>
              </div>

              {activeView === 'studio' && video.status === 'needs_action' && video.adminFeedback && (
                <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3 animate-pulse">
                  <AlertCircle className="size-5 text-indigo-400 shrink-0 mt-0.5" />
                  <p dir="auto" className="text-xs text-indigo-100/80 italic text-right">"ملاحظة الإدارة: {video.adminFeedback}"</p>
                </div>
              )}
              
              <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-white/10 overflow-hidden shadow-xl ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                    <img src={`https://picsum.photos/seed/${video.author}/48/48`} alt={video.author} className="size-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/90">@{video.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold">
                        <Eye className="size-3 text-primary" />
                        {video.views} views
                      </p>
                      <span className="size-1 bg-white/10 rounded-full" />
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Verified Node</p>
                    </div>
                  </div>
                </div>
                {(user?.role === 'admin' || video.authorId === user?.id) && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-10 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all" 
                    onClick={(e) => { e.stopPropagation(); deleteVideo(video.id); }}
                  >
                    <Trash2 className="size-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Neural Watch Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.3)]">
          <div className="relative aspect-video bg-slate-900 group">
            {selectedVideo && (
              <ReactPlayer
                url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" // تجريبي
                width="100%"
                height="100%"
                playing
                controls
                config={{ youtube: { playerVars: { showinfo: 0, rel: 0 } } }}
              />
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedVideo(null)} 
              className="absolute top-6 right-6 z-50 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-black/60"
            >
              <X className="size-6" />
            </Button>
          </div>
          <div className="p-10 bg-slate-950">
            <div className="flex flex-col lg:flex-row gap-8 justify-between items-start">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30">NEURAL BROADCAST</Badge>
                  <span className="text-xs text-muted-foreground font-mono">ID: {selectedVideo?.id.substring(0, 8)}</span>
                </div>
                <h2 dir="auto" className="text-4xl font-headline font-bold text-white text-right">{selectedVideo?.title}</h2>
                <div className="flex items-center gap-6 text-muted-foreground pt-2 justify-end">
                  <div className="flex items-center gap-2 font-bold"><Eye className="size-4 text-primary" /> {selectedVideo?.views} Neural Links</div>
                  <div className="flex items-center gap-2 font-bold"><Clock className="size-4 text-primary" /> Transmitted {selectedVideo && new Date(selectedVideo.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/10 w-full lg:w-auto">
                <div className="size-14 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl">
                  <img src={`https://picsum.photos/seed/${selectedVideo?.author}/64/64`} className="size-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-lg">@{selectedVideo?.author}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Authorized Node</p>
                </div>
                <Button className="rounded-xl bg-primary h-12 px-6">Follow Node</Button>
              </div>
            </div>
            
            <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
               <Button variant="outline" className="h-14 rounded-2xl border-white/10 hover:bg-white/5 font-bold"><Share2 className="mr-2 size-5" /> Copy Link</Button>
               <Button variant="outline" className="h-14 rounded-2xl border-white/10 hover:bg-white/5 font-bold"><MessageSquare className="mr-2 size-5" /> 12 Comments</Button>
               <Button className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold"><Zap className="mr-2 size-5" /> Neural Sync</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
