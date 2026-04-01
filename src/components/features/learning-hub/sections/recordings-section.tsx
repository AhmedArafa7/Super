'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SubjectId, RecordingItem } from '../learning-hub-store';
import { ItemModal } from '../item-modal';
import { Button } from '@/components/ui/button';
import { Video as VideoIcon, Plus, Edit3, Trash2, Play, Clock, ExternalLink, CloudUpload, Cloud, Database } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useStreamStore } from '@/lib/stream-store';
import { extractYouTubeId } from '@/lib/youtube-utils';
import { GlassCard } from '@/components/ui/glass-card';
import { Video } from '@/lib/video-store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

function getYouTubeThumbnail(url: string): string {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : '';
}

interface RecordingsSectionProps {
  subjectId: SubjectId;
}

/**
 * [STABILITY_ANCHOR: RECORDINGS_SECTION_V3.0_HYBRID_SYNC]
 * قسم التسجيلات المطور — Nexus V2 مع دعم التخزين الهجين والمشغل الموحد
 */
export function RecordingsSection({ subjectId }: RecordingsSectionProps) {
  const { getMergedSubject, addItem, editItem, deleteItem, uploadToCloud, searchQuery } = useLearningHubStore();
  const { setActiveVideo } = useStreamStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecordingItem | null>(null);

  const subjectData = getMergedSubject(subjectId);
  const recordings = subjectData.recordings.filter((r) =>
    !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (data: any) => {
    if (editingItem) {
      editItem(subjectId, 'recordings', editingItem.id, data);
    } else {
      addItem(subjectId, 'recordings', data);
    }
    setEditingItem(null);
  };

  const handlePlay = (item: RecordingItem) => {
    const videoData: Video = {
      id: extractYouTubeId(item.url) || item.id,
      title: item.title,
      author: 'Academic Node',
      source: 'youtube',
      externalUrl: item.url,
      thumbnail: getYouTubeThumbnail(item.url),
      status: 'published',
      visibility: 'public',
      createdAt: item.createdAt,
      authorId: 'system',
      views: '0',
      time: item.duration || '0:00',
      allowedUserIds: [],
      uploaderRole: 'admin',
    };
    setActiveVideo(videoData);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white flex items-center gap-3">
             <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <VideoIcon className="size-5 text-primary" />
             </div>
             تسجيلات المحاضرات والدروس
             <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/5 opacity-50 uppercase tracking-widest">
               {recordings.length} NODES
             </span>
          </h3>
          <p className="text-xs text-muted-foreground mr-12 opacity-60">أرشيف المحاضرات المسجلة مع إمكانية التحليل الذكي عبر WeTube.</p>
        </div>
        <Button
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
          className="h-12 px-8 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 shadow-2xl font-black gap-2 transition-transform active:scale-95"
        >
          <Plus className="size-5" />
          إضافة تسجيل جديد
        </Button>
      </div>

      {recordings.length === 0 ? (
        <GlassCard variant="flat" className="py-24 text-center border-white/5 bg-slate-900/40">
          <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
             <VideoIcon className="size-10 text-muted-foreground/20" />
          </div>
          <p className="text-sm font-bold text-muted-foreground/60">لا توجد تسجيلات دراسية متاحة حالياً</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {recordings.map((item) => {
            const isYT = isYouTubeUrl(item.url);
            const thumbnail = isYT ? getYouTubeThumbnail(item.url) : null;
            const isLocal = item.source === 'local';

            return (
              <GlassCard
                key={item.id}
                variant="hover"
                noPadding
                className="group border-white/5 bg-slate-900/40 flex flex-col h-full overflow-hidden"
              >
                {/* Premium Thumbnail Area */}
                <div
                  className="relative h-44 bg-slate-800 flex items-center justify-center cursor-pointer overflow-hidden group/thumb"
                  onClick={() => handlePlay(item)}
                >
                  {thumbnail ? (
                    <img src={thumbnail} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <VideoIcon className="size-12" />
                    </div>
                  )}
                  
                  {/* Glass Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="size-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary),0.5)] transform scale-50 group-hover:scale-100 transition-transform duration-500">
                      <Play className="size-6 text-white fill-current ml-1" />
                    </div>
                  </div>

                  {item.duration && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-xl border border-white/10">
                      <Clock className="size-3 text-primary" />
                      {item.duration}
                    </div>
                  )}
                  
                  {/* Source Indicator on Thumbnail */}
                  <div className="absolute top-3 right-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <div className={cn('size-8 rounded-xl flex items-center justify-center border backdrop-blur-md', isLocal ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-primary/20 border-primary/40 text-primary')}>
                              {isLocal ? <Database className="size-3.5" /> : <Cloud className="size-3.5" />}
                           </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-950 border-white/10 text-[10px] font-bold">
                          {isLocal ? 'مخزن محلياً' : 'مخزن سحابياً لتعاون الزملاء'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-6 flex-1 flex flex-col">
                  <h4 className="text-base font-black text-white line-clamp-1 mb-4 leading-relaxed group-hover:text-primary transition-colors">{item.title}</h4>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Button size="icon" variant="ghost" className="size-9 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-all" onClick={() => window.open(item.url, '_blank')}>
                          <ExternalLink className="size-4" />
                       </Button>
                       <Button size="icon" variant="ghost" className="size-9 rounded-xl text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-all" onClick={() => { setEditingItem(item); setModalOpen(true); }}>
                          <Edit3 className="size-4" />
                       </Button>
                       
                       {isLocal && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon" variant="ghost"
                                className="size-9 rounded-xl text-primary hover:bg-primary/20 transition-all border border-primary/20 animate-pulse"
                                onClick={() => uploadToCloud(subjectId, 'recordings', item)}
                              >
                                <CloudUpload className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-950 border-white/10 text-[10px] font-bold">
                              رفع للتخزين السحابي العام
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-9 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-950 border-white/10 rounded-[2rem] p-10 text-right shadow-2xl" dir="rtl">
                        <AlertDialogHeader className="mb-6 text-right">
                          <AlertDialogTitle className="text-2xl font-black text-white">حذف المحتوى المرئي</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground mt-2 leading-relaxed">
                            هل أنت متأكد من حذف التسجيل الدراسي &quot;{item.title}&quot;؟ سيتم مسح الوصول إلى هذا الفيديو من السجل {isLocal ? 'المحلي' : 'السحابي'}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
                          <AlertDialogAction 
                            onClick={() => deleteItem(subjectId, 'recordings', item.id)} 
                            className="bg-red-600 hover:bg-red-700 h-14 px-8 rounded-2xl font-black shadow-2xl shadow-red-500/20"
                          >
                            تأكيد الحذف النهائي
                          </AlertDialogAction>
                          <AlertDialogCancel className="h-14 px-8 rounded-2xl border-white/10 bg-white/5 font-black">
                            إلغاء العملية
                          </AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <ItemModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        sectionType="recordings"
        initialData={editingItem}
        onSave={handleSave}
        mode={editingItem ? 'edit' : 'add'}
      />
    </div>
  );
}
