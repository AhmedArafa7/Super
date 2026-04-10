"use client";

import React from "react";
import { Loader2, History, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureHeader } from "@/components/ui/feature-header";
import { VideoCard } from "../stream/video-card";
import { Video } from "@/lib/video-store";
import { FeedVideo } from "@/lib/youtube-feed-store";

interface WeTubeSubsTabProps {
  isChannelLoading: boolean;
  isFeedLoading: boolean;
  feedVideos: FeedVideo[];
  cachedAssets: { id: string }[];
  setActiveVideo: (v: Video) => void;
  handleToggleLocal: (v: any) => void;
  handleChannelClick: (id: string, name: string, avatar?: string) => void;
  setIsImportModalOpen: (b: boolean) => void;
  setIsManageModalOpen: (b: boolean) => void;
  setIsAddModalOpen: (b: boolean) => void;
}

export function WeTubeSubsTab({
  isChannelLoading, isFeedLoading, feedVideos, cachedAssets,
  setActiveVideo, handleToggleLocal, handleChannelClick,
  setIsImportModalOpen, setIsManageModalOpen, setIsAddModalOpen
}: WeTubeSubsTabProps) {
  return (
    <div className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
      <div className="space-y-10 text-right">
        <FeatureHeader 
          title="اشتراكاتك النشطة"
          description="أحدث الفيديوهات من القنوات التي تتابعها."
          Icon={Sparkles}
          action={
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsImportModalOpen(true)} className="text-emerald-400 font-bold rounded-full">استيراد</Button>
              <Button variant="ghost" onClick={() => setIsManageModalOpen(true)} className="text-blue-400 font-bold rounded-full">إدارة</Button>
              <Button variant="outline" onClick={() => setIsAddModalOpen(true)} className="rounded-xl border-primary/20 text-primary">إضافة قناة</Button>
            </div>
          }
        />
        {(isChannelLoading || isFeedLoading) ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-10 animate-spin text-primary" /></div>
        ) : feedVideos.length === 0 ? (
          <div className="text-center py-32 opacity-30">
            <History className="size-16 mx-auto mb-4" />
            <p>لا يوجد محتوى جديد حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {feedVideos.map((v, i) => (
              <VideoCard
                key={`feed-${v.id}-${i}`} video={{ ...v, externalUrl: v.url, time: "اليوم" } as unknown as Video}
                isCached={cachedAssets.some(a => a.id === `video-${v.id}`)}
                onSync={handleToggleLocal} onClick={() => setActiveVideo({ ...v, externalUrl: v.url, source: 'youtube' } as unknown as Video)}
                onChannelClick={handleChannelClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
