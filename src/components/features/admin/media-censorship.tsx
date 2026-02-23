"use client";

import React, { useState } from "react";
import { Video as VideoIcon } from "lucide-react";
import { CensorshipCard } from "./censorship/censorship-card";
import { PreviewModal } from "./censorship/preview-modal";
import { Video } from "@/lib/video-store";

interface MediaCensorshipProps {
  videos: Video[];
  onRefresh: () => void;
}

/**
 * [STABILITY_ANCHOR: MEDIA_CENSORSHIP_V4.0]
 * لوحة الرقابة المحدثة - تم تفكيك المكونات لضمان بقاء الأدمن في سياق المراجعة مع حل مشكلات الأزرار.
 */
export function MediaCensorship({ videos = [], onRefresh }: MediaCensorshipProps) {
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-40 border-2 border-dashed border-white/5 rounded-[2rem] text-center w-full">
        <VideoIcon className="size-12 mb-4" />
        <p className="text-lg font-bold">لا يوجد محتوى بصري بانتظار المراجعة</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map(v => (
          <CensorshipCard 
            key={v.id} 
            video={v} 
            onPreview={setPreviewVideo} 
            onRefresh={onRefresh} 
          />
        ))}
      </div>

      <PreviewModal 
        video={previewVideo} 
        onClose={() => setPreviewVideo(null)} 
        onRefresh={onRefresh} 
      />
    </div>
  );
}
