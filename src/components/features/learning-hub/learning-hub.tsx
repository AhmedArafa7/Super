'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { SubjectId } from './learning-hub-store';
import { LearningSidebar } from './learning-sidebar';
import { SubjectDashboard } from './subject-dashboard';
import { ScheduleView } from './schedule-view';
import { QuickActionFab } from './quick-action-fab';
import { ItemModal } from './item-modal';
import { useLearningHubStore } from './learning-hub-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Menu, GraduationCap } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

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

  const handleQuickSave = (data: any) => {
    addItem(activeSubject, quickModalType, data);
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
    <div className="flex h-full w-full bg-background overflow-hidden animate-in fade-in duration-500">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="hidden md:flex h-full">
          {sidebarContent}
        </div>
      )}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="right" className="p-0 w-72 bg-slate-950 border-white/10">
            <SheetTitle className="sr-only">قائمة التعلم</SheetTitle>
            <SheetDescription className="sr-only">التنقل بين المواد الدراسية</SheetDescription>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-slate-900/40 md:hidden" dir="rtl">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl text-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              <span className="text-sm font-black text-white">التعلم</span>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <ScrollArea className="flex-1">
          {activeView === 'subject' ? (
            <SubjectDashboard subjectId={activeSubject} />
          ) : (
            <div className="p-6">
              <ScheduleView />
            </div>
          )}
        </ScrollArea>
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
