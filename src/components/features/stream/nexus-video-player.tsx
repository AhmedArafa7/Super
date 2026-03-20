"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { NeuralMetadata } from "@/lib/wetube-pro-engine";
import { Forward, Loader2 } from "lucide-react";
import { getChunk, saveChunk } from "@/lib/wetube-pro-cache-manager";
import { useProStore, ConsumptionRecord, shouldRenderFrame } from "@/lib/wetube-pro-engine";

interface NexusVideoPlayerProps {
    src: string;
    videoId?: string;
    poster?: string;
    autoPlay?: boolean;
    qualityOptions?: string[];
    defaultQuality?: string;
    onQualityChange?: (quality: string) => void;
    sourceType?: "local" | "telegram" | "tiktok" | "youtube";
    proSettings?: {
        autoTrimOutro: boolean;
        frameSkipRatio: string;
        isSmartCacheEnabled?: boolean;
    };
    neuralMetadata?: NeuralMetadata;
}

export function NexusVideoPlayer({
    src,
    videoId,
    poster,
    autoPlay = false,
    qualityOptions = ["Auto (720p)"],
    defaultQuality = "Auto (720p)",
    onQualityChange,
    sourceType,
    proSettings,
    neuralMetadata
}: NexusVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState("0:00");
    const [duration, setDuration] = useState("0:00");
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [quality, setQuality] = useState(defaultQuality);
    const [showSkipIntro, setShowSkipIntro] = useState(false);
    
    // WeTube Pro States
    const [internalSrc, setInternalSrc] = useState(src);
    const [isCaching, setIsCaching] = useState(false);
    const frameRef = useRef(0);
    const rafRef = useRef<number>();
    const { addUsageRecord, totalSavedMB } = useProStore();

    let hideControlsTimeout: NodeJS.Timeout;

    // --- WeTube Pro: Smart Cache ---
    useEffect(() => {
        if (!proSettings || !videoId || !src.startsWith("http")) {
            setInternalSrc(src);
            return;
        }

        const loadCache = async () => {
            const chunk = await getChunk(videoId, 'auto', 0);
            if (chunk) {
                const blobUrl = URL.createObjectURL(new Blob([chunk]));
                setInternalSrc(blobUrl);
                addUsageRecord({
                    videoId,
                    quality: quality,
                    bytesConsumed: 0,
                    bytesSaved: chunk.byteLength,
                    method: 'cache'
                });
                return;
            }
            // Fetch if caching is authorized
            setIsCaching(true);
            try {
                const res = await fetch(src);
                const arrayBuffer = await res.arrayBuffer();
                await saveChunk(videoId, 'auto', 0, arrayBuffer);
                const blobUrl = URL.createObjectURL(new Blob([arrayBuffer]));
                setInternalSrc(blobUrl);
                
                addUsageRecord({
                    videoId,
                    quality: quality,
                    bytesConsumed: arrayBuffer.byteLength,
                    bytesSaved: 0,
                    method: 'network'
                });
            } catch (err) {
                console.error("Pro Smart Cache failed", err);
                setInternalSrc(src);
            } finally {
                setIsCaching(false);
            }
        };
        loadCache();
    }, [src, videoId, proSettings]);

    // --- WeTube Pro: Frame Skipping ---
    useEffect(() => {
        if (!proSettings || proSettings.frameSkipRatio === 'none' || !videoRef.current || !canvasRef.current) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            return;
        }

        const renderLoop = () => {
            if (videoRef.current && canvasRef.current) {
                if (videoRef.current.readyState >= 2 && !videoRef.current.paused) {
                    if (shouldRenderFrame(frameRef.current, proSettings.frameSkipRatio as any)) {
                        const ctx = canvasRef.current.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                        }
                    }
                    frameRef.current++;
                }
            }
            rafRef.current = requestAnimationFrame(renderLoop);
        };
        rafRef.current = requestAnimationFrame(renderLoop);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [proSettings, internalSrc]);

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

    // Simulation logic removed to maintain transparency.
    // YouTube streams are currently handled via optimized sandboxed iframe.

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
            
            // Pro Feature: Auto-Trim Outro (Skip last 5 seconds or use metadata)
            const outroTrigger = neuralMetadata?.outroStart || (dur > 10 ? dur - 5 : dur);
            if (proSettings?.autoTrimOutro && current >= outroTrigger) {
                videoRef.current.currentTime = dur;
                return;
            }

            // Neural Jump: Intro skipping
            if (neuralMetadata?.introStart !== undefined && neuralMetadata?.introEnd !== undefined) {
                if (current >= neuralMetadata.introStart && current < neuralMetadata.introEnd) {
                    setShowSkipIntro(true);
                } else {
                    setShowSkipIntro(false);
                }
            }

            setProgress((current / dur) * 100);
            setCurrentTime(formatTime(current));
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(formatTime(videoRef.current.duration));
            if (canvasRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
            }
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
            {/* Pro Global Layer (Neural Overlay) */}
            {proSettings && (
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden opacity-30">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-primary animate-scan-line" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]" />
                </div>
            )}

            {/* Video Engine Selection */}
            {sourceType === 'youtube' && !proSettings ? (
                <div className="relative w-full h-full">
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&vq=hd${quality.replace(/\D/g, '')}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        src={sourceType === 'youtube' && proSettings ? `https://nexus-proxy.wetube.pro/v/${videoId}?auth=pro-active` : internalSrc}
                        poster={poster}
                        className={cn("w-full h-full object-contain", proSettings?.frameSkipRatio !== 'none' ? 'opacity-0 absolute inset-0 pointer-events-none' : '')}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onClick={togglePlay}
                        playsInline
                    />

                    {/* Pro Canvas Engine (For Frame Optimization) */}
                    {proSettings && proSettings.frameSkipRatio !== 'none' && (
                        <canvas 
                            ref={canvasRef} 
                            className="w-full h-full object-contain absolute inset-0 z-0 pointer-events-none" 
                        />
                    )}

                    {/* Pro Processing Telemetry */}
                    {proSettings && (
                        <div className="absolute bottom-20 left-6 z-20 flex flex-col gap-1 font-mono text-[8px] text-primary/80 uppercase leading-relaxed">
                            <div className="flex items-center gap-2">
                                <div className="size-1 bg-primary animate-pulse" />
                                <span className="font-black">Nexus Hybrid Engine: Buffered</span>
                            </div>
                            <div className="opacity-60">Neural Ratio: {proSettings.frameSkipRatio}</div>
                            <div className="opacity-60">Status: Local Drive Processing</div>
                        </div>
                    )}
                </>
            )}

            {/* Floating Pro Efficiency Monitor */}
            {proSettings && (
                <div className="absolute top-16 right-4 z-20 flex flex-col gap-1 items-end pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-primary/20 flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] font-bold text-white uppercase tracking-tighter">
                            Nexus Core Active
                        </span>
                    </div>
                    <div className="bg-primary/20 backdrop-blur-md px-2 py-1 rounded-lg border border-primary/30 flex flex-col items-end">
                       <span className="text-[8px] text-primary font-black uppercase">Core Performance</span>
                       <span className="text-[10px] text-white font-mono font-bold tracking-widest leading-none">OPTIMIZED PLAYBACK</span>
                    </div>
                </div>
            )}

            {isCaching && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-indigo-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-500/30">
                    <Loader2 className="size-4 text-indigo-400 animate-spin" />
                    <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">Caching Smart Chunks</span>
                </div>
            )}

            {/* Neural Jump Button */}
            {showSkipIntro && neuralMetadata?.introEnd && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (videoRef.current && neuralMetadata.introEnd) {
                            videoRef.current.currentTime = neuralMetadata.introEnd;
                            setShowSkipIntro(false);
                        }
                    }}
                    className="absolute bottom-24 right-8 z-20 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl transition-all animate-in fade-in slide-in-from-right-4"
                >
                    <Forward className="size-5" />
                    تخطي المقدمة
                </button>
            )}

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
