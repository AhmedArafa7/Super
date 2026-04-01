'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SUBJECTS, SubjectId, useLearningHubStore } from './learning-hub-store';
import { ProgressWidget } from './progress-widget';
import { DeadlineWidget } from './deadline-widget';
import { GraduationCap, CalendarDays, BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface LearningSidebarProps {
  activeSubject: SubjectId | null;
  activeView: 'subject' | 'schedule';
  onSubjectSelect: (id: SubjectId) => void;
  onScheduleSelect: () => void;
}

export function LearningSidebar({ activeSubject, activeView, onSubjectSelect, onScheduleSelect }: LearningSidebarProps) {
  return (
    <div className="w-72 shrink-0 border-r border-white/10 bg-slate-900/40 backdrop-blur-xl flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-gradient-to-br from-primary to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight">التعلم</h1>
            <p className="text-[10px] text-muted-foreground">إدارة المواد الدراسية</p>
          </div>
        </div>
      </div>

      {/* Subject List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          <p className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-[0.2em] px-3 mb-2">
            المواد الدراسية
          </p>
          {SUBJECTS.map((subject) => {
            const isActive = activeView === 'subject' && activeSubject === subject.id;
            return (
              <button
                key={subject.id}
                onClick={() => onSubjectSelect(subject.id)}
                className={cn(
                  'w-full text-right p-3 rounded-xl transition-all duration-200 group',
                  isActive
                    ? 'bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5'
                    : 'hover:bg-white/5 border border-transparent'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'size-9 rounded-lg flex items-center justify-center text-base shrink-0 transition-all',
                    isActive ? 'bg-primary/20 scale-110' : subject.bgColor
                  )}>
                    {subject.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs font-bold truncate transition-colors',
                      isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                    )}>
                      {subject.name}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">{subject.nameEn}</p>
                  </div>
                </div>
                <div className="mt-2 px-1">
                  <ProgressWidget subjectId={subject.id} compact />
                </div>
              </button>
            );
          })}

          <Separator className="my-3 bg-white/5" />

          {/* Schedule Link */}
          <button
            onClick={onScheduleSelect}
            className={cn(
              'w-full text-right p-3 rounded-xl transition-all duration-200 group',
              activeView === 'schedule'
                ? 'bg-amber-500/10 border border-amber-500/20 shadow-lg shadow-amber-500/5'
                : 'hover:bg-white/5 border border-transparent'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'size-9 rounded-lg flex items-center justify-center shrink-0',
                activeView === 'schedule' ? 'bg-amber-500/20' : 'bg-amber-500/10'
              )}>
                <CalendarDays className="size-5 text-amber-400" />
              </div>
              <div>
                <p className={cn(
                  'text-xs font-bold',
                  activeView === 'schedule' ? 'text-white' : 'text-white/80'
                )}>الجدول</p>
                <p className="text-[9px] text-muted-foreground">Schedule</p>
              </div>
            </div>
          </button>
        </div>
      </ScrollArea>

      {/* Deadline Widget */}
      <div className="p-3 border-t border-white/5">
        <DeadlineWidget />
      </div>
    </div>
  );
}
