"use client";

import React from "react";
import Image from "next/image";
import { MoreVertical, CheckCircle2, Volume2, Gamepad2, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const getYoutubeId = (url?: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * [STABILITY_ANCHOR: YOUTUBE_VIDEO_CARD_V1.0]
 * تصميم مطابق لكارت فيديو يوتيوب: صورة مصغرة نظيفة، مدة الفيديو بالأسفل، تفاصيل العنوان بجوار صورة القناة.
 */
export function VideoCard({ video, isActive, isCached, currentUser, onClick, onSync, onDelete }: any) {
  const ytId = video.source === 'youtube' ? getYoutubeId(video.externalUrl) : null;
  const thumbSrc = video.source === 'youtube' && ytId
    ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    : video.thumbnail || `https://picsum.photos/seed/${video.id}/400/225`;

  // توليد مدة وهمية إذا لم تكن موجودة
  const duration = video.duration || "10:24";
  const views = typeof video.views === 'number' ? (video.views > 1000 ? `${(video.views / 1000).toFixed(1)} ألف` : video.views) : video.views || "12 ألف";

  // Shorts layout
  if (video.isShorts || video.type === 'short') {
    return (
      <div
        className="group flex flex-col gap-2 cursor-pointer w-full max-w-[220px]"
        onClick={onClick}
      >
        <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-[#272727]">
          <Image src={thumbSrc} alt={video.title} fill className="object-cover" />
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded flex items-center gap-1">
            <Play className="size-3 fill-white" />
            Shorts
          </div>
        </div>
        <div>
          <h3 dir="auto" className="font-medium text-foreground text-[15px] leading-tight line-clamp-2 text-right group-hover:text-blue-400 transition-colors">
            {video.title}
          </h3>
          <p className="text-sm text-muted-foreground text-right mt-1">{views} مشاهدة</p>
        </div>
      </div>
    );
  }

  // Standard Video Layout
  return (
    <div
      className={cn(
        "group flex flex-col gap-3 cursor-pointer w-full transition-all",
        isActive && "opacity-60 grayscale"
      )}
      onClick={onClick}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#272727]">
        <Image src={thumbSrc} alt={video.title} fill className="object-cover" />

        {/* Playback Overlay (Hover) */}
        {!isActive && (
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2 gap-1 flex-col">
          </div>
        )}

        {/* Video Duration Badge */}
        <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[12px] font-medium px-1.5 py-0.5 rounded">
          {duration}
        </div>

        {/* Cached Badge */}
        {isCached && (
          <div className="absolute top-1.5 left-1.5 bg-indigo-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="size-3" />
            مُنزّل
          </div>
        )}

        {/* Playing Indicator */}
        {isActive && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="flex gap-1 items-end h-4">
              <div className="w-1 bg-white h-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 bg-white h-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
              <div className="w-1 bg-white h-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Container */}
      <div className="flex gap-3 pr-2 flex-row-reverse">
        {/* Channel Avatar */}
        <div className="mt-1 shrink-0">
          <div className="size-9 rounded-full bg-[#272727] overflow-hidden">
            <img src={video.channelAvatar || `https://picsum.photos/seed/${video.author}/40/40`} className="size-full object-cover" alt={video.author} />
          </div>
        </div>

        {/* Text Info */}
        <div className="flex flex-col flex-1 min-w-0 text-right">
          <h3 dir="auto" className="font-medium text-foreground text-[16px] leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors mb-1 pr-6 relative">
            {video.title}
          </h3>
          <div className="text-[14px] text-muted-foreground flex flex-col">
            <span className="truncate hover:text-foreground transition-colors">{video.author}</span>
            <div className="flex items-center justify-end gap-1 flex-row-reverse truncate">
              <span>{views} مشاهدة</span>
              <span className="text-[10px] mx-0.5">•</span>
              <span>{video.time || "منذ يومين"}</span>
            </div>
          </div>
        </div>

        {/* Context Menu Icon (Hover only on Desktop) */}
        <button
          className="p-1.5 -mt-1 -mr-1 h-fit rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-white/10"
          onClick={(e) => { e.stopPropagation(); /* Options Menu */ }}
        >
          <MoreVertical className="size-5" />
        </button>
      </div>
    </div>
  );
}
