"use client";

import React from "react";
import { NexusVideoPlayer } from "@/components/features/stream/nexus-video-player";
import { detectVideoSource } from "./video-source-detector";
import { useWatch } from "./watch-context";
import { extractYouTubeId } from "@/lib/youtube-utils";

interface WatchPlayerProps {
    isCached: boolean;
    downloadedQuality?: string;
    handleQualityChange: (q: string) => void;
}

export function WatchPlayer({ isCached, downloadedQuality, handleQualityChange }: WatchPlayerProps) {
    const { video, selectedQuality, proSettings, isPro, neuralMetadata } = useWatch();
    
    // Detect source
    const source = detectVideoSource(video.externalUrl || video.url, video.source);
    const isPlayingLocally = isCached && selectedQuality === downloadedQuality;

    const [isOptimizing, setIsOptimizing] = React.useState(isPro && !isCached);

    React.useEffect(() => {
        if (isOptimizing) {
            const timer = setTimeout(() => setIsOptimizing(false), 2500); // Simulate processing
            return () => clearTimeout(timer);
        }
    }, [isOptimizing]);

    if (isOptimizing) {
        return (
            <div className="w-full aspect-video rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center border border-primary/20 shadow-2xl relative mb-6">
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="relative">
                        <div className="size-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-black text-primary animate-pulse">PRO</span>
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-black text-white px-8">جاري التحميل والمعالجة المحلية للـ Pro...</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">Neural Engine: Optimizing Frame Ratio</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl relative group mb-6 border border-white/5 ring-1 ring-white/10">
            <NexusVideoPlayer
                src={video.externalUrl || video.url}
                videoId={source === 'youtube' ? extractYouTubeId(video.externalUrl || video.url) || video.id : video.id}
                poster={video.thumbnail}
                autoPlay
                sourceType={isPlayingLocally ? "local" : (source === 'youtube' ? "youtube" : "telegram")}
                proSettings={isPro ? proSettings : undefined}
                neuralMetadata={neuralMetadata || undefined}
            />
        </div>
    );
}
