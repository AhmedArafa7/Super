"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { VideoDetails, YouTubeComment } from "@/lib/youtube-discovery-store";
import { ProSettings, DEFAULT_PRO_SETTINGS, checkProOwnership, NeuralMetadata } from "@/lib/wetube-pro-engine";
import { useAuth } from "@/components/auth/auth-provider";
import { useDataUsageStore } from "@/lib/data-usage-store";

interface WatchContextType {
  video: any;
  details: VideoDetails | null;
  setDetails: (d: VideoDetails | null) => void;
  comments: YouTubeComment[];
  setComments: (c: YouTubeComment[]) => void;
  isLoading: boolean;
  setIsLoading: (l: boolean) => void;
  neuralMetadata: NeuralMetadata | null;
  setNeuralMetadata: (m: NeuralMetadata | null) => void;
  selectedQuality: string;
  setSelectedQuality: (q: string) => void;
  isLiked: boolean;
  setIsLiked: (v: boolean) => void;
  isDisliked: boolean;
  setIsDisliked: (v: boolean) => void;
  isSubscribed: boolean;
  setIsSubscribed: (v: boolean) => void;
  isDescriptionExpanded: boolean;
  setIsDescriptionExpanded: (v: boolean) => void;
  isPro: boolean;
  proSettings: ProSettings;
  updateProSettings: (s: Partial<ProSettings>) => void;
}

const WatchContext = createContext<WatchContextType | undefined>(undefined);

export function WatchProvider({ children, initialVideo, initialQuality }: { 
  children: ReactNode; 
  initialVideo: any;
  initialQuality?: string;
}) {
  const { user } = useAuth();
  const [video, setVideo] = useState(initialVideo);
  const [details, setDetails] = useState<VideoDetails | null>(null);
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [neuralMetadata, setNeuralMetadata] = useState<NeuralMetadata | null>(null);
  const [selectedQuality, setSelectedQuality] = useState(initialQuality || "720");
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [proSettings, setProSettings] = useState<ProSettings>(DEFAULT_PRO_SETTINGS);

  useEffect(() => {
    const checkPro = async () => {
      if (user?.id) {
        const owned = await checkProOwnership(user.id);
        setIsPro(owned);
      }
    };
    checkPro();
  }, [user?.id]);

  // محاكاة اكتشاف المقدمة والخاتمة (Neural Analytics)
  useEffect(() => {
    if (video) {
        // في النسخة الحقيقية، سيتم جلب هذا من قاعدة بيانات مسبقة المعالجة
        // هنا نقوم بتمثيل العملية لبيان المبدأ
        if (video.title.includes("مسلسل") || video.title.includes("الحلقة")) {
            setNeuralMetadata({
                introStart: 5,
                introEnd: 60, // تخطي أول دقيقة
                outroStart: video.duration ? Number(video.duration) - 30 : undefined
            });
        } else {
            setNeuralMetadata(null);
        }
    }
  }, [video]);

  const updateProSettings = (updates: Partial<ProSettings>) => {
    setProSettings(prev => ({ ...prev, ...updates }));
  };

  // تقدير استهلاك البيانات أثناء المشاهدة
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
        // Mbps estimations for different qualities
        const qualityMap: Record<string, number> = {
            "144": 0.1,
            "240": 0.3,
            "360": 0.5,
            "480": 1.0,
            "720": 2.5,
            "1080": 5.0,
            "1440": 10.0,
            "2160": 20.0
        };

        const mbps = qualityMap[selectedQuality] || 1.0;
        // bytes per 5 seconds: (Mbps * 1024 * 1024 / 8) * 5
        const bytes = Math.floor((mbps * 1024 * 1024 / 8) * 2); // 2 seconds for more granularity if we want, or adjust interval
        
        // We track "online" status later if needed, for now assume active if mounted and not loading
        useDataUsageStore.getState().recordUsage(bytes, 'video');
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedQuality, isLoading]);

  return (
    <WatchContext.Provider value={{
      video,
      details,
      setDetails,
      comments,
      setComments,
      isLoading,
      setIsLoading,
      neuralMetadata,
      setNeuralMetadata,
      selectedQuality,
      setSelectedQuality,
      isLiked,
      setIsLiked,
      isDisliked,
      setIsDisliked,
      isSubscribed,
      setIsSubscribed,
      isDescriptionExpanded,
      setIsDescriptionExpanded,
      isPro,
      proSettings,
      updateProSettings
    }}>
      {children}
    </WatchContext.Provider>
  );
}

export function useWatch() {
  const context = useContext(WatchContext);
  if (context === undefined) {
    throw new Error("useWatch must be used within a WatchProvider");
  }
  return context;
}
