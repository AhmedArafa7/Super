
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Ad, fetchTargetedAds, recordAdClick, recordAdImpression } from "@/lib/ads-store";

/**
 * [STABILITY_ANCHOR: USE_AD_LOGIC_V1.0]
 * Professional hook for managing ad campaigns, tracking, and intersection logic.
 * Decouples marketing logic from UI rendering.
 */

interface UseAdLogicProps {
  type: 'sidebar' | 'home' | 'banner' | 'video' | 'image' | 'page';
  category?: string;
  fallbackAd: Ad;
}

export function useAdLogic({ type, category, fallbackAd }: UseAdLogicProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRecordedView, setHasRecordedView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadAd = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await fetchTargetedAds(type, category);
      setAd(results.length > 0 ? results[0] : fallbackAd);
    } catch (e) {
      console.error("[AD_LOGIC_ERROR] Failed to fetch ads:", e);
      setAd(fallbackAd);
    } finally {
      setIsLoading(false);
      setHasRecordedView(false);
    }
  }, [type, category, fallbackAd]);

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  // Handle Impression tracking
  useEffect(() => {
    if (!ad || ad.id.startsWith('default') || hasRecordedView) return;

    const currentRef = containerRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          recordAdImpression(ad.id);
          setHasRecordedView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 } // Require 50% visibility
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [ad, hasRecordedView]);

  const handleAdClick = useCallback(() => {
    if (ad && !ad.id.startsWith('default')) {
      recordAdClick(ad.id);
    }
  }, [ad]);

  return {
    ad: ad || fallbackAd,
    isLoading,
    containerRef,
    handleAdClick,
    refreshAd: loadAd
  };
}
