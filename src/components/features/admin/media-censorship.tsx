
"use client";

import React from "react";
import { Video, Play, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateVideoStatus, deleteVideo } from "@/lib/video-store";
import { cn } from "@/lib/utils";

interface MediaCensorshipProps {
  videos: any[];
  onRefresh: () => void;
}

export function MediaCensorship({ videos, onRefresh }: MediaCensorshipProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40 border-2 border-dashed border-white/5 rounded-[2rem] text-center w-full">
        <Video className="size-12 mb-4" />
        <p className="text-lg font-bold">لا يوجد محتوى بصري حالياً</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {videos.map(v => (
        <Card key={v.id} className="glass border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xl">
          <div className="aspect-video relative bg-slate-900">
            <img src={v.thumbnail} className="size-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="size-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Play className="text-white size-6" />
              </div>
            </div>
            <div className="absolute top-4 left-4">
              <Badge className={cn(
                "uppercase text-[8px] font-black tracking-widest px-3 py-1",
                v.status === 'published' ? "bg-green-500/80" : "bg-amber-500/80"
              )}>{v.status}</Badge>
            </div>
          </div>
          <div className="p-8 text-right space-y-5">
            <h4 className="font-bold text-white line-clamp-1 text-lg">{v.title}</h4>
            <div className="flex items-center justify-between flex-row-reverse border-t border-white/5 pt-4">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">بواسطة: @{v.author}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{v.views} views</p>
            </div>
            <div className="flex gap-3 flex-row-reverse">
              {v.status !== 'published' && (
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-11 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20" onClick={async () => { await updateVideoStatus(v.id, 'published'); onRefresh(); }}>
                  <CheckCircle2 className="mr-2 size-4" /> نشر
                </Button>
              )}
              <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 h-11 rounded-xl group/del" onClick={async () => { await deleteVideo(v.id); onRefresh(); }}>
                <Trash2 className="size-4 group-hover/del:scale-110 transition-transform" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
