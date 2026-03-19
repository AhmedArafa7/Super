"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
    MoreHorizontal, ListEnd, Clock, ListPlus, Download, Share2, Ban, UserX, Flag 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStreamStore } from "@/lib/stream-store";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { YoutubeThumbnail } from "./YoutubeThumbnail";
import { getRelativeTime } from "@/lib/date-utils";
import { useWatch } from "./watch-context";

interface WatchSidebarProps {
    relatedVideos: any[];
    onChannelClick?: (id: string, name: string, avatar?: string) => void;
}

const CATEGORIES = ["الكل", "من نفس القناة", "ذات صلة", "حديثاً"];

export function WatchSidebar({ relatedVideos, onChannelClick }: WatchSidebarProps) {
    const { setActiveVideo } = useStreamStore();
    const { video: currentVideo } = useWatch();
    
    const [selectedCategory, setSelectedCategory] = useState("الكل");
    const [visibleCount, setVisibleCount] = useState(10);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Filtering Logic
    const filteredVideos = useMemo(() => {
        let list = [...relatedVideos];

        if (selectedCategory === "من نفس القناة") {
            // Filter by current video author/channel
            const author = currentVideo?.author;
            if (author) {
                list = list.filter(v => v.author === author);
            }
        } else if (selectedCategory === "حديثاً") {
            // Sort by published date if available
            list = list.sort((a, b) => {
                const dateA = new Date(a.published || a.time || 0).getTime();
                const dateB = new Date(b.published || b.time || 0).getTime();
                return dateB - dateA; // Newest first
            });
        }
        // "الكل" and "ذات صلة" show the default list for now

        return list;
    }, [relatedVideos, selectedCategory, currentVideo?.author]);

    // Reset visibility when category changes
    useEffect(() => {
        setVisibleCount(10);
    }, [selectedCategory]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleCount < filteredVideos.length) {
                    setVisibleCount((prev) => prev + 10);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [visibleCount, filteredVideos.length]);

    const displayedVideos = filteredVideos.slice(0, visibleCount);

    return (
        <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-3">
            {/* Category Filter for Related Videos */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
                            cat === selectedCategory 
                                ? "bg-white text-black shadow-lg scale-105" 
                                : "bg-[#272727] text-white hover:bg-[#3f3f3f] active:scale-95"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Vertical List of Related Videos */}
            <div className="flex flex-col gap-3 min-h-[500px]">
                {displayedVideos.length > 0 ? (
                    displayedVideos.map((rv: any, idx: number) => (
                        <div key={`${rv.id}-${idx}`} className="flex gap-2 hover:bg-[#3f3f3f]/50 p-1 rounded-xl transition-colors cursor-pointer group animate-in fade-in slide-in-from-bottom-2 duration-300" onClick={() => setActiveVideo(rv)}>
                            <div className="w-[168px] shrink-0 relative rounded-xl overflow-hidden aspect-video bg-[#272727] flex items-center justify-center">
                                {rv.source === 'youtube' ? (
                                    <YoutubeThumbnail 
                                        videoId={rv.id} 
                                        alt={rv.title} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : rv.thumbnail ? (
                                    <img src={rv.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                                ) : (
                                    <span className="text-white/10 text-xs text-center px-2">لا توجد صورة</span>
                                )}
                                {rv.duration && (
                                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[12px] font-medium px-1 rounded">
                                        {rv.duration}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col flex-1 py-0.5 relative pr-1 overflow-hidden">
                                <h4 dir="auto" className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">{rv.title}</h4>
                                <p 
                                    className="text-xs text-muted-foreground mt-1 hover:text-foreground transition-colors truncate cursor-pointer w-fit"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (rv.authorId) onChannelClick?.(rv.authorId, rv.author, rv.channelAvatar);
                                    }}
                                >
                                    {rv.author}
                                </p>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    {rv.views !== undefined && (
                                        <>
                                            <span>{(typeof rv.views === 'number' ? rv.views.toLocaleString() : rv.views)} مشاهدة</span>
                                            <span>•</span>
                                        </>
                                    )}
                                    <span>{getRelativeTime(rv.published || rv.time)}</span>
                                </div>
                                <div onClick={(e) => e.stopPropagation()} className="absolute top-0 left-0">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full outline-none transition-opacity">
                                                <MoreHorizontal className="size-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64 bg-[#282828] border-white/10 text-white rounded-xl shadow-2xl p-1.5">
                                            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                                                <ListEnd className="size-4" />
                                                <span className="text-sm">الإضافة إلى قائمة المحتوى التالي</span>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                                                <Clock className="size-4" />
                                                <span className="text-sm">حفظ في قائمة "مشاهدة لاحقاً"</span>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors mb-1">
                                                <ListPlus className="size-4" />
                                                <span className="text-sm">حفظ في قائمة تشغيل</span>
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator className="bg-white/5 mx-1 my-1" />

                                            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                                                <Download className="size-4" />
                                                <span className="text-sm">تنزيل</span>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                                                <Share2 className="size-4" />
                                                <span className="text-sm">مشاركة</span>
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator className="bg-white/5 mx-1 my-1" />

                                            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                                                <Ban className="size-4" />
                                                <span className="text-sm">لا يهمني</span>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                                                <UserX className="size-4" />
                                                <span className="text-sm">عدم اقتراح القناة</span>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                                                <Flag className="size-4" />
                                                <span className="text-sm">إبلاغ</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 animate-in fade-in duration-500">
                        <ListEnd className="size-10 opacity-20" />
                        <p className="text-sm">لا توجد فيديوهات في هذا القسم حالياً</p>
                    </div>
                )}
            </div>

            {/* Intersection Observer Target */}
            {visibleCount < filteredVideos.length && (
                <div ref={observerTarget} className="h-20 flex items-center justify-center">
                    <div className="size-6 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
