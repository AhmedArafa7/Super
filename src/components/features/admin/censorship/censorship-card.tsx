"use client";

import React from "react";
import { Play, Trash2, CheckCircle2, Youtube, HardDrive, Radio, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateVideoStatus, deleteVideo, Video } from "@/lib/video-store";
import { cn } from "@/lib/utils";

interface CensorshipCardProps {
  video: Video;
  onPreview: (video: Video) => void;
  onRefresh: () => void;
}

export function CensorshipCard({ video, onPreview, onRefresh }: CensorshipCardProps) {
  const getYoutubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const ytId = video.source === 'youtube' ? getYoutubeId(video.externalUrl) : null;
  const thumbSrc = video.source === 'youtube' && ytId 
    ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` 
    : video.thumbnail;

  const handleStatusChange = async (status: any, hasMusic?: boolean) => {
    await updateVideoStatus(video.id, status, undefined, hasMusic);
    onRefresh();
  };

  const handleDelete = async () => {
    if (confirm("هل أنت متأكد من مسح هذه العقدة البصرية نهائياً؟")) {
      await deleteVideo(video.id);
      onRefresh();
    }
  };

  return (
    <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xl flex flex-col">
      <div 
        className="aspect-video relative bg-slate-900 cursor-pointer overflow-hidden"
        onClick={() => onPreview(video)}
      >
        <img 
          src={thumbSrc} 
          className="size-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
          alt={video.title}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="size-14 rounded-full bg-primary/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
            <Play className="text-white size-6 fill-white ml-1" />
          </div>
        </div>
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className={cn(
            "uppercase text-[8px] font-black tracking-widest px-3 py-1",
            video.status === 'published' ? "bg-green-500/80" : "bg-amber-500/80"
          )}>{video.status}</Badge>
          <Badge className="bg-black/60 backdrop-blur-md border-white/10 p-1">
            {video.source === 'youtube' ? <Youtube className="size-3 text-red-500" /> : video.source === 'drive' ? <HardDrive className="size-3 text-emerald-400" /> : <Radio className="size-3 text-indigo-400" />}
          </Badge>
          {video.relatedSurah && (
            <Badge className="bg-emerald-500/80 text-[8px] font-black uppercase tracking-widest px-3 py-1 ml-2">
              سورة {video.relatedSurah}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="p-8 text-right space-y-5 flex-1 flex flex-col">
        <h4 dir="auto" className="font-bold text-white line-clamp-2 text-lg leading-tight h-14">{video.title}</h4>
        
        <div className="flex items-center justify-between flex-row-reverse border-t border-white/5 pt-4 mt-auto">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">بواسطة: @{video.author}</p>
            <p className="text-[10px] text-indigo-400 font-mono mt-0.5">{video.views} views</p>
          </div>
          <div className="size-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <img src={`https://picsum.photos/seed/${video.authorId}/40/40`} className="size-full object-cover" />
          </div>
        </div>

        <div className="flex gap-3 flex-row-reverse">
          {video.status !== 'published' ? (
            <>
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-11 rounded-[0.5rem] px-1 text-[10px] font-bold shadow-lg shadow-emerald-600/20" 
                onClick={() => handleStatusChange('published', false)}
              >
                اعتماد
              </Button>
              <Button 
                className="flex-1 bg-amber-600 hover:bg-amber-500 h-11 rounded-[0.5rem] px-1 text-[10px] font-bold shadow-lg shadow-amber-600/20" 
                onClick={() => handleStatusChange('published', true)}
              >
                اعتماد لكن (به معازف)
              </Button>
            </>
          ) : (
            <Button 
              className="flex-1 bg-amber-600 hover:bg-amber-500 h-11 rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20" 
              onClick={() => handleStatusChange('pending_review')}
            >
              <RotateCcw className="mr-2 size-4" /> سحب الاعتماد
            </Button>
          )}
          <Button 
            variant="ghost" 
            className="text-red-400 hover:bg-red-500/10 h-11 rounded-xl group/del px-4" 
            onClick={handleDelete}
          >
            <Trash2 className="size-4 group-hover/del:scale-110 transition-transform" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
