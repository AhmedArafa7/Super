"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useWatch } from "./watch-context";

interface WatchDescriptionProps {
    viewCount: string;
    dateStr: string;
}

export function WatchDescription({
    viewCount,
    dateStr
}: WatchDescriptionProps) {
    const { 
        video, 
        details, 
        isDescriptionExpanded, 
        setIsDescriptionExpanded 
    } = useWatch();

    return (
        <div
            className={cn(
                "bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl cursor-pointer text-sm mb-6 border border-white/5 shadow-sm",
                !isDescriptionExpanded && "hover:bg-white/10"
            )}
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
        >
            <div className="font-bold text-foreground flex items-center gap-2 mb-1">
                <span>{viewCount} مشاهدة</span>
                <span>{dateStr}</span>
                {video.category && <span className="text-muted-foreground font-medium ml-1">#{video.category}</span>}
            </div>
            <div className={cn("text-foreground whitespace-pre-wrap mt-2", !isDescriptionExpanded && "line-clamp-2")}>
                {details?.description || video.description || `جاري تحميل تفاصيل الفيديو...`}
            </div>
            <button className="mt-2 text-foreground font-bold">
                {isDescriptionExpanded ? "عرض أقل" : "عرض المزيد"}
            </button>
        </div>
    );
}
