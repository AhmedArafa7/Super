'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SubjectId, RecordingItem } from '../learning-hub-store';
import { ItemModal } from '../item-modal';
import { Button } from '@/components/ui/button';
import { Video, Plus, Edit3, Trash2, Play, Clock, ExternalLink } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function getYouTubeThumbnail(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : '';
}

interface RecordingsSectionProps {
  subjectId: SubjectId;
}

export function RecordingsSection({ subjectId }: RecordingsSectionProps) {
  const { subjects, addItem, editItem, deleteItem, searchQuery } = useLearningHubStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecordingItem | null>(null);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);

  const recordings = subjects[subjectId].recordings.filter((r) =>
    !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (data: any, syncToCloud: boolean) => {
    if (editingItem) {
      editItem(subjectId, 'recordings', editingItem.id, data);
    } else {
      addItem(subjectId, 'recordings', data, syncToCloud);
    }
    setEditingItem(null);
    setModalOpen(false);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 min-w-0">
          <Video className="size-4 text-primary shrink-0" />
          <span className="truncate">التسجيلات</span>
          <span className="text-[10px] text-muted-foreground font-normal shrink-0">({recordings.length})</span>
        </h3>
        <Button
          size="sm"
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
          className="h-9 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold gap-1.5 shrink-0"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">إضافة تسجيل</span>
          <span className="sm:hidden">إضافة</span>
        </Button>
      </div>

      {recordings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Video className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">لا توجد تسجيلات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recordings.map((item) => {
            const isYT = isYouTubeUrl(item.url);
            const thumbnail = isYT ? getYouTubeThumbnail(item.url) : null;

            return (
              <div
                key={item.id}
                className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] hover:border-white/15 transition-all duration-300 active:scale-[0.98]"
              >
                {/* Thumbnail */}
                <div
                  className="relative h-32 sm:h-36 bg-slate-800 flex items-center justify-center cursor-pointer overflow-hidden"
                  onClick={() => setPlayerUrl(isYT ? getYouTubeEmbedUrl(item.url) : item.url)}
                >
                  {thumbnail ? (
                    <img src={thumbnail} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <Video className="size-12 text-muted-foreground/30" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-12 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                      <Play className="size-5 text-white ml-0.5" />
                    </div>
                  </div>
                  {item.duration && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                      <Clock className="size-3" />
                      {item.duration}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-white truncate">{item.title}</p>
                    <div className={cn(
                      "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter shrink-0",
                      item.source === 'cloud' ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground"
                    )}>
                      {item.source === 'cloud' ? 'Cloud' : 'Local'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="h-8 text-[10px] text-amber-400 hover:bg-amber-500/10 gap-1 rounded-lg flex-1" onClick={() => { setEditingItem(item); setModalOpen(true); }}>
                      <Edit3 className="size-3" /> تعديل
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 text-[10px] text-red-400 hover:bg-red-500/10 gap-1 rounded-lg flex-1">
                          <Trash2 className="size-3" /> حذف
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-950 border-white/10 rounded-2xl w-[calc(100%-2rem)] max-w-md" dir="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف التسجيل</AlertDialogTitle>
                          <AlertDialogDescription>هل أنت متأكد من حذف &quot;{item.title}&quot;؟</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row-reverse gap-2">
                          <AlertDialogAction onClick={() => deleteItem(subjectId, 'recordings', item.id)} className="bg-red-600 hover:bg-red-700 rounded-xl">حذف</AlertDialogAction>
                          <AlertDialogCancel className="rounded-xl border-white/10">إلغاء</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      <Dialog open={!!playerUrl} onOpenChange={() => setPlayerUrl(null)}>
        <DialogContent className="bg-black border-white/10 rounded-2xl w-[calc(100%-1rem)] max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-white text-sm">مشغل الفيديو</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {playerUrl && (
              <iframe
                src={playerUrl}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

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
