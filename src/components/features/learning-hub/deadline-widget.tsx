'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SUBJECTS } from './learning-hub-store';
import { Clock, AlertTriangle } from 'lucide-react';

export function DeadlineWidget() {
  const getNextDeadline = useLearningHubStore((s) => s.getNextDeadline);
  const deadline = getNextDeadline();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!deadline) return;

    const update = () => {
      const now = new Date();
      const target = new Date('deadline' in deadline.item ? (deadline.item as any).deadline : (deadline.item as any).date);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('انتهى الوقت!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days} يوم ${hours} ساعة`);
      } else if (hours > 0) {
        setTimeLeft(`${hours} ساعة ${minutes} دقيقة`);
      } else {
        setTimeLeft(`${minutes} دقيقة`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) return null;

  const subject = SUBJECTS.find((s) => s.id === deadline.subjectId);
  const isUrgent = (() => {
    const target = new Date('deadline' in deadline.item ? (deadline.item as any).deadline : (deadline.item as any).date);
    return (target.getTime() - Date.now()) < 1000 * 60 * 60 * 48; // < 48 hours
  })();

  return (
    <div className={cn(
      'p-3 rounded-xl border transition-all',
      isUrgent
        ? 'bg-red-500/10 border-red-500/20 animate-pulse'
        : 'bg-white/5 border-white/10'
    )} dir="rtl">
      <div className="flex items-center gap-2 mb-1.5">
        {isUrgent ? (
          <AlertTriangle className="size-3.5 text-red-400" />
        ) : (
          <Clock className="size-3.5 text-amber-400" />
        )}
        <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">
          الموعد القادم
        </span>
      </div>
      <p className="text-xs font-bold text-white truncate">{deadline.item.title}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md', subject?.bgColor, subject?.color)}>
          {subject?.name}
        </span>
        <span className={cn('text-xs font-black tabular-nums', isUrgent ? 'text-red-400' : 'text-amber-400')}>
          {timeLeft}
        </span>
      </div>
    </div>
  );
}
