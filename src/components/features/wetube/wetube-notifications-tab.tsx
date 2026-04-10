"use client";

import React from "react";
import { BellRing } from "lucide-react";
import { FeatureHeader } from "@/components/ui/feature-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Video } from "@/lib/video-store";
import { FeedVideo } from "@/lib/youtube-feed-store";
import { ContentItem } from "./wetube-types";

interface WeTubeNotificationsTabProps {
  feedVideos: FeedVideo[];
  lastSeenNotifications: number;
  setActiveVideo: (v: Video) => void;
}

export function WeTubeNotificationsTab({
  feedVideos, lastSeenNotifications, setActiveVideo
}: WeTubeNotificationsTabProps) {
  return (
    <div className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
      <div className="space-y-8 text-right">
        <FeatureHeader title="التنبيهات" Icon={BellRing} />
        {feedVideos.length === 0 ? <GlassCard variant="flat" className="text-center py-20 opacity-30">لا توجد تنبيهات</GlassCard> : (
          <div className="max-w-3xl ml-auto space-y-4">
            {feedVideos.slice(0, 20).map((v, i) => (
              <div 
                key={`notif-${v.id}-${i}`} 
                className="p-4 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-primary/40 hover:shadow-primary/5 transition-all flex items-start gap-4 flex-row-reverse group cursor-pointer" 
                onClick={() => setActiveVideo({ ...v, externalUrl: v.url, source: 'youtube' } as unknown as Video)}
              >
                <div className="size-20 rounded-xl overflow-hidden shrink-0 border border-white/5">
                  <img src={v.thumbnail} className="size-full object-cover" alt={v.title} />
                </div>
                <div className="flex-1 text-right">
                  <p className="font-bold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">{v.title}</p>
                  <p className="text-xs text-muted-foreground">• {v.author}</p>
                </div>
                {(v as unknown as ContentItem).fetchedAt && (((v as unknown as ContentItem).fetchedAt || 0) > lastSeenNotifications) && <div className="size-2 rounded-full bg-primary shadow-lg shadow-primary/50 mt-2" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
