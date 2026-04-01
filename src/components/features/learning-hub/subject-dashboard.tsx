'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SubjectId, SUBJECTS, SectionType, SECTION_LABELS } from './learning-hub-store';
import { ProgressWidget } from './progress-widget';
import { LearningSearchBar } from './search-bar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaterialsSection } from './sections/materials-section';
import { RecordingsSection } from './sections/recordings-section';
import { AssignmentsSection } from './sections/assignments-section';
import { QuizzesSection } from './sections/quizzes-section';
import { QuizFormsSection } from './sections/quiz-forms-section';
import { QuestionBanksSection } from './sections/question-banks-section';
import {
  FileText, Video, ClipboardList, BookCheck, FormInput, Archive,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sectionIcons: Record<SectionType, React.ElementType> = {
  materials: FileText,
  recordings: Video,
  assignments: ClipboardList,
  quizzes: BookCheck,
  quizForms: FormInput,
  questionBanks: Archive,
};

const sectionOrder: SectionType[] = ['materials', 'recordings', 'assignments', 'quizzes', 'quizForms', 'questionBanks'];

interface SubjectDashboardProps {
  subjectId: SubjectId;
}

export function SubjectDashboard({ subjectId }: SubjectDashboardProps) {
  const subject = SUBJECTS.find((s) => s.id === subjectId)!;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={subjectId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="p-6 space-y-6 h-full"
        dir="rtl"
      >
        {/* Subject Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              'size-14 rounded-2xl flex items-center justify-center text-2xl border shadow-lg',
              subject.bgColor,
              `border-${subject.color.replace('text-', '')}/20`
            )}>
              {subject.icon}
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{subject.name}</h1>
              <p className="text-xs text-muted-foreground">{subject.nameEn}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:w-auto w-full">
            <LearningSearchBar />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <ProgressWidget subjectId={subjectId} />
        </div>

        {/* Tabs for Sub-sections */}
        <Tabs defaultValue="materials" className="space-y-4">
          <TabsList className="bg-white/5 border border-white/10 rounded-xl p-1 h-auto flex flex-wrap gap-1">
            {sectionOrder.map((section) => {
              const Icon = sectionIcons[section];
              return (
                <TabsTrigger
                  key={section}
                  value={section}
                  className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs font-bold gap-1.5 h-9 px-3 text-muted-foreground"
                >
                  <Icon className="size-3.5" />
                  {SECTION_LABELS[section].label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="materials" className="mt-4">
            <MaterialsSection subjectId={subjectId} />
          </TabsContent>
          <TabsContent value="recordings" className="mt-4">
            <RecordingsSection subjectId={subjectId} />
          </TabsContent>
          <TabsContent value="assignments" className="mt-4">
            <AssignmentsSection subjectId={subjectId} />
          </TabsContent>
          <TabsContent value="quizzes" className="mt-4">
            <QuizzesSection subjectId={subjectId} />
          </TabsContent>
          <TabsContent value="quizForms" className="mt-4">
            <QuizFormsSection subjectId={subjectId} />
          </TabsContent>
          <TabsContent value="questionBanks" className="mt-4">
            <QuestionBanksSection subjectId={subjectId} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
}
