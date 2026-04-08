"use client";

import React, { useState } from "react";
import { Video as VideoIcon, History, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { CensorshipCard } from "./censorship/censorship-card";
import { PreviewModal } from "./censorship/preview-modal";
import { Video } from "@/lib/video-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

  const pendingVideos = videos.filter(v => v.status === 'pending_review' || !v.status);
  const trashVideos = videos.filter(v => v.status === 'trash');
  const publishedVideos = videos.filter(v => v.status === 'published');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Tabs defaultValue="pending" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-auto gap-1">
            <TabsTrigger value="pending" className="px-6 py-2.5 rounded-xl font-bold gap-2 flex-row-reverse data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Clock className="size-4" />
              قيد المراجعة
              {pendingVideos.length > 0 && <Badge className="bg-amber-500 text-black h-5 min-w-[20px] px-1">{pendingVideos.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="trash" className="px-6 py-2.5 rounded-xl font-bold gap-2 flex-row-reverse data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              <Trash2 className="size-4" />
              سلة المحذوفات
              {trashVideos.length > 0 && <Badge className="bg-red-500 text-white h-5 min-w-[20px] px-1">{trashVideos.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="published" className="px-6 py-2.5 rounded-xl font-bold gap-2 flex-row-reverse data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <CheckCircle2 className="size-4" />
              تم الاعتماد
              {publishedVideos.length > 0 && <Badge className="bg-emerald-500 text-white h-5 min-w-[20px] px-1">{publishedVideos.length}</Badge>}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending">
          {pendingVideos.length === 0 ? (
             <EmptyState icon={Clock} label="لا يوجد محتوى بانتظار المراجعة" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pendingVideos.map(v => <CensorshipCard key={v.id} video={v} onPreview={setPreviewVideo} onRefresh={onRefresh} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trash">
           {trashVideos.length === 0 ? (
             <EmptyState icon={Trash2} label="سلة المحذوفات فارغة" />
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trashVideos.map(v => <CensorshipCard key={v.id} video={v} onPreview={setPreviewVideo} onRefresh={onRefresh} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-80">
            {publishedVideos.map(v => <CensorshipCard key={v.id} video={v} onPreview={setPreviewVideo} onRefresh={onRefresh} />)}
          </div>
        </TabsContent>
      </Tabs>

      <PreviewModal 
        video={previewVideo} 
        onClose={() => setPreviewVideo(null)} 
        onRefresh={onRefresh} 
      />
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 opacity-30 border-2 border-dashed border-white/5 rounded-[3rem] text-center w-full">
      <Icon className="size-16 mb-4" />
      <p className="text-xl font-bold">{label}</p>
    </div>
  );
}
