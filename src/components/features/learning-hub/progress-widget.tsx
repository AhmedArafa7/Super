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

export function ProgressWidget({ subjectId, compact = false }: ProgressWidgetProps) {
  const getProgress = useLearningHubStore((s) => s.getProgress);
  const progress = getProgress(subjectId);
  const subject = SUBJECTS.find((s) => s.id === subjectId);

  if (compact) {
    return (
      <div className="w-full">
        <Progress value={progress} className="h-1.5 bg-white/5" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <TrendingUp className={cn('size-4 shrink-0', subject?.color || 'text-primary')} />
        <span className="text-xs text-muted-foreground whitespace-nowrap">التقدم</span>
      </div>
      <div className="flex items-center gap-3 flex-1">
        <Progress value={progress} className="h-2 bg-white/5 flex-1" />
        <span className={cn(
          'text-xs font-black tabular-nums min-w-[3ch]',
          progress >= 80 ? 'text-emerald-400' : progress >= 50 ? 'text-amber-400' : 'text-muted-foreground'
        )}>
          {progress}%
        </span>
      </div>
    </div>
  );
}
