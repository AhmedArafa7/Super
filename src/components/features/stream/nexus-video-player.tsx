"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface NexusVideoPlayerProps {
    src: string;
    poster?: string;
    autoPlay?: boolean;
    qualityOptions?: string[];
    defaultQuality?: string;
    onQualityChange?: (quality: string) => void;
    sourceType?: "local" | "telegram" | "tiktok";
    proSettings?: {
        autoTrimOutro: boolean;
        frameSkipRatio: string;
    };
}

export function NexusVideoPlayer({
    src,
    poster,
    autoPlay = false,
    qualityOptions = ["Auto (720p)"],
    defaultQuality = "Auto (720p)",
    onQualityChange,
    sourceType,
    proSettings
}: NexusVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState("0:00");
    const [duration, setDuration] = useState("0:00");
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [quality, setQuality] = useState(defaultQuality);

    let hideControlsTimeout: NodeJS.Timeout;

    useEffect(() => {
        if (autoPlay && videoRef.current) {
            videoRef.current.play().catch(console.error);
            setIsPlaying(true);
        }
    }, [autoPlay]);

    const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(hideControlsTimeout);
        if (isPlaying) {
            hideControlsTimeout = setTimeout(() => setShowControls(false), 3000);
        }
    };

    const handleMouseLeave = () => {
        if (isPlaying) {
            setShowControls(false);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const dur = videoRef.current.duration;
            
            // Pro Feature: Auto-Trim Outro (Skip last 5 seconds)
            if (proSettings?.autoTrimOutro && dur > 10 && (dur - current) < 5) {
                videoRef.current.currentTime = dur;
                return;
            }

            setProgress((current / dur) * 100);
            setCurrentTime(formatTime(current));
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(formatTime(videoRef.current.duration));
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = (time / 100) * videoRef.current.duration;
            setProgress(time);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullScreen = () => {
        if (containerRef.current) {
            if (!document.fullscreenElement) {
                containerRef.current.requestFullscreen().catch(err => {
                    console.error("Error attempting to enable full-screen mode:", err.message);
                });
            } else {
                document.exitFullscreen();
            }
        }
    };

    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds)) return "0:00";
        const result = new Date(timeInSeconds * 1000).toISOString().substring(11, 19);
        return result.startsWith("00:") ? result.substring(3) : result;
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black group overflow-hidden rounded-xl"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
                // Ignore clicks on controls
                if ((e.target as Element).closest('.video-controls')) return;
                togglePlay();
            }}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
            />

            {/* Source Badge overlay */}
            {sourceType && (
                <div className="absolute top-4 left-4 z-10 transition-opacity duration-300 pointer-events-none"
                    style={{ opacity: showControls ? 1 : 0 }}>
                    <Badge className="bg-[#272727]/80 hover:bg-[#272727] text-white border-none shadow-md">
                        {sourceType === "telegram" ? "Nexus Stream (Telegram)" : sourceType === "local" ? "Offline Player" : "Nexus Player"}
                    </Badge>
                </div>
            )}

            {/* Controls Overlay */}
            <div
                className={cn(
                    "video-controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pb-2 pt-16 transition-opacity duration-300",
                    showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            >
                {/* Progress Bar */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all mb-4 accent-indigo-500"
                />

                <div className="flex items-center justify-between rtl:flex-row-reverse">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors">
                            {isPlaying ? <Pause className="size-6 font-bold" fill="currentColor" /> : <Play className="size-6 font-bold" fill="currentColor" />}
                        </button>

                        <button onClick={toggleMute} className="text-white hover:text-indigo-400 transition-colors">
                            {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                        </button>

                        <div className="text-white text-sm font-medium tracking-wide">
                            {currentTime} <span className="opacity-50 mx-1">/</span> {duration}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Quality Selector (Optional) */}
                        {qualityOptions.length > 0 && (
                            <div className="bg-[#272727]/60 rounded-lg px-1 hidden sm:flex items-center h-8 border border-white/5">
                                <Settings className="size-4 text-white/70 ml-2" />
                                <Select
                                    value={quality}
                                    onValueChange={(q) => {
                                        setQuality(q);
                                        onQualityChange?.(q);
                                    }}
                                >
                                    <SelectTrigger className="w-[110px] h-7 bg-transparent border-none outline-none focus:ring-0 shadow-none text-xs text-white font-medium">
                                        <SelectValue placeholder="الجودة" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#222222] border-white/10 text-white rounded-lg">
                                        {qualityOptions.map((q) => (
                                            <SelectItem key={q} value={q} className="focus:bg-[#3f3f3f] cursor-pointer text-xs" dir="rtl">
                                                {q}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <button onClick={toggleFullScreen} className="text-white hover:text-indigo-400 transition-colors">
                            <Maximize className="size-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
