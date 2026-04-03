'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SubjectId, QuizItem } from '../learning-hub-store';
import { ItemModal } from '../item-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, Plus, Edit3, Trash2, FileText, Layers, Eye, BookCheck, Calendar, Trophy } from 'lucide-react';
import { EmptyState } from '../empty-state';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface QuizzesSectionProps {
  subjectId: SubjectId;
}

export function QuizzesSection({ subjectId }: QuizzesSectionProps) {
  const { subjects, addItem, editItem, deleteItem, searchQuery } = useLearningHubStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuizItem | null>(null);

  const quizzes = subjects[subjectId].quizzes.filter((q) =>
    !searchQuery || q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (data: any, syncToCloud: boolean) => {
    if (editingItem) {
      editItem(subjectId, 'quizzes', editingItem.id, data);
    } else {
      addItem(subjectId, 'quizzes', data, syncToCloud);
    }
    setEditingItem(null);
    setModalOpen(false);
  };

  const getScoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return 'text-emerald-400';
    if (pct >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 min-w-0">
          <BookCheck className="size-4 text-primary shrink-0" />
          <span className="truncate">الاختبارات</span>
          <span className="text-[10px] text-muted-foreground font-normal shrink-0">({quizzes.length})</span>
        </h3>
        <Button
          size="sm"
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
          className="h-9 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold gap-1.5 shrink-0"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">إضافة اختبار</span>
          <span className="sm:hidden">إضافة</span>
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState 
          icon={Archive} 
          title="لا توجد اختبارات" 
          description="لم يتم إدراج أي اختبارات قادمة أو سابقة لهذه المادة بعد. تأكد من مراجعة الدروس!"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quizzes.map((item) => (
            <div
              key={item.id}
              onClick={() => item.url && window.open(item.url, '_blank')}
              className="group relative p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] hover:border-primary/30 transition-all active:scale-[0.98] cursor-pointer"
            >
              {/* Hover Eye Indicator */}
              <div className="absolute top-2 left-2 size-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="size-3.5" />
              </div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-white truncate">{item.title}</p>
                    <div className={cn(
                      "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter shrink-0",
                      item.source === 'cloud' ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground"
                    )}>
                      {item.source === 'cloud' ? 'Cloud' : 'Local'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="size-3 text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  'text-[9px] h-5 rounded-lg border shrink-0 mr-2',
                  item.completed ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/20 text-amber-400 bg-amber-500/10'
                )}>
                  {item.completed ? 'مكتمل' : 'قادم'}
                </Badge>
              </div>

              {/* Score Display */}
              <div className="flex items-center justify-center py-3 sm:py-4">
                {item.completed && item.score !== undefined ? (
                  <div className="text-center">
                    <div className="relative size-16 sm:size-20 mx-auto mb-2">
                      <svg className="size-16 sm:size-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/5" />
                        <circle
                          cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6"
                          className={getScoreColor(item.score, item.maxScore)}
                          strokeDasharray={`${(item.score / item.maxScore) * 213.6} 213.6`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn('text-base sm:text-lg font-black tabular-nums', getScoreColor(item.score, item.maxScore))}>
                          {item.score}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">من {item.maxScore}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Trophy className="size-8 sm:size-10 text-muted-foreground/20 mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">لم يتم التقييم بعد</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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
                      <AlertDialogTitle>حذف الاختبار</AlertDialogTitle>
                      <AlertDialogDescription>هل أنت متأكد من حذف &quot;{item.title}&quot;؟</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                      <AlertDialogAction onClick={() => deleteItem(subjectId, 'quizzes', item.id)} className="bg-red-600 hover:bg-red-700 rounded-xl">حذف</AlertDialogAction>
                      <AlertDialogCancel className="rounded-xl border-white/10">إلغاء</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <ItemModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        sectionType="quizzes"
        initialData={editingItem}
        onSave={handleSave}
        mode={editingItem ? 'edit' : 'add'}
      />
    </div>
  );
}
