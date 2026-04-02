'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SUBJECTS, SubjectId } from './learning-hub-store';
import { ProgressWidget } from './progress-widget';
import { DeadlineWidget } from './deadline-widget';
import { GraduationCap, CalendarDays, Rocket } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { GlassCard } from '@/components/ui/glass-card';

interface LearningSidebarProps {
  activeSubject: SubjectId | null;
  activeView: 'subject' | 'schedule';
  onSubjectSelect: (id: SubjectId) => void;
  onScheduleSelect: () => void;
}

/**
 * [STABILITY_ANCHOR: LEARNING_SIDEBAR_V2.0_MERGED]
 * شريط التنقل الجانبي لمركز التعلم — Nexus V2
 */
export function LearningSidebar({ activeSubject, activeView, onSubjectSelect, onScheduleSelect }: LearningSidebarProps) {
  return (
    <div className="w-80 shrink-0 border-l border-white/5 bg-slate-950/60 backdrop-blur-3xl flex flex-col h-full font-sans shadow-2xl" dir="rtl">
      {/* Sidebar Header (V2 Stylized) */}
      <div className="p-8 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="flex items-center gap-4">
          <div className="size-14 bg-gradient-to-br from-primary to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:scale-105 transition-transform">
            <GraduationCap className="size-7 text-white" />
          </div>
          <div className="text-right">
            <h1 className="text-xl font-black text-white tracking-tight">التعلم</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mt-0.5">Academic Core</p>
          </div>
        </div>
      </div>

      {/* Navigation & Subject List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          <section className="space-y-2">
            <p className="text-[9px] uppercase font-black text-muted-foreground/40 tracking-[0.3em] px-4 mb-4">
              النظام الأساسي
            </p>
            <button
              onClick={onScheduleSelect}
              className={cn(
                'w-full text-right p-4 rounded-3xl transition-all duration-300 group flex items-center gap-4',
                activeView === 'schedule'
                  ? 'bg-primary/10 border border-primary/20 shadow-xl shadow-primary/5'
                  : 'hover:bg-white/5 border border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <div className={cn(
                'size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110',
                activeView === 'schedule' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'
              )}>
                <CalendarDays className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-black transition-colors',
                  activeView === 'schedule' ? 'text-white' : 'text-white/80 group-hover:text-white'
                )}>الجدول الموحد</p>
                <p className="text-[10px] text-muted-foreground/60">Global Academic Sync</p>
              </div>
            </button>
          </section>

          <section className="space-y-2">
            <p className="text-[9px] uppercase font-black text-muted-foreground/40 tracking-[0.3em] px-4 mb-4">
              المواد الدراسية
            </p>
            <div className="space-y-2">
              {SUBJECTS.map((subject) => {
                const isActive = activeView === 'subject' && activeSubject === subject.id;
                return (
                  <button
                    key={subject.id}
                    onClick={() => onSubjectSelect(subject.id)}
                    className={cn(
                      'w-full text-right p-4 rounded-3xl transition-all duration-500 group relative overflow-hidden',
                      isActive
                        ? 'bg-white/5 border border-white/10 shadow-2xl'
                        : 'hover:bg-white/[0.03] border border-transparent opacity-70 hover:opacity-100'
                    )}
                  >
                    {isActive && (
                      <div className="absolute top-0 right-0 size-20 bg-primary/20 blur-[30px] -mr-10 -mt-10" />
                    )}
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        'size-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-all duration-500',
                        isActive ? 'bg-primary/20 scale-110 rotate-3 shadow-lg' : subject.bgColor
                      )}>
                        {subject.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-black truncate transition-colors',
                          isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
                        )}>
                          {subject.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 truncate tracking-widest">{subject.nameEn}</p>
                      </div>
                    </div>

                    <div className="mt-4 px-1 relative z-10">
                      <ProgressWidget subjectId={subject.id} compact />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Deadline Sidebar Widget (Glassy) */}
      <div className="p-6 bg-gradient-to-t from-white/[0.02] to-transparent border-t border-white/5">
        <GlassCard variant="flat" className="p-4 bg-slate-900/40 hover:bg-slate-900/60 transition-colors border-white/5">
           <DeadlineWidget />
        </GlassCard>
      </div>
    </div>
  );
}
