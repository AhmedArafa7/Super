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
  AlertCircle, Upload, CloudUpload, Cloud, Database
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { GlassCard } from '@/components/ui/glass-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const statusConfig = {
  pending: { label: 'معلق', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  submitted: { label: 'تم التسليم', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: CheckCircle2 },
  graded: { label: 'تم التقييم', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
};

interface AssignmentsSectionProps {
  subjectId: SubjectId;
}

/**
 * [STABILITY_ANCHOR: ASSIGNMENTS_SECTION_V3.0_HYBRID_READING]
 * قسم الواجبات المطور — Nexus V2 مع دعم التخزين الهجين وواجهة مريحة
 */
export function AssignmentsSection({ subjectId }: AssignmentsSectionProps) {
  const { getMergedSubject, addItem, editItem, deleteItem, toggleAssignmentStatus, uploadToCloud, searchQuery } = useLearningHubStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AssignmentItem | null>(null);
  const [dropzoneOpen, setDropzoneOpen] = useState(false);

  const subjectData = getMergedSubject(subjectId);
  const assignments = subjectData.assignments.filter((a) =>
    !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (data: any) => {
    if (editingItem) {
      editItem(subjectId, 'assignments', editingItem.id, data);
    } else {
      addItem(subjectId, 'assignments', data);
    }
    setEditingItem(null);
  };

  const formatDeadline = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (days < 0) return { text: `${formatted} (متأخر)`, urgent: true };
    if (days <= 2) return { text: `${formatted} (متبقي ${days} يوم)`, urgent: true };
    return { text: formatted, urgent: false };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white flex items-center gap-3">
             <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="size-5 text-primary" />
             </div>
             المهام والواجبات المطلوبة
             <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/5 opacity-50 uppercase tracking-widest">
               {assignments.length} NODES
             </span>
          </h3>
          <p className="text-xs text-muted-foreground mr-12 opacity-60">تتبع تقدمك في المهام الأكاديمية والمشاريع التقنية.</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setDropzoneOpen(true)}
            className="h-12 px-6 rounded-2xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 font-black gap-2 transition-transform active:scale-95"
          >
            <Upload className="size-5" />
            رفع ملف
          </Button>
          <Button
            onClick={() => { setEditingItem(null); setModalOpen(true); }}
            className="h-12 px-8 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 shadow-2xl font-black gap-2 transition-transform active:scale-95"
          >
            <Plus className="size-5" />
            إضافة واجب
          </Button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <GlassCard variant="flat" className="py-24 text-center border-white/5 bg-slate-900/40">
          <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
             <ClipboardList className="size-10 text-muted-foreground/20" />
          </div>
          <p className="text-sm font-bold text-muted-foreground/60">لا توجد مهام دراسية معلقة حالياً</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {assignments.map((item) => {
            const status = statusConfig[item.status];
            const StatusIcon = status.icon;
            const deadline = formatDeadline(item.deadline);
            const isLocal = item.source === 'local';

            return (
              <GlassCard
                key={item.id}
                variant="hover"
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 border-white/5 bg-slate-900/40 relative overflow-hidden"
              >
                {/* Status Toggle Area */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => toggleAssignmentStatus(subjectId, item.id)}
                        className={cn(
                          'size-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 hover:scale-110 active:scale-90',
                          status.color
                        )}
                      >
                        <StatusIcon className="size-7" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-950 border-white/10 text-[10px] font-bold">
                       تغيير حالة المهمة
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Content Area */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h4 className={cn('text-lg font-black leading-tight tracking-tight', item.status === 'graded' ? 'text-muted-foreground line-through opacity-50' : 'text-white')}>
                      {item.title}
                    </h4>
                    <div className={cn('px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-[0.2em]', status.color)}>
                      {status.label}
                    </div>
                    {item.grade !== undefined && (
                      <div className="px-3 py-1 rounded-lg border border-emerald-500/20 text-emerald-400 bg-emerald-500/10 text-[9px] font-black tracking-widest">
                        {item.grade}% NODES
                      </div>
                    )}
                    
                    {/* Source Indicator */}
                    <div className={cn('flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest', isLocal ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-primary/10 border-primary/20 text-primary')}>
                       {isLocal ? <Database className="size-3" /> : <Cloud className="size-3" />}
                       {isLocal ? 'LOCAL' : 'CLOUD'}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-3xl line-clamp-2 italic font-medium">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[10px] tabular-nums', deadline.urgent ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-muted-foreground border-white/5')}>
                      {deadline.urgent ? <AlertCircle className="size-3.5" /> : <Clock className="size-3.5 opacity-40" />}
                      {deadline.text}
                    </div>
                  </div>
                </div>

                {/* Actions Footer - Desktop */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                  <Button
                    size="icon" variant="ghost"
                    className="size-10 rounded-xl text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                    onClick={() => { setEditingItem(item); setModalOpen(true); }}
                  >
                    <Edit3 className="size-5" />
                  </Button>
                  
                  {isLocal && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon" variant="ghost"
                            className="size-10 rounded-xl text-primary hover:bg-primary/20 transition-all border border-primary/20 animate-pulse"
                            onClick={() => uploadToCloud(subjectId, 'assignments', item)}
                          >
                            <CloudUpload className="size-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-950 border-white/10 text-[10px] font-bold">
                          رفع للمزامنة السحابية (المشاركة)
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-10 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 className="size-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-950 border-white/10 rounded-[2rem] p-10 text-right shadow-2xl" dir="rtl">
                      <AlertDialogHeader className="mb-6">
                        <AlertDialogTitle className="text-2xl font-black text-white">حذف المهمة الأكاديمية</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground mt-2 leading-relaxed">
                          هل أنت متأكد من حذف المهمة &quot;{item.title}&quot;؟ سيتم مسحها بالكامل من سجل الإنجاز وقاعدة البيانات.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-3">
                        <AlertDialogAction 
                          onClick={() => deleteItem(subjectId, 'assignments', item.id)} 
                          className="bg-red-600 hover:bg-red-700 h-14 px-8 rounded-2xl font-black shadow-2xl shadow-red-500/20"
                        >
                          تأكيد الحذف
                        </AlertDialogAction>
                        <AlertDialogCancel className="h-14 px-8 rounded-2xl border-white/10 bg-white/5 font-black">
                          تراجع
                        </AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Decorative Progress Gradient */}
                {item.status === 'graded' && (
                   <div className="absolute top-0 right-0 h-full w-1.5 bg-emerald-500 opacity-20" />
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* File Upload Dialog */}
      <Dialog open={dropzoneOpen} onOpenChange={setDropzoneOpen}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-10 text-right sm:max-w-md shadow-2xl" dir="rtl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-white text-right">أرشفة ملفات الواجب</DialogTitle>
          </DialogHeader>
          <FileDropzone />
          <p className="text-[10px] text-muted-foreground text-center mt-6 font-mono tracking-widest opacity-40 uppercase">
             PRO_HUB_CORE :: FILE_DROP_SYSTEM
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
