'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SUBJECTS, SubjectId } from './learning-hub-store';
import { LearningSidebar } from './learning-sidebar';
import { SubjectDashboard } from './subject-dashboard';
import { ScheduleView } from './schedule-view';
import { FeatureHeader } from '@/components/ui/feature-header';
import { 
  GraduationCap, Search, Plus, BookOpen, Clock, Calendar, CheckCircle2, ChevronRight, 
  Filter, MoreVertical, LayoutGrid, List, Trash2, Edit2, Share2, 
  ExternalLink, FileText, Video, Play, Download, SearchIcon,
  Cloud, Database, Loader2, Sparkles, Zap, ShieldCheck, Menu
} from 'lucide-react';
import { IconSafe } from '@/components/ui/icon-safe';
import { LearningSearchBar } from './search-bar';
import { QuickActionFab } from './quick-action-fab';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

/**
 * [STABILITY_ANCHOR: LEARNING_HUB_V3.0_HYBRID_SYNC]
 * واجهة التعلم المتطورة — Nexus V2 مع دعم التخزين الهجين (سحابي/محلي)
 */
export default function LearningHub() {
  const { 
    subjects, 
    schedule, 
    searchQuery, 
    setSearchQuery, 
    addItem, 
    editItem, 
    deleteItem,
    initCloudSync,
    isLoading,
  } = useLearningHubStore();
  
  const [activeSubject, setActiveSubject] = useState<SubjectId>(SUBJECTS[0].id);
  const [activeView, setActiveView] = useState<'subject' | 'schedule'>('subject');

  // تفعيل المزامنة السحابية عند التحميل
  // Automatic Sync on Mount
  useEffect(() => {
    initCloudSync();
  }, [initCloudSync]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-primary/30" dir="rtl">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex border-l border-white/5">
        <LearningSidebar
          activeSubject={activeSubject}
          activeView={activeView}
          onSubjectSelect={(id) => { setActiveSubject(id); setActiveView('subject'); }}
          onScheduleSelect={() => setActiveView('schedule')}
          className="w-80 shrink-0 border-l border-white/5 bg-slate-950/60 backdrop-blur-3xl"
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Header Section */}
        <div className="p-4 md:p-8 pb-4">
          <FeatureHeader
            title="نظام التعلم الذكي"
            description="إدارة الموارد الأكاديمية والمشاريع البحثية ببيئة Nexus المتكاملة."
            Icon={GraduationCap}
            iconClassName="text-primary"
            children={
              <div className="lg:hidden ml-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-11 rounded-xl bg-white/5 border border-white/10">
                      <Menu className="size-6 text-white" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="p-0 border-l-white/10 bg-slate-950 w-80">
                    <LearningSidebar
                      activeSubject={activeSubject}
                      activeView={activeView}
                      onSubjectSelect={(id) => { setActiveSubject(id); setActiveView('subject'); }}
                      onScheduleSelect={() => setActiveView('schedule')}
                      className="w-80"
                    />
                  </SheetContent>
                </Sheet>
              </div>
            }
            action={
              <div className="flex items-center gap-3">
                {/* Storage Toggle Indicator */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-md transition-all duration-500",
                        isLoading 
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse" 
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      )}>
                        {isLoading ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-wider">Syncing Cloud</span>
                          </>
                        ) : (
                          <>
                            <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider">Nexus Cloud Linked</span>
                          </>
                        )}
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-950 border-white/10 rounded-2xl p-2 w-56 shadow-2xl">
                    <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground p-3 tracking-widest">إعدادات النود الأكاديمية</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <div className="p-2 space-y-1">
                      <div className="px-3 py-2 text-[10px] text-slate-500 uppercase tracking-tighter">الحالة الحالية: متصل بالسحابة</div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <LearningSearchBar />
              </div>
            }
          />
        </div>

        {/* Dynamic Content Switching */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-32">
          <div className="max-w-[1600px] mx-auto">
            {activeView === 'subject' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <SubjectDashboard subjectId={activeSubject} />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ScheduleView />
              </div>
            )}
          </div>
        </div>

        {/* Global Context Indicator */}
        <div className="absolute bottom-10 right-10 flex items-center gap-2 pointer-events-none opacity-40">
           <IconSafe icon={LayoutGrid} className="size-3 text-primary" />
           <span className="text-[8px] font-mono tracking-[0.3em] uppercase">Academic Mesh Node Ready</span>
        </div>

        {/* Float Action System */}
        <QuickActionFab 
          onAddNote={() => {}} 
          onAddTask={() => {}} 
        />
      </main>
    </div>
  );
}
