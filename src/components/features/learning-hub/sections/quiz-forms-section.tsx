'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SubjectId, QuizFormItem } from '../learning-hub-store';
import { ItemModal } from '../item-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormInput, Plus, Edit3, Trash2, ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const providerLabels = {
  'google-forms': 'Google Forms',
  'internal': 'داخلي',
  'external': 'خارجي',
};

const providerColors = {
  'google-forms': 'bg-violet-500/10 text-violet-400',
  'internal': 'bg-blue-500/10 text-blue-400',
  'external': 'bg-amber-500/10 text-amber-400',
};

interface QuizFormsSectionProps {
  subjectId: SubjectId;
}

export function QuizFormsSection({ subjectId }: QuizFormsSectionProps) {
  const { subjects, addItem, editItem, deleteItem, searchQuery } = useLearningHubStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuizFormItem | null>(null);

  const quizForms = subjects[subjectId].quizForms.filter((q) =>
    !searchQuery || q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (data: any) => {
    if (editingItem) {
      editItem(subjectId, 'quizForms', editingItem.id, data);
    } else {
      addItem(subjectId, 'quizForms', data);
    }
    setEditingItem(null);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 min-w-0">
          <FormInput className="size-4 text-primary shrink-0" />
          <span className="truncate">نماذج الاختبار</span>
          <span className="text-[10px] text-muted-foreground font-normal shrink-0">({quizForms.length})</span>
        </h3>
        <Button
          size="sm"
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
          className="h-9 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold gap-1.5 shrink-0"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">إضافة نموذج</span>
          <span className="sm:hidden">إضافة</span>
        </Button>
      </div>

      {quizForms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FormInput className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">لا توجد نماذج اختبار بعد</p>
        </div>
      ) : (
        <div className="space-y-2">
          {quizForms.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn(
                  'size-10 rounded-xl flex items-center justify-center shrink-0',
                  item.status === 'completed' ? 'bg-emerald-500/10' : 'bg-white/5'
                )}>
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="size-5 text-emerald-400" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md', providerColors[item.provider])}>
                      {providerLabels[item.provider]}
                    </span>
                    <Badge variant="outline" className={cn(
                      'text-[9px] h-5 rounded-lg border',
                      item.status === 'completed' ? 'border-emerald-500/20 text-emerald-400' : 'border-white/10 text-muted-foreground'
                    )}>
                      {item.status === 'completed' ? 'تم الحل' : 'لم يُحل'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:shrink-0">
                <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="size-8 text-amber-400 hover:bg-amber-500/10 rounded-lg" onClick={() => { setEditingItem(item); setModalOpen(true); }}>
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
                        <AlertDialogTitle>حذف النموذج</AlertDialogTitle>
                        <AlertDialogDescription>هل أنت متأكد من حذف &quot;{item.title}&quot;؟</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogAction onClick={() => deleteItem(subjectId, 'quizForms', item.id)} className="bg-red-600 hover:bg-red-700 rounded-xl">حذف</AlertDialogAction>
                        <AlertDialogCancel className="rounded-xl border-white/10">إلغاء</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ItemModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        sectionType="quizForms"
        initialData={editingItem}
        onSave={handleSave}
        mode={editingItem ? 'edit' : 'add'}
      />
    </div>
  );
}
