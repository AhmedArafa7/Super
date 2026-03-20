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
