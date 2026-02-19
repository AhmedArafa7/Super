
"use client";

import React from "react";
import Image from "next/image";
import { Play, Trash2, Youtube, HardDrive, Radio, Volume2, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const getYoutubeId = (url?: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export function VideoCard({ video, isActive, isCached, currentUser, onClick, onSync, onDelete }: any) {
  const ytId = video.source === 'youtube' ? getYoutubeId(video.externalUrl) : null;
  const thumbSrc = video.source === 'youtube' && ytId 
    ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` 
    : video.thumbnail;

  return (
    <div 
      className={cn(
        "group flex flex-col glass border-white/5 hover:border-primary/40 rounded-[2.5rem] overflow-hidden transition-all duration-500 cursor-pointer shadow-2xl relative",
        isActive && "ring-2 ring-primary border-primary/50"
      )}
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        <Image src={thumbSrc} alt={video.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40">
          <div className="size-16 bg-primary/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
            {isActive ? <Volume2 className="text-white size-8 animate-pulse" /> : <Play className="text-white size-8 fill-white ml-1" />}
          </div>
        </div>
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className="bg-black/60 backdrop-blur-md border-white/10 gap-1.5">
            {video.source === 'youtube' ? <Youtube className="size-3 text-red-500" /> : video.source === 'drive' ? <HardDrive className="size-3 text-emerald-400" /> : <Radio className="size-3 text-indigo-400" />}
            <span className="text-[9px] uppercase font-bold">{video.source.toUpperCase()}</span>
          </Badge>
          {isCached && <Badge className="bg-indigo-500/80 text-white text-[8px] uppercase">Cached</Badge>}
        </div>
      </div>
      
      <div className="p-8 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <Badge variant="outline" className="text-[8px] h-4 border-white/10 opacity-50 uppercase">{video.time}</Badge>
          {isActive && <Badge className="bg-primary text-white text-[8px] animate-pulse">جاري العرض</Badge>}
        </div>
        <h3 dir="auto" className="font-bold text-xl text-white group-hover:text-primary transition-colors line-clamp-2 text-right mb-6">{video.title}</h3>
        
        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center justify-between pt-6 border-t border-white/5 flex-row-reverse">
            <div className="flex items-center gap-3 flex-row-reverse text-right">
              <div className="size-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <img src={`https://picsum.photos/seed/${video.author}/40/40`} className="size-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">@{video.author}</p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">{video.views} مشاهدة</p>
              </div>
            </div>
            {video.authorId === currentUser?.id && (
              <Button variant="ghost" size="icon" className="text-red-400/50 hover:text-red-400" onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}>
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
          
          <Button 
            variant="outline" size="sm" 
            className={cn("w-full rounded-xl gap-2 font-bold h-10 border-white/5", isCached ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-white/5 text-muted-foreground")}
            onClick={(e) => { e.stopPropagation(); onSync(video); }}
          >
            {isCached ? <CheckCircle2 className="size-4" /> : <Download className="size-4" />}
            {isCached ? "إزالة من العقدة" : "مزامنة للعقدة"}
          </Button>
        </div>
      </div>
    </div>
  );
}
