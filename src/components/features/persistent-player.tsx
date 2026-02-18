
"use client";

import React, { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { X, Maximize2, Minimize2, Play, Pause, Zap, Youtube, Radio, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStreamStore } from "@/lib/stream-store";
import { cn } from "@/lib/utils";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

const getYoutubeQualityAlias = (quality: string) => {
  switch (quality) {
    case "240": return "small";
    case "360": return "medium";
    case "480": return "large";
    case "720": return "hd720";
    case "1080": return "hd1080";
    default: return "small";
  }
};

const formatDriveUrl = (url?: string) => {
  if (!url) return "";
  if (url.includes('drive.google.com')) {
    // تحويل روابط العرض إلى روابط معاينة قابلة للتضمين
    return url.replace('/view', '/preview').replace('/edit', '/preview');
  }
  return url;
};

/**
 * @fileOverview المشغل العصبي المستمر v5.0 - يدعم YouTube, Google Drive, والملفات المحلية.
 */
export const PersistentPlayer = memo(() => {
  const { 
    activeVideo, isPlaying, isMinimized, quality, currentTab, autoFloat,
    setActiveVideo, setIsPlaying, setIsMinimized 
  } = useStreamStore();

  const isAtHome = currentTab === 'stream';
  
  const shouldShow = useMemo(() => {
    if (!activeVideo) return false;
    if (isAtHome) return true;
    return autoFloat;
  }, [activeVideo, isAtHome, autoFloat]);

  if (!activeVideo) return null;

  const videoUrl = activeVideo.source === 'youtube' 
    ? `${activeVideo.externalUrl}${activeVideo.externalUrl?.includes('?') ? '&' : '?'}vq=${getYoutubeQualityAlias(quality)}`
    : activeVideo.source === 'drive'
    ? formatDriveUrl(activeVideo.externalUrl)
    : activeVideo.thumbnail;

  return (
    <div 
      className={cn(
        "fixed z-[100] transition-all duration-500 ease-in-out shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 bg-black overflow-hidden",
        !shouldShow ? "pointer-events-none opacity-0 translate-y-10 scale-95" : "opacity-100 translate-y-0 scale-100",
        isAtHome && !isMinimized
          ? "top-[4rem] right-0 left-0 md:left-[16rem] h-[40vh] md:h-[50vh] border-x-0 border-t-0 rounded-none shadow-none"
          : "bottom-6 left-6 w-80 aspect-video rounded-2xl group/mini"
      )}
    >
      <div className={cn(
        "absolute top-0 inset-x-0 p-4 z-20 flex items-center justify-between transition-opacity duration-300",
        (isMinimized || !isAtHome) ? "opacity-0 group-hover/mini:opacity-100 bg-gradient-to-b from-black/80 to-transparent" : "bg-gradient-to-b from-black/60 to-transparent"
      )}>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase font-bold">
            {activeVideo.source.toUpperCase()} NODE
          </Badge>
          <span dir="auto" className="text-white text-xs font-bold truncate max-w-[150px]">
            {activeVideo.title}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {isAtHome && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-8 rounded-full bg-white/5 hover:bg-white/10 text-white"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="size-4" /> : <Minimize2 className="size-4" />}
            </Button>
          )}
          <Button 
            variant="destructive" 
            size="icon" 
            className="size-8 rounded-full shadow-lg"
            onClick={() => setActiveVideo(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="size-full">
        <ReactPlayer 
          key={`${activeVideo.id}-${quality}`}
          url={videoUrl}
          width="100%" 
          height="100%" 
          playing={isPlaying} 
          controls={isAtHome && !isMinimized}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          config={{
            youtube: {
              playerVars: { 
                vq: getYoutubeQualityAlias(quality),
                modestbranding: 1,
                rel: 0
              }
            }
          }}
        />
      </div>

      {(!isAtHome || isMinimized) && shouldShow && (
        <div 
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 group-hover/mini:opacity-100 transition-opacity cursor-pointer"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="text-white size-10 fill-white" /> : <Play className="text-white size-10 fill-white ml-1" />}
        </div>
      )}
    </div>
  );
});

PersistentPlayer.displayName = "PersistentPlayer";
