"use client";

import React from "react";
import { NexusVideoPlayer } from "@/components/features/stream/nexus-video-player";
import { detectVideoSource } from "./video-source-detector";
import { useWatch } from "./watch-context";

interface WatchPlayerProps {
    isCached: boolean;
    downloadedQuality?: string;
    handleQualityChange: (q: string) => void;
}

export function WatchPlayer({ isCached, downloadedQuality, handleQualityChange }: WatchPlayerProps) {
    const { video, selectedQuality } = useWatch();
    
    // Detect source
    const source = detectVideoSource(video.externalUrl || video.url, video.source);
    const isPlayingLocally = isCached && selectedQuality === downloadedQuality;

    return (
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl relative group mb-4">
            {source === 'youtube' && !isPlayingLocally ? (
                <iframe
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&vq=hd${selectedQuality}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            ) : (
                <NexusVideoPlayer
                    src={video.externalUrl || video.url}
                    poster={video.thumbnail}
                    autoPlay
                />
            )}
        </div>
    );
}
