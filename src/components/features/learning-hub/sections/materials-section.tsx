'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  useLearningHubStore, SubjectId, MaterialItem,
} from '../learning-hub-store';
import { ItemModal } from '../item-modal';
import { Button } from '@/components/ui/button';
import { FileText, Presentation, Link2, Plus, Edit3, Trash2, ExternalLink, CloudUpload, Cloud, Database } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const typeIcons = {
  pdf: FileText,
  slide: Presentation,
  link: Link2,
};

const typeColors = {
  pdf: 'text-red-400 bg-red-500/10 border-red-500/20',
  slide: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  link: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

const typeLabels = {
  pdf: 'PDF Document',
  slide: 'Presentation',
  link: 'External Resource',
};

interface MaterialsSectionProps {
  subjectId: SubjectId;
}

/**
 * [STABILITY_ANCHOR: MATERIALS_SECTION_V3.0_HYBRID_READING]
 * قسم المواد الدراسية المطور — Nexus V2 مع دعم التخزين الهجين وواجهة مريحة
 */
export function MaterialsSection({ subjectId }: MaterialsSectionProps) {
  const { getMergedSubject, addItem, editItem, deleteItem, uploadToCloud, searchQuery } = useLearningHubStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);

  const subjectData = getMergedSubject(subjectId);
  const materials = subjectData.materials.filter((m) =>
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
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
               <FileText className="size-5 text-primary" />
            </div>
            المواد الدراسية والمصادر
            <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/5 opacity-50 uppercase tracking-widest">
              {materials.length} NODES
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mr-12 opacity-60">قائمة الكتب، العروض التقديمية، والمصادر الخارجية لهذا المسار.</p>
        </div>
        <Button
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
          className="h-12 px-8 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 shadow-2xl font-black gap-2 transition-transform active:scale-95"
        >
          <Plus className="size-5" />
          إضافة مورد جديد
        </Button>
      </div>

      {materials.length === 0 ? (
        <GlassCard variant="flat" className="py-24 text-center border-white/5 bg-slate-900/40">
          <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
             <FileText className="size-10 text-muted-foreground/20" />
          </div>
          <p className="text-sm font-bold text-muted-foreground/60">لا توجد مواد دراسية مخزنة حالياً في هذه النود</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {materials.map((item) => {
            const Icon = typeIcons[item.type];
            const isLocal = item.source === 'local';

            return (
              <GlassCard
                key={item.id}
                variant="hover"
                noPadding
                className="group border-white/5 bg-slate-900/40 flex flex-col h-full overflow-hidden"
              >
                {/* Header with Source & Type */}
                <div className="p-6 pb-2 flex items-center justify-between">
                  <div className={cn('px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest', typeColors[item.type])}>
                    {typeLabels[item.type]}
                  </div>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <div className={cn('size-8 rounded-xl flex items-center justify-center border', isLocal ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-primary/10 border-primary/20 text-primary')}>
                            {isLocal ? <Database className="size-3.5" /> : <Cloud className="size-3.5" />}
                         </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-950 border-white/10 text-[10px] font-bold">
                        {isLocal ? 'مخزن محلياً على جهازك' : 'مخزن سحابياً ومتاح لزملائك'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Content Area - Optimized for Reading */}
                <div className="px-6 flex-1">
                  <h4 className="text-base font-black text-white leading-relaxed mb-2 group-hover:text-primary transition-colors line-clamp-2">{item.title}</h4>
                  {item.description && (
                    <p className="text-xs text-muted-foreground/70 leading-loose line-clamp-3 mb-4 font-medium italic">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="p-6 pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon" variant="ghost"
                      className="size-9 rounded-xl text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="size-9 rounded-xl text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                      onClick={() => { setEditingItem(item); setModalOpen(true); }}
                    >
                      <Edit3 className="size-4" />
                    </Button>
                    
                    {/* Upload to Cloud Button */}
                    {isLocal && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon" variant="ghost"
                              className="size-9 rounded-xl text-primary hover:bg-primary/20 transition-all border border-primary/20 animate-pulse"
                              onClick={() => uploadToCloud(subjectId, 'materials', item)}
                            >
                              <CloudUpload className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-950 border-white/10 text-[10px] font-bold">
                            رفع إلى السحابة ومشاركة الزملاء
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
                    <AlertDialogContent className="bg-slate-950 border-white/10 rounded-[2rem] p-10 text-right" dir="rtl">
                      <AlertDialogHeader className="mb-6">
                        <AlertDialogTitle className="text-2xl font-black text-white">حذف المورد التعليمي</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground mt-2 leading-relaxed">
                          هل أنت متأكد من حذف المادة &quot;{item.title}&quot;؟ سيتم مسحها نهائياً من سجلاتك {isLocal ? 'المحلية' : 'السحابية'}. لا يمكن التراجع عن هذا الإجراء البرمجي.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-3">
                        <AlertDialogAction 
                          onClick={() => deleteItem(subjectId, 'materials', item.id)} 
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
              </GlassCard>
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
