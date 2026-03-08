"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { MoreVertical, CheckCircle2, Volume2, Gamepad2, Play, Video as VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const getYoutubeId = (url?: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getRelativeTime = (dateStr?: string, fallback?: string) => {
  if (!dateStr || dateStr === "حديثاً" || dateStr === "اليوم") return dateStr || fallback;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr || fallback;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "منذ لحظات";
  if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
  if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
  if (diffInSeconds < 2592000) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
  if (diffInSeconds < 31536000) return `منذ ${Math.floor(diffInSeconds / 2592000)} شهر`;
  return `منذ ${Math.floor(diffInSeconds / 31536000)} سنة`;
};

/**
 * [STABILITY_ANCHOR: YOUTUBE_VIDEO_CARD_V1.1]
 * تصنيف واقعي لبيانات الفيديو، إزالة مدة 10:24 الوهمية، وتجميل حالة الفيديوهات بدون صورة مصغرة.
 */
export function VideoCard({ video, isActive, isCached, currentUser, onClick, onSync, onDelete }: any) {
  const ytId = video.source === 'youtube' ? getYoutubeId(video.externalUrl) : null;

  // Clean off the fake data fallback (netflix/picsum) that used to be here
  const isFakeThumb = (url?: string) => !url || url.includes('photo-1611162617474-5b21e879e113') || url.includes('picsum.photos');
  const validThumb = video.thumbnail && !isFakeThumb(video.thumbnail) ? video.thumbnail : null;

  const thumbSrc = video.source === 'youtube' && ytId
    ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    : validThumb;

  const duration = video.duration; // Real duration only. If null, we don't show the badge.

  // For views, if it's not a number, leave it alone. Otherwise format it.
  const views = typeof video.views === 'number' ? (video.views > 1000 ? `${(video.views / 1000).toFixed(1)} ألف` : video.views) : video.views || "0";

  const displayTime = getRelativeTime(video.createdAt || video.time, video.time || "منذ يومين");

  // Shorts layout
  if (video.isShorts || video.type === 'short') {
    return (
      <div
        className="group flex flex-col gap-2 cursor-pointer w-full max-w-[220px]"
        onClick={onClick}
      >
        <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-[#272727] flex items-center justify-center">
          {thumbSrc ? (
            <img src={thumbSrc} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <VideoIcon className="size-10 text-white/20" />
          )}
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
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#272727] flex items-center justify-center border border-white/5">
        {thumbSrc ? (
          <img src={thumbSrc} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <VideoIcon className="size-12 text-white/20" />
        )}

        {/* Video Duration Badge */}
        {duration && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[12px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm">
            {duration}
          </div>
        )}

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
          <div className="size-9 rounded-full bg-[#272727] overflow-hidden flex items-center justify-center text-white/50 text-[10px]">
            {video.channelAvatar ? (
              <img src={video.channelAvatar} className="size-full object-cover" alt={video.author} />
            ) : (
              video.author?.charAt(0) || "?"
            )}
          </div>
        </div>

        {/* Text Info */}
        <div className="flex flex-col flex-1 min-w-0 text-right">
          <h3 dir="auto" className="font-medium text-foreground text-[16px] leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors mb-1 pr-6 relative">
            {video.title}
          </h3>
          <div className="text-[14px] text-muted-foreground flex flex-col">
            <span className="truncate hover:text-foreground transition-colors">{video.author || "مستخدم مخفي"}</span>
            <div className="flex items-center justify-end gap-1 flex-row-reverse truncate">
              <span>{views} مشاهدة</span>
              <span className="text-[10px] mx-0.5">•</span>
              <span>{displayTime}</span>
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
