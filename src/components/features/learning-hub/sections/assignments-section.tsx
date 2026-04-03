'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SubjectId, AssignmentItem } from '../learning-hub-store';
import { ItemModal } from '../item-modal';
import { FileDropzone } from '../file-dropzone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList, Plus, Edit3, Trash2, Clock, CheckCircle2,
  AlertCircle, ArrowUpDown, Upload, Eye
} from 'lucide-react';
import { EmptyState } from '../empty-state';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const statusConfig = {
  pending: { label: 'معلق', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  submitted: { label: 'تم التسليم', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: CheckCircle2 },
  graded: { label: 'تم التقييم', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
};

interface AssignmentsSectionProps {
  subjectId: SubjectId;
}

export function AssignmentsSection({ subjectId }: AssignmentsSectionProps) {
  const { subjects, addItem, editItem, deleteItem, toggleAssignmentStatus, searchQuery } = useLearningHubStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AssignmentItem | null>(null);
  const [dropzoneOpen, setDropzoneOpen] = useState(false);

  const assignments = subjects[subjectId].assignments.filter((a) =>
    !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (data: any, syncToCloud: boolean) => {
    if (editingItem) {
      editItem(subjectId, 'assignments', editingItem.id, data);
    } else {
      addItem(subjectId, 'assignments', data, syncToCloud);
    }
    setEditingItem(null);
    setModalOpen(false);
  };

  const formatDeadline = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (days < 0) return { text: `${formatted} (متأخر)`, urgent: true };
    if (days <= 2) return { text: `${formatted} (${days} يوم)`, urgent: true };
    return { text: formatted, urgent: false };
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 min-w-0">
          <ClipboardList className="size-4 text-primary shrink-0" />
          <span className="truncate">الواجبات</span>
          <span className="text-[10px] text-muted-foreground font-normal shrink-0">({assignments.length})</span>
        </h3>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => setDropzoneOpen(true)}
            className="h-9 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold gap-1.5"
          >
            <Upload className="size-3.5" />
            <span className="hidden sm:inline">رفع ملف</span>
            <span className="sm:hidden">رفع</span>
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditingItem(null); setModalOpen(true); }}
            className="h-9 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold gap-1.5"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">إضافة واجب</span>
            <span className="sm:hidden">إضافة</span>
          </Button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <EmptyState 
          icon={ClipboardList} 
          title="لا توجد واجبات" 
          description="لم يتم تكليفك بأي واجبات لهذه المادة بعد. استغل الوقت في المراجعة!"
        />
      ) : (
        <div className="space-y-2">
          {assignments.map((item) => {
            const status = statusConfig[item.status];
            const StatusIcon = status.icon;
            const deadline = formatDeadline(item.deadline);

            return (
              <div
                key={item.id}
                onClick={() => item.url && window.open(item.url, '_blank')}
                className="group relative flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] hover:border-primary/30 transition-all active:scale-[0.99] cursor-pointer"
              >
                {/* Hover Eye Indicator */}
                <div className="absolute top-2 left-2 size-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="size-3.5" />
                </div>
                <button
                  onClick={() => toggleAssignmentStatus(subjectId, item.id)}
                  className={cn(
                    'size-9 sm:size-10 rounded-xl flex items-center justify-center shrink-0 border transition-all hover:scale-110 active:scale-95',
                    status.color
                  )}
                >
                  <StatusIcon className="size-4 sm:size-5" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn('text-sm font-bold truncate', item.status === 'graded' ? 'text-muted-foreground line-through' : 'text-white')}>
                      {item.title}
                    </p>
                    <div className={cn(
                      "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter shrink-0",
                      item.source === 'cloud' ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground"
                    )}>
                      {item.source === 'cloud' ? 'Cloud' : 'Local'}
                    </div>
                    <Badge variant="outline" className={cn('text-[9px] h-5 rounded-lg border shrink-0', status.color)}>
                      {status.label}
                    </Badge>
                    {item.grade !== undefined && (
                      <Badge variant="outline" className="text-[9px] h-5 rounded-lg border-emerald-500/20 text-emerald-400 bg-emerald-500/10 shrink-0">
                        {item.grade}%
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    {deadline.urgent && <AlertCircle className="size-3 text-red-400 shrink-0" />}
                    <span className={cn('text-[10px] font-medium', deadline.urgent ? 'text-red-400' : 'text-muted-foreground')}>
                      {deadline.text}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="icon" variant="ghost"
                    className="size-8 text-amber-400 hover:bg-amber-500/10 rounded-lg"
                    onClick={() => { setEditingItem(item); setModalOpen(true); }}
                  >
                    <Edit3 className="size-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-8 text-red-400 hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-950 border-white/10 rounded-2xl w-[calc(100%-2rem)] max-w-md" dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف الواجب</AlertDialogTitle>
                        <AlertDialogDescription>هل أنت متأكد من حذف &quot;{item.title}&quot;؟</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogAction onClick={() => deleteItem(subjectId, 'assignments', item.id)} className="bg-red-600 hover:bg-red-700 rounded-xl">حذف</AlertDialogAction>
                        <AlertDialogCancel className="rounded-xl border-white/10">إلغاء</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Upload Dialog */}
      <Dialog open={dropzoneOpen} onOpenChange={setDropzoneOpen}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-2xl w-[calc(100%-2rem)] max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">رفع ملف الواجب</DialogTitle>
          </DialogHeader>
          <FileDropzone />
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            * هذه واجهة عرض فقط — لم يتم رفع أي ملفات فعلياً
          </p>
        </DialogContent>
      </Dialog>

      <ItemModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        sectionType="assignments"
        initialData={editingItem}
        onSave={handleSave}
        mode={editingItem ? 'edit' : 'add'}
      />
    </div>
  );
}
