"use client";

import React from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStreamStore } from "@/lib/stream-store";

interface WatchSidebarProps {
    relatedVideos: any[];
}

export function WatchSidebar({ relatedVideos }: WatchSidebarProps) {
    const { setActiveVideo } = useStreamStore();

    return (
        <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-3">
            {/* Category Filter for Related Videos */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {["الكل", "من نفس القناة", "ذات صلة", "حديثاً"].map(cat => (
                    <button
                        key={cat}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                            cat === "الكل" ? "bg-white text-black" : "bg-[#272727] text-white hover:bg-[#3f3f3f]"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Vertical List of Related Videos */}
            {relatedVideos.map((rv: any, idx: number) => (
                <div key={idx} className="flex gap-2 hover:bg-[#3f3f3f]/50 p-1 rounded-xl transition-colors cursor-pointer group" onClick={() => setActiveVideo(rv)}>
                    <div className="w-[168px] shrink-0 relative rounded-xl overflow-hidden aspect-video bg-[#272727]">
                        <img src={rv.thumbnail || `https://picsum.photos/seed/${rv.id}/168/94`} className="w-full h-full object-cover" alt="" />
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[12px] font-medium px-1 rounded">12:34</div>
                    </div>
                    <div className="flex flex-col flex-1 py-0.5 relative pr-1">
                        <h4 dir="auto" className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-blue-400">{rv.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 hover:text-foreground">{rv.author}</p>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>{(typeof rv.views === 'number' ? rv.views : 5000).toLocaleString()} مشاهدة</span>
                            <span>•</span>
                            <span>منذ يوم</span>
                        </div>
                        <button className="absolute top-0 left-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full"><MoreHorizontal className="size-4" /></button>
                    </div>
                </div>
            ))}
        </div>
    );
}
