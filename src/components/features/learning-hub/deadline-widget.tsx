'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SUBJECTS } from './learning-hub-store';
import { Clock, AlertTriangle, Zap } from 'lucide-react';

/**
 * [STABILITY_ANCHOR: DEADLINE_WIDGET_V2.0_MERGED]
 * واجهة التنبيهات المدرسية المتقدمة — Nexus V2
 */
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
        setTimeLeft('EXPIRED');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}D ${hours}H`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}H ${minutes}M`);
      } else {
        setTimeLeft(`${minutes}M`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) return (
     <div className="flex items-center gap-3 py-2 opacity-40 grayscale">
        <Zap className="size-4" />
        <span className="text-[10px] font-black tracking-widest uppercase">No Active Deadlines</span>
     </div>
  );

  const subject = SUBJECTS.find((s) => s.id === deadline.subjectId);
  const isUrgent = (() => {
    const target = new Date('deadline' in deadline.item ? (deadline.item as any).deadline : (deadline.item as any).date);
    return (target.getTime() - Date.now()) < 1000 * 60 * 60 * 48; // < 48 hours
  })();

  return (
    <div className={cn(
      'p-4 rounded-2xl border transition-all duration-700 relative overflow-hidden group',
      isUrgent
        ? 'bg-red-500/10 border-red-500/20 shadow-lg shadow-red-500/5'
        : 'bg-white/[0.03] border-white/5'
    )} dir="rtl">
      {isUrgent && (
         <div className="absolute top-0 right-0 size-20 bg-red-500/10 blur-[30px] -mr-10 -mt-10 animate-pulse" />
      )}
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          {isUrgent ? (
            <AlertTriangle className="size-4 text-red-400 animate-bounce duration-[2000ms]" />
          ) : (
            <Clock className="size-4 text-primary" />
          )}
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">
            {isUrgent ? 'بروتوكول عاجل' : 'الموعد القادم'}
          </span>
        </div>
        <div className={cn('text-[10px] font-black tabular-nums tracking-tighter px-2 py-0.5 rounded-lg border', isUrgent ? 'border-red-500/20 text-red-400 bg-red-500/5' : 'border-primary/20 text-primary bg-primary/5')}>
          {timeLeft}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <p className="text-sm font-black text-white leading-tight line-clamp-1">{deadline.item.title}</p>
        
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <span className={cn('text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest', subject?.bgColor, subject?.color)}>
            {subject?.nameEn}
          </span>
          <p className="text-[9px] text-muted-foreground font-mono italic opacity-40">AUTO_SYNC_ENABLED</p>
        </div>
      </div>
    </div>
  );
}
