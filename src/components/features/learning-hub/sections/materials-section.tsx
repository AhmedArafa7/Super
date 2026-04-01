'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  useLearningHubStore, SubjectId, MaterialItem,
} from '../learning-hub-store';
import { ItemModal } from '../item-modal';
import { Button } from '@/components/ui/button';
import { FileText, Presentation, Link2, Plus, Edit3, Trash2, ExternalLink } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const typeIcons = {
  pdf: FileText,
  slide: Presentation,
  link: Link2,
};

const typeColors = {
  pdf: 'text-red-400 bg-red-500/10',
  slide: 'text-amber-400 bg-amber-500/10',
  link: 'text-blue-400 bg-blue-500/10',
};

const typeLabels = {
  pdf: 'PDF',
  slide: 'عرض تقديمي',
  link: 'رابط',
};

interface MaterialsSectionProps {
  subjectId: SubjectId;
}

export function MaterialsSection({ subjectId }: MaterialsSectionProps) {
  const { subjects, addItem, editItem, deleteItem, searchQuery } = useLearningHubStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);

  const materials = subjects[subjectId].materials.filter((m) =>
    !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (data: any) => {
    if (editingItem) {
      editItem(subjectId, 'materials', editingItem.id, data);
    } else {
      addItem(subjectId, 'materials', data);
    }
    setEditingItem(null);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          المواد الدراسية
          <span className="text-[10px] text-muted-foreground font-normal">({materials.length})</span>
        </h3>
        <Button
          size="sm"
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
          className="h-8 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold gap-1.5"
        >
          <Plus className="size-3.5" />
          إضافة مادة
        </Button>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">لا توجد مواد بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {materials.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <div
                key={item.id}
                className="group p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] hover:border-white/15 transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className={cn('size-10 rounded-xl flex items-center justify-center shrink-0', typeColors[item.type])}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md', typeColors[item.type])}>
                        {typeLabels[item.type]}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 text-[10px] text-blue-400 hover:bg-blue-500/10 gap-1 rounded-lg"
                    onClick={() => window.open(item.url, '_blank')}
                  >
                    <ExternalLink className="size-3" /> فتح
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 text-[10px] text-amber-400 hover:bg-amber-500/10 gap-1 rounded-lg"
                    onClick={() => { setEditingItem(item); setModalOpen(true); }}
                  >
                    <Edit3 className="size-3" /> تعديل
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-400 hover:bg-red-500/10 gap-1 rounded-lg">
                        <Trash2 className="size-3" /> حذف
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-950 border-white/10 rounded-2xl" dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف المادة</AlertDialogTitle>
                        <AlertDialogDescription>هل أنت متأكد من حذف &quot;{item.title}&quot;؟ لا يمكن التراجع.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogAction onClick={() => deleteItem(subjectId, 'materials', item.id)} className="bg-red-600 hover:bg-red-700 rounded-xl">حذف</AlertDialogAction>
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

      <ItemModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        sectionType="materials"
        initialData={editingItem}
        onSave={handleSave}
        mode={editingItem ? 'edit' : 'add'}
      />
    </div>
  );
}
