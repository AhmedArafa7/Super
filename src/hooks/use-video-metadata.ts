"use client";

import { useState, useEffect } from "react";
import { fetchVideoDetails } from "@/lib/youtube-discovery-store";

// ذاكرة محلية بسيطة للجلسة لتجنب الطلبات المتكررة لنفس الفيديو في نفس الصفحة
const metadataCache: Record<string, { author: string, avatar: string, title?: string }> = {};

/**
 * هوك لاستعادة البيانات المفقودة للفيديو (مثل اسم القناة وصورتها) من يوتيوب مباشرة.
 * يضمن بقاء الداتابيز نحيفة والاستهلاك في الباقة المجانية بالحد الأدنى.
 */
export function useVideoMetadata(videoId: string | null, initialAuthor?: string, initialAvatar?: string) {
  const [metadata, setMetadata] = useState({
    author: initialAuthor || "",
    avatar: initialAvatar || "",
    isLoading: false
  });

  useEffect(() => {
    if (!videoId || (initialAuthor && initialAvatar)) return;

    // التحقق من الكاش أولاً
    if (metadataCache[videoId]) {
      setMetadata({
        author: metadataCache[videoId].author,
        avatar: metadataCache[videoId].avatar,
        isLoading: false
      });
      return;
    }

    let isMounted = true;

    async function resolveMetadata() {
      setMetadata(prev => ({ ...prev, isLoading: true }));
      try {
        const details = await fetchVideoDetails(videoId!);
        if (details && isMounted) {
          const newMeta = {
            author: details.author,
            avatar: details.channelAvatar || ""
          };
          metadataCache[videoId!] = newMeta;
          setMetadata({ ...newMeta, isLoading: false });
        }
      } catch (e) {
        console.error("Failed to resolve youtube metadata", e);
        if (isMounted) setMetadata(prev => ({ ...prev, isLoading: false }));
      }
    }

    resolveMetadata();
    return () => { isMounted = false; };
  }, [videoId, initialAuthor, initialAvatar]);

  return metadata;
}
