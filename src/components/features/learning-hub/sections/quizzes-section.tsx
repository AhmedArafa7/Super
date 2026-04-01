'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SubjectId, QuizItem } from '../learning-hub-store';
import { ItemModal } from '../item-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookCheck, Plus, Edit3, Trash2, Trophy, Calendar, CloudUpload, Cloud, Database } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { GlassCard } from '@/components/ui/glass-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QuizzesSectionProps {
  subjectId: SubjectId;
}

/**
 * [STABILITY_ANCHOR: QUIZZES_SECTION_V3.0_HYBRID_SYNC]
 * قسم الاختبارات المطور — Nexus V2 مع دعم التخزين الهجين وعرض النتائج المتقدم
 */
export function QuizzesSection({ subjectId }: QuizzesSectionProps) {
  const { getMergedSubject, addItem, editItem, deleteItem, uploadToCloud, searchQuery } = useLearningHubStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuizItem | null>(null);

  const subjectData = getMergedSubject(subjectId);
  const quizzes = subjectData.quizzes.filter((q) =>
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
    if (pct >= 85) return 'text-emerald-400';
    if (pct >= 70) return 'text-primary';
    if (pct >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white flex items-center gap-3">
             <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookCheck className="size-5 text-primary" />
             </div>
             سجل الاختبارات والتقييمات
             <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/5 opacity-50 uppercase tracking-widest">
               {quizzes.length} NODES
             </span>
          </h3>
          <p className="text-xs text-muted-foreground mr-12 opacity-60">متابعة نتائج الاختبارات الدورية والتقييمات الأكاديمية المستمرة.</p>
        </div>
        <Button
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
          className="h-12 px-8 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 shadow-2xl font-black gap-2 transition-transform active:scale-95"
        >
          <Plus className="size-5" />
          إضافة نتيجة اختبار
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <GlassCard variant="flat" className="py-24 text-center border-white/5 bg-slate-900/40">
          <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
             <Trophy className="size-10 text-muted-foreground/20" />
          </div>
          <p className="text-sm font-bold text-muted-foreground/60">لم يتم تسجيل أي نتائج اختبارات حتى الآن</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((item) => {
            const isLocal = item.source === 'local';
            const pct = item.score !== undefined ? (item.score / item.maxScore) * 100 : 0;
            
            return (
              <GlassCard
                key={item.id}
                variant="hover"
                className="group p-8 border-white/5 bg-slate-900/40 relative overflow-hidden"
              >
                {/* Header Information */}
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-2 flex-1">
                    <h4 className="text-lg font-black text-white leading-tight group-hover:text-primary transition-colors">{item.title}</h4>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black text-muted-foreground tabular-nums">
                          <Calendar className="size-3.5 opacity-40 text-primary" />
                          {new Date(item.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })}
                       </div>
                       
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
                  
                  <div className={cn(
                    'px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest',
                    item.completed ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/20 text-amber-400 bg-amber-500/10'
                  )}>
                    {item.completed ? 'COMPLETED' : 'UPCOMING'}
                  </div>
                </div>

                {/* Score Visualization Unit */}
                <div className="flex items-center justify-between bg-black/20 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                  {item.completed && item.score !== undefined ? (
                    <>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">Performance Score</p>
                        <div className="flex items-baseline gap-2">
                           <span className={cn('text-4xl font-black tabular-nums tracking-tighter', getScoreColor(item.score, item.maxScore))}>
                              {item.score}
                           </span>
                           <span className="text-sm font-bold text-muted-foreground">/ {item.maxScore}</span>
                        </div>
                        <p className={cn('text-[9px] font-black uppercase tracking-widest', getScoreColor(item.score, item.maxScore))}>
                           {pct >= 85 ? 'DISTINGUISHED' : pct >= 70 ? 'SUCCESSFUL' : pct >= 50 ? 'AVERAGE' : 'NEEDS_REVISION'}
                        </p>
                      </div>
                      
                      <div className="relative size-24">
                        <svg className="size-24 -rotate-90 drop-shadow-2xl" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                          <circle
                            cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8"
                            className={cn('transition-all duration-1000', getScoreColor(item.score, item.maxScore))}
                            strokeDasharray={`${(item.score / item.maxScore) * 276.4} 276.4`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={cn('size-12 rounded-full border-2 flex items-center justify-center bg-white/5', getScoreColor(item.score, item.maxScore).replace('text-', 'border-').replace('text-', 'text-'))}>
                             <Trophy className="size-6" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex flex-col items-center py-4 gap-4 opacity-30">
                       <Trophy className="size-16" />
                       <div className="text-[10px] font-black uppercase tracking-widest">Awaiting Evaluation Result</div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Rail */}
                <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                  <Button size="sm" variant="ghost" className="h-10 rounded-xl text-amber-400 hover:bg-amber-500/10 gap-2 px-4 font-black text-xs" onClick={() => { setEditingItem(item); setModalOpen(true); }}>
                    <Edit3 className="size-4" /> تحديث البيانات
                  </Button>
                  
                   {isLocal && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon" variant="ghost"
                                className="size-10 rounded-xl text-primary hover:bg-primary/20 transition-all border border-primary/20 hover:scale-110 ml-auto"
                                onClick={() => uploadToCloud(subjectId, 'quizzes', item)}
                              >
                                <CloudUpload className="size-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-950 border-white/10 text-[10px] font-bold">
                              مزامنة النتيجة مع الزملاء سحابياً
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className={cn("size-10 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all", !isLocal && "ml-auto")}>
                        <Trash2 className="size-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-950 border-white/10 rounded-[2rem] p-10 text-right shadow-2xl" dir="rtl">
                      <AlertDialogHeader className="mb-6">
                        <AlertDialogTitle className="text-2xl font-black text-white">حذف نتيجة الاختبار</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground mt-2 leading-relaxed">
                          هل أنت متأكد من حذف نتيجة &quot;{item.title}&quot;؟ سيتم مسح هذا السجل بالكامل ولن يدخل ضمن حسابات التقدم الأكاديمي.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-3">
                        <AlertDialogAction onClick={() => deleteItem(subjectId, 'quizzes', item.id)} className="bg-red-600 hover:bg-red-700 h-14 px-8 rounded-2xl font-black">حذف النتيجة</AlertDialogAction>
                        <AlertDialogCancel className="h-14 px-8 rounded-2xl border-white/10 bg-white/5 font-black">إلغاء</AlertDialogCancel>
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
        sectionType="quizzes"
        initialData={editingItem}
        onSave={handleSave}
        mode={editingItem ? 'edit' : 'add'}
      />
    </div>
  );
}
