"use client";

import React from "react";
import dynamic from "next/dynamic";
import { X, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateVideoStatus, Video } from "@/lib/video-store";
import { Badge } from "@/components/ui/badge";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

interface PreviewModalProps {
  video: Video | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function PreviewModal({ video, onClose, onRefresh }: PreviewModalProps) {
  const [hasWatchedFull, setHasWatchedFull] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [played, setPlayed] = React.useState(0);

  React.useEffect(() => {
    if (video) {
       setHasWatchedFull(false);
       setDuration(0);
       setPlayed(0);
       // If the video is already published, we don't need to force watching
       if (video.status === 'published') {
         setHasWatchedFull(true);
       }
    }
  }, [video]);

  if (!video) return null;

  const formatDriveUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes('drive.google.com')) {
      return url.replace('/view', '/preview').replace('/edit', '/preview');
    }
    return url;
  };

  const handleStatusChange = async (status: any, hasMusic?: boolean) => {
    await updateVideoStatus(video.id, status, undefined, hasMusic);
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
            onDuration={(d) => setDuration(d)}
            onProgress={(state) => {
               setPlayed(state.playedSeconds);
               if (duration > 0 && state.playedSeconds >= duration - 2) {
                 setHasWatchedFull(true);
               }
            }}
            onEnded={() => setHasWatchedFull(true)}
            config={{
               youtube: {
                  playerVars: { disablekb: 1 } // Prevent seeking via keyboard to enforce watching
               }
            }}
          />
        </div>
        <div className="p-6 bg-slate-900/80 border-t border-white/5 flex gap-4 flex-row-reverse">
           {video.status !== 'published' ? (
             <div className="flex gap-2 items-center flex-row-reverse w-full">
               <Button 
                 disabled={!hasWatchedFull}
                 className="flex-1 bg-emerald-600 hover:bg-emerald-500 rounded-[0.5rem] px-4 h-12 font-bold shadow-lg shadow-emerald-600/20 text-xs disabled:opacity-50"
                 onClick={() => handleStatusChange('published', false)}
               >
                 بدون معازف
               </Button>
               <Button 
                 disabled={!hasWatchedFull}
                 className="flex-1 bg-amber-600 hover:bg-amber-500 rounded-[0.5rem] px-4 h-12 font-bold shadow-lg shadow-amber-600/20 text-xs disabled:opacity-50"
                 onClick={() => handleStatusChange('published', true)}
               >
                 يحتوي بمعازف
               </Button>
               {!hasWatchedFull && (
                 <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap ml-4">
                    يجب مشاهدة الفيديو بالكامل ({Math.floor(played)}s / {Math.floor(duration)}s)
                 </Badge>
               )}
               <Button 
                 variant="destructive"
                 className="bg-red-600 hover:bg-red-500 rounded-[0.5rem] px-4 h-12 font-bold shadow-lg shadow-red-600/20 text-xs max-w-fit flex-shrink-0"
                 onClick={() => handleStatusChange('rejected')}
               >
                 رفض فوراً
               </Button>
             </div>
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
             className="border-white/10 rounded-xl px-8 h-12 text-white hover:bg-white/5 flex-shrink-0"
             onClick={onClose}
           >
             إغلاق المعاينة
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
