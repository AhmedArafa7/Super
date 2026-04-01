'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SubjectId, QuestionBankItem } from '../learning-hub-store';
import { ItemModal } from '../item-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, Plus, Edit3, Trash2, FileText, Layers, ExternalLink, CloudUpload, Cloud, Database } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { GlassCard } from '@/components/ui/glass-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QuestionBanksSectionProps {
  subjectId: SubjectId;
}

/**
 * [STABILITY_ANCHOR: QUESTION_BANKS_SECTION_V3.0_HYBRID_SYNC]
 * قسم بنك الأسئلة المطور — Nexus V2 مع دعم التخزين الهجين وعرض الملفات المتقدم
 */
export function QuestionBanksSection({ subjectId }: QuestionBanksSectionProps) {
  const { getMergedSubject, addItem, editItem, deleteItem, uploadToCloud, searchQuery } = useLearningHubStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuestionBankItem | null>(null);

  const subjectData = getMergedSubject(subjectId);
  const questionBanks = subjectData.questionBanks.filter((q) =>
    !searchQuery || q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (data: any) => {
    if (editingItem) {
      editItem(subjectId, 'questionBanks', editingItem.id, data);
    } else {
      addItem(subjectId, 'questionBanks', data);
    }
    setEditingItem(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white flex items-center gap-3">
             <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Archive className="size-5 text-primary" />
             </div>
             أرشيف بنك الأسئلة
             <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/5 opacity-50 uppercase tracking-widest">
               {questionBanks.length} NODES
             </span>
          </h3>
          <p className="text-xs text-muted-foreground mr-12 opacity-60">تجميعات الأسئلة، الامتحانات السابقة، والمراجعات النهائية.</p>
        </div>
        <Button
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
          className="h-12 px-8 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 shadow-2xl font-black gap-2 transition-transform active:scale-95"
        >
          <Plus className="size-5" />
          إضافة بنك أسئلة
        </Button>
      </div>

      {questionBanks.length === 0 ? (
        <GlassCard variant="flat" className="py-24 text-center border-white/5 bg-slate-900/40">
          <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
             <Archive className="size-10 text-muted-foreground/20" />
          </div>
          <p className="text-sm font-bold text-muted-foreground/60">لا توجد ملفات أسئلة مؤرشفة حالياً</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {questionBanks.map((item) => {
            const isLocal = item.source === 'local';

            return (
              <GlassCard
                key={item.id}
                variant="hover"
                className="group p-8 border-white/5 bg-slate-900/40 flex flex-col gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="size-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/5 group-hover:scale-110 transition-transform duration-500">
                    <FileText className="size-8 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h4 className="text-lg font-black text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">{item.title}</h4>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-black px-3 py-1 rounded-xl border-white/10 text-muted-foreground gap-2 bg-white/5">
                        <Layers className="size-3.5 opacity-50" />
                        {item.category}
                      </Badge>
                      {item.pages && (
                        <span className="text-[10px] font-bold text-muted-foreground bg-white/5 px-3 py-1 rounded-xl border border-white/5">
                          {item.pages} صفحة
                        </span>
                      )}
                      
                      {/* Source Indicator */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn('flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest', isLocal ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-primary/10 border-primary/20 text-primary')}>
                              {isLocal ? <Database className="size-3" /> : <Cloud className="size-3" />}
                              {isLocal ? 'LOCAL' : 'CLOUD'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-950 border-white/10 text-[10px] font-bold">
                            {isLocal ? 'مخزن محلياً' : 'مخزن سحابياً لتعاون الزملاء'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-6 border-t border-white/5">
                  <Button
                    variant="outline"
                    className="h-12 text-xs text-white bg-white/5 border-white/5 hover:bg-primary hover:border-primary hover:text-white gap-2 rounded-2xl font-black px-6 transition-all flex-1"
                    onClick={() => window.open(item.url, '_blank')}
                  >
                    <ExternalLink className="size-4" /> عرض وتحميل الملف
                  </Button>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                    <Button size="icon" variant="ghost" className="size-10 rounded-xl text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-all" onClick={() => { setEditingItem(item); setModalOpen(true); }}>
                      <Edit3 className="size-5" />
                    </Button>
                    
                    {isLocal && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon" variant="ghost"
                              className="size-10 rounded-xl text-primary hover:bg-primary/20 transition-all border border-primary/20 animate-pulse"
                              onClick={() => uploadToCloud(subjectId, 'questionBanks', item)}
                            >
                              <CloudUpload className="size-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-950 border-white/10 text-[10px] font-bold">
                            الرفع السحابي والمشاركة
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
                          <AlertDialogTitle className="text-2xl font-black text-white">حذف بنك الأسئلة</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground mt-2 leading-relaxed">
                            هل أنت متأكد من حذف مرجع الأسئلة &quot;{item.title}&quot;؟ سيتم مسح الإدخال من الأرشيف.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row-reverse gap-3">
                          <AlertDialogAction onClick={() => deleteItem(subjectId, 'questionBanks', item.id)} className="bg-red-600 hover:bg-red-700 h-14 px-8 rounded-2xl font-black shadow-2xl">حذف المرجع</AlertDialogAction>
                          <AlertDialogCancel className="h-14 px-8 rounded-2xl border-white/10 bg-white/5 font-black">إلغاء</AlertDialogCancel>
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
        sectionType="questionBanks"
        initialData={editingItem}
        onSave={handleSave}
        mode={editingItem ? 'edit' : 'add'}
      />
    </div>
  );
}
