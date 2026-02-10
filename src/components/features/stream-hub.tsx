"use client";

import React, { useState, useEffect } from "react";
import { Play, Plus, Upload, MoreVertical, Clock, Eye, Trash2, ShieldCheck, Lock, EyeOff, CheckCircle2, AlertCircle, LayoutDashboard, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { getStoredVideos, addVideo, deleteVideo, Video, Visibility } from "@/lib/video-store";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 1.5 * 1024 * 1024;

export function StreamHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'explore' | 'studio'>('explore');
  
  // Upload State
  const [uploadData, setUploadData] = useState({
    title: "",
    visibility: "public" as Visibility,
    allowedUsers: "",
    thumbnail: ""
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const load = () => setVideos(getStoredVideos());
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
      setUploadData(prev => ({ ...prev, thumbnail: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleFinalizeUpload = () => {
    if (!uploadData.title || !user) return;

    const isAdmin = user.role === 'admin';
    const allowedUserList = uploadData.allowedUsers.split(',').map(u => u.trim()).filter(u => u !== "");

    addVideo({
      title: uploadData.title,
      author: user.name,
      authorId: user.id,
      thumbnail: uploadData.thumbnail || "https://picsum.photos/seed/nexus/600/400",
      time: "0:00",
      status: isAdmin ? 'published' : 'pending_review',
      visibility: uploadData.visibility,
      allowedUserIds: allowedUserList,
      uploaderRole: user.role
    });

    toast({
      title: isAdmin ? "Broadcast Live" : "Submission Logged",
      description: isAdmin ? "Video published to the public feed." : "Pending review from the Nexus Command.",
    });

    setIsModalOpen(false);
    setUploadData({ title: "", visibility: "public", allowedUsers: "", thumbnail: "" });
  };

  const publicVideos = videos.filter(v => {
    if (v.status !== 'published') return false;
    if (v.visibility === 'public') return true;
    if (v.visibility === 'private' && v.allowedUserIds.includes(user?.username || "")) return true;
    if (v.authorId === user?.id) return true;
    return false;
  });

  const mySubmissions = videos.filter(v => v.authorId === user?.id);

  const StatusBadge = ({ status }: { status: Video['status'] }) => {
    switch (status) {
      case 'published': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">PUBLISHED</Badge>;
      case 'pending_review': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">PENDING REVIEW</Badge>;
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight">StreamHub</h2>
          <p className="text-muted-foreground mt-1 text-lg">Decentralized neural content synchronization.</p>
        </div>

        <div className="flex items-center gap-4">
          <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="bg-white/5 border border-white/10 rounded-xl p-1">
            <TabsList className="bg-transparent h-10">
              <TabsTrigger value="explore" className="rounded-lg px-4 data-[state=active]:bg-primary">Explore</TabsTrigger>
              <TabsTrigger value="studio" className="rounded-lg px-4 data-[state=active]:bg-primary">My Studio</TabsTrigger>
            </TabsList>
          </Tabs>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-xl px-6 h-12 shadow-lg shadow-primary/20">
                <Plus className="mr-2 size-5" />
                Upload Neural Clip
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold">Initiate Broadcast</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Payloads are scanned for compliance before synchronization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label>Transmission Title</Label>
                  <Input 
                    placeholder="Enter title..." 
                    className="bg-white/5 border-white/10 rounded-xl h-11"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Visibility Level</Label>
                    <Select value={uploadData.visibility} onValueChange={(v: any) => setUploadData({...uploadData, visibility: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        <SelectItem value="public">Global (Public)</SelectItem>
                        <SelectItem value="unlisted">Neural Key (Unlisted)</SelectItem>
                        <SelectItem value="private">Restricted (Private)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {uploadData.visibility === 'private' && (
                    <div className="grid gap-2">
                      <Label>Target Nodes</Label>
                      <Input 
                        placeholder="user1, user2" 
                        className="bg-white/5 border-white/10 rounded-xl h-11"
                        value={uploadData.allowedUsers}
                        onChange={(e) => setUploadData({ ...uploadData, allowedUsers: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="relative border-2 border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} accept="image/*" />
                  {uploadData.thumbnail ? (
                    <div className="size-full flex flex-col items-center">
                      <img src={uploadData.thumbnail} className="h-32 rounded-xl mb-4 object-cover" />
                      <p className="text-xs text-indigo-400 font-bold">Thumbnail Processed</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-10 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                      <p className="text-sm font-medium text-white/70 text-center">Drag thumbnail payload or click to scan</p>
                      <p className="text-[10px] text-muted-foreground mt-1">MAX SIZE: 1.5MB</p>
                    </>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleFinalizeUpload} className="w-full bg-primary text-white hover:bg-primary/90 h-12 rounded-xl font-bold" disabled={!uploadData.title}>
                  Authorize Transmission
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {(activeView === 'explore' ? publicVideos : mySubmissions).map((video) => (
          <div key={video.id} className="group flex flex-col glass border-white/5 hover:border-indigo-500/30 rounded-[2.5rem] overflow-hidden transition-all duration-500 transform hover:-translate-y-1 shadow-2xl relative">
            <div className="relative aspect-video overflow-hidden">
              <Image 
                src={video.thumbnail} 
                alt={video.title} 
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="size-14 bg-primary rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                  <Play className="text-white size-6 fill-white ml-1" />
                </div>
              </div>
              <div className="absolute top-4 left-4 flex gap-2">
                 <Badge className="bg-black/60 backdrop-blur-md border-white/10 flex items-center gap-1.5 py-1 px-2.5">
                    <VisibilityIcon visibility={video.visibility} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{video.visibility}</span>
                 </Badge>
                 {activeView === 'studio' && <StatusBadge status={video.status} />}
              </div>
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
                <Clock className="size-3" />
                {video.time}
              </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h3 className="font-bold text-xl leading-tight text-white/90 group-hover:text-white transition-colors line-clamp-2">{video.title}</h3>
                {(user?.role === 'admin' || video.authorId === user?.id) && (
                  <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground hover:text-red-400" onClick={() => deleteVideo(video.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>

              {activeView === 'studio' && video.status === 'needs_action' && video.adminFeedback && (
                <div className="mb-6 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="size-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-100/70 italic">"{video.adminFeedback}"</p>
                </div>
              )}
              
              <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-white/10 overflow-hidden shadow-lg">
                    <img src={`https://picsum.photos/seed/${video.author}/40/40`} alt={video.author} className="size-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/80">{video.author}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Eye className="size-3" />
                        {video.views} views
                      </p>
                      <span className="size-1 bg-white/10 rounded-full" />
                      <p className="text-[10px] text-muted-foreground">Neural Sync • Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
