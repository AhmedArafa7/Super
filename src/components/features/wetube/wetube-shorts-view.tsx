"use client";

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreHorizontal, Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { syncLike, syncSubscription } from "@/lib/youtube-sync-service";
import { useToast } from "@/hooks/use-toast";

interface ShortItemProps {
    short: any;
    isActive: boolean;
    isMuted: boolean;
    setIsMuted: (v: boolean) => void;
}

function ShortItem({ short, isActive, isMuted, setIsMuted }: ShortItemProps) {
    const { youtubeToken } = useAuth();
    const { toast } = useToast();
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSyncingLike, setIsSyncingLike] = useState(false);
    const [isSyncingSub, setIsSyncingSub] = useState(false);

    const getYoutubeId = (url?: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const ytId = short.source === 'youtube' ? getYoutubeId(short.externalUrl) : null;

    const handleToggleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = !isLiked;
        setIsLiked(newStatus);
        setIsDisliked(false);

        if (youtubeToken && short.source === 'youtube') {
            setIsSyncingLike(true);
            try {
                await syncLike(short.id, newStatus ? 'like' : 'none', youtubeToken);
                toast({ title: "تمت المزامنة", description: newStatus ? "تم تسجيل الإعجاب على يوتيوب." : "تمت إزالة الإعجاب." });
            } catch (err) {
                console.error(err);
            } finally {
                setIsSyncingLike(false);
            }
        }
    };

    const handleToggleSub = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = !isSubscribed;
        setIsSubscribed(newStatus);

        if (youtubeToken && short.authorId && newStatus) {
            setIsSyncingSub(true);
            try {
                await syncSubscription(short.authorId, 'subscribe', youtubeToken);
                toast({ title: "تم الاشتراك", description: `أنت الآن مشترك في ${short.author} على يوتيوب.` });
            } catch (err) {
                console.error(err);
            } finally {
                setIsSyncingSub(false);
            }
        }
    };

    return (
        <div className="h-full snap-start w-full relative flex items-center justify-center p-4 py-6 rtl">
            <div
                className="relative w-full h-full bg-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl group flex flex-col justify-between"
                onClick={() => setIsPlaying(!isPlaying)}
            >
                {/* Video Area */}
                <div className="absolute inset-0 z-0">
                    {ytId && isActive ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${ytId}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&loop=1&playlist=${ytId}&rel=0`}
                            className="w-[300%] h-full -ml-[100%] pointer-events-none"
                            allow="autoplay; encrypted-media"
                        />
                    ) : (
                        <img src={short.thumbnail || `https://picsum.photos/seed/${short.id}/400/800`} className="w-full h-full object-cover opacity-60" alt="" />
                    )}
                </div>

                {/* Top Controls */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                        className="p-2 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-colors text-white"
                    >
                        {isPlaying ? <Pause className="size-5 fill-white" /> : <Play className="size-5 fill-white ml-0.5" />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                        className="p-2 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-colors text-white"
                    >
                        {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                    </button>
                </div>

                {/* Bottom Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-4 pt-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 text-[#f1f1f1] flex flex-col gap-3">
                    <div className="flex items-center gap-3 w-[85%] flex-row-reverse -mr-1">
                        <div className="size-9 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/20">
                            <img src={short.channelAvatar || `https://picsum.photos/seed/${short.author}/40/40`} className="size-full object-cover" />
                        </div>
                        <span className="font-bold text-[15px] truncate text-right">@{short.author}</span>
                        <button
                            onClick={handleToggleSub}
                            disabled={isSyncingSub}
                            className={cn(
                                "px-3 py-1 font-bold text-sm rounded-full transition-all flex items-center gap-2",
                                isSubscribed ? "bg-white/20 text-white" : "bg-white text-black",
                                isSyncingSub && "opacity-50"
                            )}
                        >
                            {isSyncingSub ? <Loader2 className="size-3 animate-spin" /> : isSubscribed ? "تمت المتابعة" : "متابعة"}
                        </button>
                    </div>
                    <p dir="auto" className="text-[15px] font-medium leading-snug w-[85%] text-right drop-shadow-md">
                        {short.title}
                    </p>
                    <div className="flex items-center gap-2 w-[85%] flex-row-reverse text-[#dddddd] text-sm animate-pulse-slow">
                        <svg height="14" viewBox="0 0 24 24" width="14" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"></path></svg>
                        <span className="truncate w-full text-right">Original Sound - @{short.author}</span>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-6 items-center">
                    <div className="flex flex-col items-center gap-1.5">
                        <button 
                            className={cn("p-3 rounded-full backdrop-blur-sm transition-colors text-white", isLiked ? "bg-white/20" : "bg-black/40 hover:bg-black/60")}
                            onClick={handleToggleLike}
                            disabled={isSyncingLike}
                        >
                            {isSyncingLike ? <Loader2 className="size-6 animate-spin" /> : <ThumbsUp className="size-6" fill={isLiked ? "currentColor" : "none"} />}
                        </button>
                        <span className="text-[13px] font-medium text-white shadow-black drop-shadow-md">
                            {short.likes || "1.2 مليون"}
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                        <button 
                            className={cn("p-3 rounded-full backdrop-blur-sm transition-colors text-white", isDisliked ? "bg-white/20" : "bg-black/40 hover:bg-black/60")}
                            onClick={(e) => { e.stopPropagation(); setIsDisliked(!isDisliked); setIsLiked(false); }}
                        >
                            <ThumbsDown className="size-6" fill={isDisliked ? "currentColor" : "none"} />
                        </button>
                        <span className="text-[13px] font-medium text-white shadow-black drop-shadow-md">عدم إعجاب</span>
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                        <button className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-colors text-white" onClick={(e) => e.stopPropagation()}>
                            <MessageSquare className="size-6" fill="currentColor" />
                        </button>
                        <span className="text-[13px] font-medium text-white shadow-black drop-shadow-md">{short.commentCount || "4,093"}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                        <button className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-colors text-white" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`https://youtube.com/shorts/${ytId}`); toast({ title: "تم نسخ الرابط" }); }}>
                            <Share2 className="size-6" />
                        </button>
                        <span className="text-[13px] font-medium text-white shadow-black drop-shadow-md">مشاركة</span>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 mt-2">
                        <button className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-colors text-white" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="size-6" />
                        </button>
                    </div>

                    <div className="size-10 rounded-sm bg-white/20 border-2 border-[#1a1a1a] overflow-hidden mt-4 animate-spin-slow" style={{ animationDuration: '4s' }}>
                        <img src={short.channelAvatar || `https://picsum.photos/seed/${short.author}/40/40`} className="size-full object-cover" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * [STABILITY_ANCHOR: WETUBE_SHORTS_VIEW_V2.0]
 * Refactored to support full interaction and syncing for each short.
 */
export function WeTubeShortsView({ shorts }: { shorts: any[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    if (shorts.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
                <p className="text-[#aaaaaa] text-xl font-bold">لا يوجد فيديوهات Shorts متاحة حالياً.</p>
            </div>
        );
    }

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollPosition = container.scrollTop;
        const itemHeight = container.clientHeight;
        const newIndex = Math.round(scrollPosition / itemHeight);
        if (newIndex !== activeIndex && newIndex < shorts.length) {
            setActiveIndex(newIndex);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto h-full snap-y snap-mandatory hide-scroll flex justify-center bg-transparent" onScroll={handleScroll}>
            <div className="flex flex-col w-full max-w-[480px]">
                {shorts.map((short, index) => (
                    <ShortItem 
                        key={short.id} 
                        short={short} 
                        isActive={index === activeIndex} 
                        isMuted={isMuted}
                        setIsMuted={setIsMuted}
                    />
                ))}
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
        </div>
    );
}
