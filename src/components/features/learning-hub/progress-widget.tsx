'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SubjectId, SUBJECTS } from './learning-hub-store';
import { TrendingUp } from 'lucide-react';

interface ProgressWidgetProps {
  subjectId: SubjectId;
  compact?: boolean;
}

/**
 * [STABILITY_ANCHOR: PROGRESS_WIDGET_V2.0_MERGED]
 * واجهة التقدم الأكاديمي المطورة — Nexus V2
 */
export function ProgressWidget({ subjectId, compact = false }: ProgressWidgetProps) {
  const getProgress = useLearningHubStore((s) => s.getProgress);
  const progress = getProgress(subjectId);
  const subject = SUBJECTS.find((s) => s.id === subjectId);

  if (compact) {
    return (
      <div className="w-full space-y-1">
        <div className="flex justify-between items-center text-[8px] font-black tabular-nums opacity-60">
           <span>{progress}% COMPLETE</span>
        </div>
        <Progress 
          value={progress} 
          className={cn("h-1 bg-white/5", subject?.color.replace('text-', 'bg-'))} 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2">
          <div className={cn('size-8 rounded-lg flex items-center justify-center bg-white/5 shadow-inner', subject?.color || 'text-primary')}>
            <TrendingUp className="size-4 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">معدل الإنجاز الأكاديمي</p>
            <p className="text-xs font-bold text-white mt-1">المادة الدراسية: {subject?.name}</p>
          </div>
        </div>
        <div className={cn(
          'text-2xl font-black tabular-nums tracking-tighter',
          progress >= 80 ? 'text-emerald-400' : progress >= 50 ? 'text-amber-400' : 'text-primary'
        )}>
          {progress}%
        </div>
      </div>
      
      <div className="relative pt-2">
        <Progress 
          value={progress} 
          className="h-3 bg-white/5 rounded-full border border-white/5 shadow-inner" 
        />
        <div 
          className="absolute top-2 left-0 h-3 blur-[8px] opacity-30 transition-all duration-1000 bg-primary rounded-full shadow-[0_0_20px_var(--primary)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-[9px] text-muted-foreground/60 text-right font-mono uppercase tracking-[0.2em]">System node synced with local progression data</p>
    </div>
  );
}
