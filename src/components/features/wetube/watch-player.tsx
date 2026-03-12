"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { NexusVideoPlayer } from "../stream/nexus-video-player";

interface WatchPlayerProps {
    video: any;
    isPlayingLocally: boolean;
    selectedQuality: string;
    downloadedQuality?: string;
    handleQualityChange: (quality: string) => void;
}

const getYoutubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export function WatchPlayer({ 
    video, 
    isPlayingLocally, 
    selectedQuality, 
    downloadedQuality, 
    handleQualityChange 
}: WatchPlayerProps) {
    return (
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative group">
            {isPlayingLocally ? (
                <NexusVideoPlayer
                    src="/offline-placeholder.mp4"
                    poster={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
                    autoPlay={true}
                    sourceType="local"
                    defaultQuality={selectedQuality}
                    onQualityChange={handleQualityChange}
                    qualityOptions={[]}
                />
            ) : (
                video.source === 'youtube' && video.externalUrl ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeId(video.externalUrl)}?autoplay=1&rel=0&vq=${selectedQuality === "1080" ? "hd1080" : selectedQuality === "720" ? "hd720" : selectedQuality === "480" ? "large" : "medium"}`}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                    />
                ) : (video.source === 'telegram' || video.source === 'local' || video.source === 'tiktok' || !video.source) && video.externalUrl ? (
                    <NexusVideoPlayer
                        src={`/api/stream/telegram?fileId=${video.externalUrl}`}
                        poster={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
                        autoPlay={true}
                        sourceType={video.source === 'local' ? 'local' : video.source === 'telegram' ? 'telegram' : 'tiktok'}
                        defaultQuality={selectedQuality}
                        onQualityChange={handleQualityChange}
                        qualityOptions={[]}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f0f0f]">
                        <p className="text-[#aaaaaa] mb-2 font-mono">Loading MP4 Source...</p>
                        <div className="size-10 border-4 border-t-blue-500 border-white/10 rounded-full animate-spin"></div>
                    </div>
                )
            )}

            {isPlayingLocally && (
                <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-indigo-500/80 hover:bg-indigo-500 font-bold border-none text-white shadow-md">
                        وضع عدم الاتصال (Offline)
                    </Badge>
                </div>
            )}
        </div>
    );
}
