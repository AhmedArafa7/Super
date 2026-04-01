'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SubjectId, QuizItem } from '../learning-hub-store';
import { ItemModal } from '../item-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookCheck, Plus, Edit3, Trash2, Trophy, Calendar } from 'lucide-react';
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

  const handleSave = (data: any) => {
    if (editingItem) {
      editItem(subjectId, 'quizzes', editingItem.id, data);
    } else {
      addItem(subjectId, 'quizzes', data);
    }
    setEditingItem(null);
  };

  const getScoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return 'text-emerald-400';
    if (pct >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BookCheck className="size-4 text-primary" />
          الاختبارات
          <span className="text-[10px] text-muted-foreground font-normal">({quizzes.length})</span>
        </h3>
        <Button
          size="sm"
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
          className="h-8 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold gap-1.5"
        >
          <Plus className="size-3.5" />
          إضافة اختبار
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookCheck className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">لا توجد اختبارات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quizzes.map((item) => (
            <div
              key={item.id}
              className="group p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="size-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  'text-[9px] h-5 rounded-lg border',
                  item.completed ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/20 text-amber-400 bg-amber-500/10'
                )}>
                  {item.completed ? 'مكتمل' : 'قادم'}
                </Badge>
              </div>

              {/* Score Display */}
              <div className="flex items-center justify-center py-4">
                {item.completed && item.score !== undefined ? (
                  <div className="text-center">
                    <div className="relative size-20 mx-auto mb-2">
                      <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/5" />
                        <circle
                          cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6"
                          className={getScoreColor(item.score, item.maxScore)}
                          strokeDasharray={`${(item.score / item.maxScore) * 213.6} 213.6`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn('text-lg font-black tabular-nums', getScoreColor(item.score, item.maxScore))}>
                          {item.score}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">من {item.maxScore}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Trophy className="size-10 text-muted-foreground/20 mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">لم يتم التقييم بعد</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" className="h-7 text-[10px] text-amber-400 hover:bg-amber-500/10 gap-1 rounded-lg flex-1" onClick={() => { setEditingItem(item); setModalOpen(true); }}>
                  <Edit3 className="size-3" /> تعديل
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-400 hover:bg-red-500/10 gap-1 rounded-lg flex-1">
                      <Trash2 className="size-3" /> حذف
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-950 border-white/10 rounded-2xl" dir="rtl">
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
