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

    return (
        <div className="w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl relative group mb-6 border border-white/5 ring-1 ring-white/10">
            {source === 'youtube' && !isPlayingLocally ? (
                <div className="relative w-full h-full">
                    {/* Neural Shield: Hides YouTube distracting elements like title and share during inactive states */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-2 bg-black z-10 pointer-events-none" />
                    
                    {/* Pro Badge if applicable */}
                    {isPro && (
                        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-indigo-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-500/30">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Neural Link Active</span>
                            <div className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        </div>
                    ) || (
                        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 opacity-60">
                            <span className="text-[10px] font-bold text-white/40 italic">WeTube Stream</span>
                        </div>
                    )}

                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(video.externalUrl || video.url) || video.id}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&vq=hd${selectedQuality}`}
                        className="w-full h-full scale-[1.01]" // Subtle scale to hide edge artifacts
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            ) : (
                <NexusVideoPlayer
                    src={video.externalUrl || video.url}
                    videoId={video.id}
                    poster={video.thumbnail}
                    autoPlay
                    sourceType={isPlayingLocally ? "local" : "telegram"}
                    proSettings={isPro ? proSettings : undefined}
                    neuralMetadata={neuralMetadata || undefined}
                />
            )}
        </div>
    );
}
