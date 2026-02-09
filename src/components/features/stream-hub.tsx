
"use client";

import React, { useState } from "react";
import { Play, Plus, Upload, MoreVertical, Clock, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  author: string;
  time: string;
}

const INITIAL_VIDEOS: Video[] = [
  { id: "1", title: "Concept Art: Cyberpunk City 2077", thumbnail: PlaceHolderImages[0].imageUrl, views: "1.2M", author: "DigitalDreams", time: "12:04" },
  { id: "2", title: "React Mastery: Build a Nexus UI", thumbnail: PlaceHolderImages[1].imageUrl, views: "850K", author: "CodeWithNexus", time: "45:12" },
  { id: "3", title: "Gaming Legend: Final Boss Fight", thumbnail: PlaceHolderImages[2].imageUrl, views: "2.4M", author: "GameMaster", time: "18:22" },
  { id: "4", title: "AI Revolution: The Future is Here", thumbnail: PlaceHolderImages[3].imageUrl, views: "92K", author: "TechInsights", time: "08:15" },
  { id: "5", title: "Exploring the Crab Nebula 4K", thumbnail: PlaceHolderImages[4].imageUrl, views: "5.1M", author: "NasaLabs", time: "22:00" },
  { id: "6", title: "Hardware Review: RTX 5090 Ti", thumbnail: PlaceHolderImages[5].imageUrl, views: "15M", author: "PCGamerPro", time: "14:55" },
];

export function StreamHub() {
  const [videos, setVideos] = useState<Video[]>(INITIAL_VIDEOS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVideo, setNewVideo] = useState({ title: "", author: "" });

  const handleUpload = () => {
    if (!newVideo.title || !newVideo.author) return;

    const uploaded: Video = {
      id: Date.now().toString(),
      title: newVideo.title,
      author: newVideo.author,
      thumbnail: `https://picsum.photos/seed/${Date.now()}/600/400`,
      views: "0",
      time: "0:00",
    };

    setVideos([uploaded, ...videos]);
    setNewVideo({ title: "", author: "" });
    setIsModalOpen(false);
  };

  const removeVideo = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight">StreamHub</h2>
          <p className="text-muted-foreground mt-1">Discover the next generation of creative content.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-primary/90 rounded-xl px-6 h-12 shadow-lg shadow-primary/20">
              <Plus className="mr-2 size-5" />
              Upload Video
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold">New Broadcast</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-sm font-medium">Video Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter a catchy title..." 
                  className="bg-white/5 border-white/10 rounded-xl"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="author" className="text-sm font-medium">Author Name</Label>
                <Input 
                  id="author" 
                  placeholder="Your channel name" 
                  className="bg-white/5 border-white/10 rounded-xl"
                  value={newVideo.author}
                  onChange={(e) => setNewVideo({ ...newVideo, author: e.target.value })}
                />
              </div>
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <Upload className="size-10 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">MP4, MKV or MOV (Max 500MB)</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpload} className="w-full bg-primary text-white hover:bg-primary/90 h-12 rounded-xl">Confirm Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video) => (
          <div key={video.id} className="group relative flex flex-col bg-slate-800/40 rounded-3xl overflow-hidden border border-white/5 hover:border-white/10 hover:bg-slate-800/60 transition-all duration-300 transform hover:-translate-y-1 shadow-xl">
            <div className="relative aspect-video overflow-hidden">
              <Image 
                src={video.thumbnail} 
                alt={video.title} 
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="size-14 bg-primary rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                  <Play className="text-white size-6 fill-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
                <Clock className="size-3" />
                {video.time}
              </div>
            </div>
            
            <div className="p-5 flex flex-col flex-1">
              <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="font-bold text-lg leading-snug line-clamp-2 text-white/90 group-hover:text-white transition-colors">{video.title}</h3>
                <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground hover:text-white" onClick={() => removeVideo(video.id)}>
                   <Trash2 className="size-4" />
                </Button>
              </div>
              
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-white/5 overflow-hidden">
                     <img src={`https://picsum.photos/seed/${video.author}/32/32`} alt={video.author} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/70">{video.author}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Eye className="size-3" />
                        {video.views} views
                      </p>
                      <span className="size-1 bg-white/10 rounded-full" />
                      <p className="text-[10px] text-muted-foreground">2 days ago</p>
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
