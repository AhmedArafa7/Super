'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SubjectId, QuestionBankItem } from '../learning-hub-store';
import { ItemModal } from '../item-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, Plus, Edit3, Trash2, FileText, Layers } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface QuestionBanksSectionProps {
  subjectId: SubjectId;
}

export function QuestionBanksSection({ subjectId }: QuestionBanksSectionProps) {
  const { subjects, addItem, editItem, deleteItem, searchQuery } = useLearningHubStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuestionBankItem | null>(null);

  const questionBanks = subjects[subjectId].questionBanks.filter((q) =>
    !searchQuery || q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (data: any, syncToCloud: boolean) => {
    if (editingItem) {
      editItem(subjectId, 'questionBanks', editingItem.id, data);
    } else {
      addItem(subjectId, 'questionBanks', data, syncToCloud);
    }
    setEditingItem(null);
    setModalOpen(false);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 min-w-0">
          <Archive className="size-4 text-primary shrink-0" />
          <span className="truncate">بنك الأسئلة</span>
          <span className="text-[10px] text-muted-foreground font-normal shrink-0">({questionBanks.length})</span>
        </h3>
        <Button
          size="sm"
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
          className="h-9 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold gap-1.5 shrink-0"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">إضافة ملف</span>
          <span className="sm:hidden">إضافة</span>
        </Button>
      </div>

      {questionBanks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Archive className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">لا توجد ملفات أسئلة بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {questionBanks.map((item) => (
            <div
              key={item.id}
              className="group p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all active:scale-[0.98]"
            >
              <div className="flex items-start gap-3">
                <div className="size-10 sm:size-12 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="size-5 sm:size-6 text-indigo-400" />
                </div>
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
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[9px] h-5 rounded-lg border-white/10 text-muted-foreground gap-1">
                      <Layers className="size-2.5" />
                      {item.category}
                    </Badge>
                    {item.pages && (
                      <span className="text-[10px] text-muted-foreground">
                        {item.pages} صفحة
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
                <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-1 justify-end">
                  <Button size="sm" variant="ghost" className="h-8 text-[10px] text-amber-400 hover:bg-amber-500/10 gap-1 rounded-lg" onClick={() => { setEditingItem(item); setModalOpen(true); }}>
                    <Edit3 className="size-3" /> تعديل
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 text-[10px] text-red-400 hover:bg-red-500/10 gap-1 rounded-lg">
                        <Trash2 className="size-3" /> حذف
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-950 border-white/10 rounded-2xl w-[calc(100%-2rem)] max-w-md" dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف ملف الأسئلة</AlertDialogTitle>
                        <AlertDialogDescription>هل أنت متأكد من حذف &quot;{item.title}&quot;؟</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogAction onClick={() => deleteItem(subjectId, 'questionBanks', item.id)} className="bg-red-600 hover:bg-red-700 rounded-xl">حذف</AlertDialogAction>
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
        sectionType="questionBanks"
        initialData={editingItem}
        onSave={handleSave}
        mode={editingItem ? 'edit' : 'add'}
      />
    </div>
  );
}
