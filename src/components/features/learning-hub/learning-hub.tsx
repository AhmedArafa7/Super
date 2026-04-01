'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLearningHubStore, SUBJECTS, SubjectId } from './learning-hub-store';
import { LearningSidebar } from './learning-sidebar';
import { SubjectDashboard } from './subject-dashboard';
import { ScheduleView } from './schedule-view';
import { FeatureHeader } from '@/components/ui/feature-header';
import { GraduationCap, Cloud, Database, LayoutGrid, List, Search as SearchIcon, Sparkles } from 'lucide-react';
import { LearningSearchBar } from './search-bar';
import { QuickActionFab } from './quick-action-fab';
import { Button } from '@/components/ui/button';
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
    storageMode, 
    setStorageMode, 
    initCloudSync, 
    isLoading 
  } = useLearningHubStore();
  
  const [activeSubject, setActiveSubject] = useState<SubjectId>(SUBJECTS[0].id);
  const [activeView, setActiveView] = useState<'subject' | 'schedule'>('subject');

  // تفعيل المزامنة السحابية عند التحميل
  useEffect(() => {
    initCloudSync();
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-primary/30" dir="rtl">
      {/* Sidebar - Desktop */}
      <LearningSidebar
        activeSubject={activeSubject}
        activeView={activeView}
        onSubjectSelect={(id) => { setActiveSubject(id); setActiveView('subject'); }}
        onScheduleSelect={() => setActiveView('schedule')}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Header Section */}
        <div className="p-8 pb-4">
          <FeatureHeader
            title="نظام التعلم الذكي"
            description="إدارة الموارد الأكاديمية والمشاريع البحثية ببيئة Nexus المتكاملة."
            Icon={GraduationCap}
            iconClassName="text-primary"
            action={
              <div className="flex items-center gap-3">
                {/* Storage Toggle Indicator */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "h-12 px-5 rounded-2xl border-white/5 bg-slate-900/40 backdrop-blur-xl font-black gap-3 transition-all",
                        storageMode === 'cloud' ? "text-primary border-primary/20" : "text-amber-400 border-amber-400/20"
                      )}
                    >
                      {storageMode === 'cloud' ? <Cloud className="size-4 animate-pulse" /> : <Database className="size-4" />}
                      <span className="text-xs uppercase tracking-widest">
                        {storageMode === 'cloud' ? "الوضع السحابي المشترك" : "وضع التخزين المحلي"}
                      </span>
                      {isLoading && <div className="size-2 bg-primary rounded-full animate-ping" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-950 border-white/10 rounded-2xl p-2 w-56 shadow-2xl">
                    <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground p-3 tracking-widest">إعدادات النود الأكاديمية</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem 
                      onClick={() => setStorageMode('cloud')}
                      className="p-4 rounded-xl flex items-center gap-3 focus:bg-primary/10 cursor-pointer group"
                    >
                      <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Cloud className="size-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">الوضع السحابي</p>
                        <p className="text-[9px] text-muted-foreground">مشاركة البيانات مع الزملاء</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setStorageMode('local')}
                      className="p-4 rounded-xl flex items-center gap-3 focus:bg-amber-500/10 cursor-pointer group"
                    >
                      <div className="size-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <Database className="size-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">الوضع المحلي</p>
                        <p className="text-[9px] text-muted-foreground">تخزين آمن على جهازك فقط</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <LearningSearchBar />
              </div>
            }
          />
        </div>

        {/* Dynamic Content Switching */}
        <div className="flex-1 overflow-y-auto px-8 pb-32">
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
           <LayoutGrid className="size-3 text-primary" />
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
