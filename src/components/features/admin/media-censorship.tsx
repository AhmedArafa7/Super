
"use client";

import React from "react";
import { Video as VideoIcon, Play, Trash2, CheckCircle2, Youtube, HardDrive, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateVideoStatus, deleteVideo } from "@/lib/video-store";
import { useStreamStore } from "@/lib/stream-store";
import { cn } from "@/lib/utils";

interface MediaCensorshipProps {
  videos: any[];
  onRefresh: () => void;
}

/**
 * [STABILITY_ANCHOR: MEDIA_CENSORSHIP_V2.0]
 * لوحة الرقابة الإعلامية المحدثة - تدعم المعاينة الحية والصور المصغرة الذكية ليوتيوب.
 */
export function MediaCensorship({ videos, onRefresh }: MediaCensorshipProps) {
  const { setActiveVideo } = useStreamStore();

  const getYoutubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40 border-2 border-dashed border-white/5 rounded-[2rem] text-center w-full">
        <VideoIcon className="size-12 mb-4" />
        <p className="text-lg font-bold">لا يوجد محتوى بصري بانتظار المراجعة</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {videos.map(v => {
        const ytId = v.source === 'youtube' ? getYoutubeId(v.externalUrl) : null;
        const thumbSrc = v.source === 'youtube' && ytId 
          ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` 
          : v.thumbnail;

        return (
          <Card key={v.id} className="glass border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xl flex flex-col">
            <div 
              className="aspect-video relative bg-slate-900 cursor-pointer overflow-hidden"
              onClick={() => setActiveVideo(v)}
            >
              <img 
                src={thumbSrc} 
                className="size-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                alt={v.title}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="size-14 rounded-full bg-primary/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                  <Play className="text-white size-6 fill-white ml-1" />
                </div>
              </div>
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className={cn(
                  "uppercase text-[8px] font-black tracking-widest px-3 py-1",
                  v.status === 'published' ? "bg-green-500/80" : "bg-amber-500/80"
                )}>{v.status}</Badge>
                <Badge className="bg-black/60 backdrop-blur-md border-white/10 p-1">
                  {v.source === 'youtube' ? <Youtube className="size-3 text-red-500" /> : v.source === 'drive' ? <HardDrive className="size-3 text-emerald-400" /> : <Radio className="size-3 text-indigo-400" />}
                </Badge>
              </div>
            </div>
            
            <div className="p-8 text-right space-y-5 flex-1 flex flex-col">
              <h4 dir="auto" className="font-bold text-white line-clamp-2 text-lg leading-tight h-14">{v.title}</h4>
              
              <div className="flex items-center justify-between flex-row-reverse border-t border-white/5 pt-4 mt-auto">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">بواسطة: @{v.author}</p>
                  <p className="text-[10px] text-indigo-400 font-mono mt-0.5">{v.views} views</p>
                </div>
                <div className="size-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${v.authorId}/40/40`} className="size-full object-cover" />
                </div>
              </div>

              <div className="flex gap-3 flex-row-reverse">
                {v.status !== 'published' && (
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-11 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20" 
                    onClick={async (e) => { e.stopPropagation(); await updateVideoStatus(v.id, 'published'); onRefresh(); }}
                  >
                    <CheckCircle2 className="mr-2 size-4" /> اعتماد النشر
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  className="text-red-400 hover:bg-red-500/10 h-11 rounded-xl group/del px-4" 
                  onClick={async (e) => { e.stopPropagation(); if(confirm("حذف نهائي؟")) { await deleteVideo(v.id); onRefresh(); } }}
                >
                  <Trash2 className="size-4 group-hover/del:scale-110 transition-transform" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
