"use client";

import React, { useState } from "react";
import { VideoIcon } from "lucide-react";

interface YoutubeThumbnailProps {
  videoId: string;
  alt: string;
  className?: string;
  fallbackImageUrl?: string;
}

const QUALITY_CHAIN = [
  "maxresdefault",
  "sddefault",
  "hqdefault",
  "mqdefault",
  "default"
];

export function YoutubeThumbnail({ videoId, alt, className, fallbackImageUrl }: YoutubeThumbnailProps) {
  const [qualityIndex, setQualityIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  const currentQuality = QUALITY_CHAIN[qualityIndex];
  const src = `https://img.youtube.com/vi/${videoId}/${currentQuality}.jpg`;

  const handleError = () => {
    if (qualityIndex < QUALITY_CHAIN.length - 1) {
      setQualityIndex(qualityIndex + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  if (hasFailedAll) {
    return (
      <div className={`${className} bg-[#272727] flex items-center justify-center`}>
        {fallbackImageUrl ? (
          <img src={fallbackImageUrl} className="w-full h-full object-cover" alt={alt} />
        ) : (
          <VideoIcon className="size-10 text-white/10" />
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}
