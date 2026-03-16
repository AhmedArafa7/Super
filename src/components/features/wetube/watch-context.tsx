"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { VideoDetails, YouTubeComment } from "@/lib/youtube-discovery-store";
import { ProSettings, DEFAULT_PRO_SETTINGS, checkProOwnership } from "@/lib/wetube-pro-engine";
import { useAuth } from "@/components/auth/auth-provider";

interface WatchContextType {
  video: any;
  details: VideoDetails | null;
  setDetails: (d: VideoDetails | null) => void;
  comments: YouTubeComment[];
  setComments: (c: YouTubeComment[]) => void;
  isLoading: boolean;
  setIsLoading: (l: boolean) => void;
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
  youtubeToken: string | null;
  setYoutubeToken: (token: string | null) => void;
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
  const [selectedQuality, setSelectedQuality] = useState(initialQuality || "720");
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [proSettings, setProSettings] = useState<ProSettings>(DEFAULT_PRO_SETTINGS);
  const [youtubeToken, setYoutubeToken] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to recover token from session storage
    const savedToken = sessionStorage.getItem('yt_access_token');
    if (savedToken) setYoutubeToken(savedToken);

    const checkPro = async () => {
      if (user?.id) {
        const owned = await checkProOwnership(user.id);
        setIsPro(owned);
      }
    };
    checkPro();
  }, [user?.id]);

  const handleSetYoutubeToken = (token: string | null) => {
    setYoutubeToken(token);
    if (token) {
        sessionStorage.setItem('yt_access_token', token);
    } else {
        sessionStorage.removeItem('yt_access_token');
    }
  };

  const updateProSettings = (updates: Partial<ProSettings>) => {
    setProSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <WatchContext.Provider value={{
      video,
      details,
      setDetails,
      comments,
      setComments,
      isLoading,
      setIsLoading,
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
      updateProSettings,
      youtubeToken,
      setYoutubeToken: handleSetYoutubeToken
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
