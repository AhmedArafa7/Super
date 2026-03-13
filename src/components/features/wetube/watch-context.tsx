"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { VideoDetails, YouTubeComment } from "@/lib/youtube-discovery-store";

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
}

const WatchContext = createContext<WatchContextType | undefined>(undefined);

export function WatchProvider({ children, initialVideo, initialQuality }: { 
  children: ReactNode; 
  initialVideo: any;
  initialQuality?: string;
}) {
  const [video, setVideo] = useState(initialVideo);
  const [details, setDetails] = useState<VideoDetails | null>(null);
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(initialQuality || "720");
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
      setIsDescriptionExpanded
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
