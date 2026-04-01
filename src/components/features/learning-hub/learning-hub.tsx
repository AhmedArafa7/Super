'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { SubjectId, SectionItem, useLearningHubStore } from './learning-hub-store';
import { LearningSidebar } from './learning-sidebar';
import { SubjectDashboard } from './subject-dashboard';
import { ScheduleView } from './schedule-view';
import { QuickActionFab } from './quick-action-fab';
import { ItemModal } from './item-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GraduationCap } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { FeatureHeader } from '@/components/ui/feature-header';
import { GlassCard } from '@/components/ui/glass-card';

/**
 * [STABILITY_ANCHOR: LEARNING_HUB_V2.0_MERGED]
 * واجهة التعلم الذكية المطورة — Nexus V2
 */
export function LearningHub() {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('data-center');
  const [activeView, setActiveView] = useState<'subject' | 'schedule'>('subject');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickModalType, setQuickModalType] = useState<'materials' | 'assignments'>('materials');
  const isMobile = useIsMobile();
  const { addItem } = useLearningHubStore();

  const handleSubjectSelect = (id: SubjectId) => {
    setActiveSubject(id);
    setActiveView('subject');
    setMobileMenuOpen(false);
  };

  const handleScheduleSelect = () => {
    setActiveView('schedule');
    setMobileMenuOpen(false);
  };

  const handleQuickNote = () => {
    setQuickModalType('materials');
    setQuickModalOpen(true);
  };

  const handleQuickTask = () => {
    setQuickModalType('assignments');
    setQuickModalOpen(true);
  };

  const handleQuickSave = (data: Omit<SectionItem, 'id' | 'createdAt'>) => {
    addItem(activeSubject, quickModalType, data);
    setQuickModalOpen(false);
  };

  const sidebarContent = (
    <LearningSidebar
      activeSubject={activeSubject}
      activeView={activeView}
      onSubjectSelect={handleSubjectSelect}
      onScheduleSelect={handleScheduleSelect}
    />
  );

  return (
    <div className="flex h-full w-full bg-slate-950 overflow-hidden animate-in fade-in duration-700 font-sans">
      {/* Desktop Sidebar (V2 Style) */}
      {!isMobile && (
        <div className="hidden md:flex h-full">
           {sidebarContent}
        </div>
      )}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="right" className="p-0 w-80 bg-slate-950 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <SheetTitle className="sr-only">قائمة التعلم</SheetTitle>
            <SheetDescription className="sr-only">التنقل بين المواد الدراسية</SheetDescription>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-4 md:p-6 gap-6">
        {/* Unified V2 Header for Mobile */}
        {isMobile && (
          <FeatureHeader 
            title="مركز التعلم"
            description="إدارة المواد والجداول الدراسية"
            Icon={GraduationCap}
            iconClassName="text-primary"
            onMenuToggle={() => setMobileMenuOpen(true)}
          />
        )}

        {/* Dashboard Container */}
        <GlassCard 
          variant="borderless" 
          noPadding 
          className="flex-1 overflow-hidden bg-slate-900/20 backdrop-blur-3xl border border-white/5 shadow-2xl relative"
        >
          <ScrollArea className="h-full">
            {activeView === 'subject' ? (
              <SubjectDashboard subjectId={activeSubject} />
            ) : (
              <div className="p-8">
                <ScheduleView />
              </div>
            )}
          </ScrollArea>
        </GlassCard>
      </div>

      {/* Quick Action FAB */}
      <QuickActionFab onAddNote={handleQuickNote} onAddTask={handleQuickTask} />

      {/* Quick Add Modal */}
      <ItemModal
        open={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        sectionType={quickModalType}
        onSave={handleQuickSave}
        mode="add"
      />
    </div>
  );
}
