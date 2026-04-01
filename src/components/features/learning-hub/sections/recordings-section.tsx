'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SubjectId, RecordingItem } from '../learning-hub-store';
import { ItemModal } from '../item-modal';
import { Button } from '@/components/ui/button';
import { Video as VideoIcon, Plus, Edit3, Trash2, Play, Clock, ExternalLink, Sparkles } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useStreamStore } from '@/lib/stream-store';
import { extractYouTubeId } from '@/lib/youtube-utils';
import { GlassCard } from '@/components/ui/glass-card';
import { Video } from '@/lib/video-store';

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
 * [STABILITY_ANCHOR: RECORDINGS_SECTION_V2.0_MERGED]
 * قسم التسجيلات المطور مع مشغل Nexus الموحد
 */
export function RecordingsSection({ subjectId }: RecordingsSectionProps) {
  const { subjects, addItem, editItem, deleteItem, searchQuery } = useLearningHubStore();
  const { setActiveVideo } = useStreamStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecordingItem | null>(null);

  const recordings = subjects[subjectId].recordings.filter((r) =>
    !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (data: any) => {
    if (editingItem) {
      editItem(subjectId, 'recordings', editingItem.id, data);
    } else {
      addItem(subjectId, 'recordings', data);
    }
    setEditingItem(null);
    setModalOpen(false);
  };

  const handlePlay = (item: RecordingItem) => {
    // Transform RecordingItem to Video for the unified WeTube player
    const videoData: Video = {
      id: extractYouTubeId(item.url) || item.id,
      title: item.title,
      author: subjects[subjectId].name,
      source: 'youtube',
      externalUrl: item.url,
      thumbnail: getYouTubeThumbnail(item.url),
      status: 'published',
      visibility: 'public',
      createdAt: item.createdAt,
      authorId: 'system', // Academic source
    };
    setActiveVideo(videoData);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <VideoIcon className="size-4 text-primary" />
           </div>
           <h3 className="text-base font-black text-white">
            التسجيلات المحفوظة
            <span className="text-xs text-muted-foreground mr-2 font-mono tracking-widest uppercase opacity-40">[{recordings.length} NODES]</span>
          </h3>
        </div>
        <Button
          size="sm"
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
          className="h-10 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 shadow-xl font-bold px-5 gap-2 transition-transform active:scale-95"
        >
          <Plus className="size-4" />
          إضافة تسجيل جديد
        </Button>
      </div>

      {recordings.length === 0 ? (
        <GlassCard variant="flat" className="text-center py-20 border-white/5 bg-slate-900/40">
          <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
             <VideoIcon className="size-10 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-bold text-muted-foreground">لا توجد تسجيلات دراسية متاحة حالياً</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recordings.map((item) => {
            const isYT = isYouTubeUrl(item.url);
            const thumbnail = isYT ? getYouTubeThumbnail(item.url) : null;

            return (
              <GlassCard
                key={item.id}
                variant="hover"
                noPadding
                className="group border-white/5 relative flex flex-col h-full bg-slate-900/40"
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
                    <div className="size-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary),0.5)] transform scale-50 group-hover:scale-100 transition-transform duration-500">
                      <Play className="size-7 text-white fill-current ml-1" />
                    </div>
                  </div>

                  {item.duration && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-xl border border-white/10">
                      <Clock className="size-3 text-primary" />
                      {item.duration}
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3">
                     <div className="bg-primary/20 backdrop-blur-md border border-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-lg">
                        CORE PLAYBACK
                     </div>
                  </div>
                </div>

                {/* Info & Metadata */}
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-sm font-black text-white line-clamp-2 mb-4 leading-relaxed group-hover:text-primary transition-colors">{item.title}</p>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-white rounded-xl hover:bg-white/5" onClick={() => window.open(item.url, '_blank')}>
                          <ExternalLink className="size-4" />
                       </Button>
                       <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-amber-400 rounded-xl hover:bg-amber-500/10" onClick={() => { setEditingItem(item); setModalOpen(true); }}>
                          <Edit3 className="size-4" />
                       </Button>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors">
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-950 border-white/10 rounded-3xl p-8 shadow-2xl" dir="rtl">
                        <AlertDialogHeader className="text-right">
                          <AlertDialogTitle className="text-2xl font-black text-white">حذف المحتوى التعليمي</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground mt-2">
                            هل أنت متأكد من حذف التسجيل الدراسي &quot;{item.title}&quot; من سجلات النظام؟ لا يمكن التراجع عن هذا الإجراء البرمجي.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row-reverse gap-3 mt-8">
                          <AlertDialogAction 
                            onClick={() => deleteItem(subjectId, 'recordings', item.id)} 
                            className="bg-red-600 hover:bg-red-700 h-12 px-8 rounded-2xl font-bold flex-1 sm:flex-none shadow-xl shadow-red-500/20"
                          >
                            تأكيد الحذف النهائي
                          </AlertDialogAction>
                          <AlertDialogCancel className="h-12 px-8 rounded-2xl border-white/10 bg-white/5 font-bold flex-1 sm:flex-none">
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
