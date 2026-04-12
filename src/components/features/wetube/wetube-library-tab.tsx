"use client";

import React from "react";
import { History, Library } from "lucide-react";
import { FeatureHeader } from "@/components/ui/feature-header";
import { GlassCard } from "@/components/ui/glass-card";
import { VideoCard } from "../stream/video-card";
import { Video } from "@/lib/video-store";
import { HistoryItem } from "@/lib/history-store";
import { ContentItem } from "./wetube-types";

interface WeTubeLibraryTabProps {
  cachedAssets: { id: string, title?: string }[];
  history: HistoryItem[];
  remoteHistory?: any[];
  allHomeContent: ContentItem[];
  setActiveVideo: (v: Video) => void;
  handleToggleLocal: (v: any) => void;
  handleChannelClick: (id: string, name: string, avatar?: string) => void;
}

export function WeTubeLibraryTab({
  cachedAssets, history, remoteHistory = [], allHomeContent,
  setActiveVideo, handleToggleLocal, handleChannelClick
}: WeTubeLibraryTabProps) {
  return (
    <div className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
      <div className="space-y-12 text-right">
        <section>
          <FeatureHeader title="المكتبة الرقمية" description="الفيديوهات المحفوظة وسجل المشاهدة المستقل." Icon={Library} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cachedAssets.map((asset, i) => {
              const vidId = asset.id.replace('video-', '');
              const vid = allHomeContent.find(v => v.id === vidId) || { id: vidId, title: asset.title, author: 'Offline Video', status: 'published', source: 'offline' };
              return <VideoCard key={`saved-${asset.id}-${i}`} video={vid as Video} isCached={true} onSync={handleToggleLocal} onClick={() => setActiveVideo(vid as Video)} onChannelClick={handleChannelClick} />;
            })}
          </div>
        </section>

        <section>
          <FeatureHeader title="سجل نكسوس المستقل" Icon={History} titleClassName="text-xl" />
          <p className="text-[10px] text-muted-foreground mb-6 -mt-4">نشاطك هنا خاص تماماً ولا يرسل ليوتيوب.</p>
          {history.length === 0 ? <GlassCard variant="flat" className="text-center py-10 opacity-40">السجل فارغ</GlassCard> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {history.map((h, i) => (
                <VideoCard key={`hist-${h.id}-${i}`} video={{ id: h.videoId, title: h.title, thumbnail: h.thumbnail || "", author: h.author, source: 'youtube', time: "شوهد في نكسوس" } as Video} isCached={cachedAssets.some(a => a.id === `video-${h.videoId}`)} onSync={handleToggleLocal} onChannelClick={handleChannelClick} onClick={() => setActiveVideo(h as unknown as Video)} />
              ))}
            </div>
          )}
        </section>

        <section>
          <FeatureHeader title="سجل يوتيوب (للقراءة فقط)" Icon={History} titleClassName="text-xl text-indigo-400" />
          <p className="text-[10px] text-muted-foreground mb-6 -mt-4">أكمل ما بدأته على المنصة الرسمية دون تتبع.</p>
          {remoteHistory.length === 0 ? <GlassCard variant="flat" className="text-center py-10 opacity-40">لا يوجد سجل مزامن حالياً</GlassCard> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {remoteHistory.map((v, i) => (
                <VideoCard key={`remote-${v.id}-${i}`} video={v as any} isCached={cachedAssets.some(a => a.id === `video-${v.id}`)} onSync={handleToggleLocal} onChannelClick={handleChannelClick} onClick={() => setActiveVideo(v as any)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
