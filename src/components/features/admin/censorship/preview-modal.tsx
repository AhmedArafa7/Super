"use client";

import React from "react";
import dynamic from "next/dynamic";
import { X, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateVideoStatus, Video } from "@/lib/video-store";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

interface PreviewModalProps {
  video: Video | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function PreviewModal({ video, onClose, onRefresh }: PreviewModalProps) {
  if (!video) return null;

  const formatDriveUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes('drive.google.com')) {
      return url.replace('/view', '/preview').replace('/edit', '/preview');
    }
    return url;
  };

  const handleStatusChange = async (status: any) => {
    await updateVideoStatus(video.id, status);
    onRefresh();
    onClose();
  };

  return (
    <Dialog open={!!video} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-slate-950 border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <DialogHeader className="p-6 border-b border-white/5 bg-slate-900/50">
          <DialogTitle className="text-right text-white font-bold truncate pr-8">{video.title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video bg-black relative">
          <ReactPlayer
            url={video.source === 'youtube' ? video.externalUrl : (video.source === 'drive' ? formatDriveUrl(video.externalUrl) : video.thumbnail)}
            width="100%"
            height="100%"
            controls
            playing
          />
        </div>
        <div className="p-6 bg-slate-900/80 border-t border-white/5 flex gap-4 flex-row-reverse">
           {video.status !== 'published' ? (
             <Button 
               className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-8 h-12 font-bold shadow-lg shadow-emerald-600/20"
               onClick={() => handleStatusChange('published')}
             >
               اعتماد ونشر فوراً
             </Button>
           ) : (
             <Button 
               className="bg-amber-600 hover:bg-amber-500 rounded-xl px-8 h-12 font-bold shadow-lg shadow-amber-600/20"
               onClick={() => handleStatusChange('pending_review')}
             >
               سحب الاعتماد الآن
             </Button>
           )}
           <Button 
             variant="outline" 
             className="border-white/10 rounded-xl px-8 h-12 text-white hover:bg-white/5"
             onClick={onClose}
           >
             إغلاق المعاينة
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
