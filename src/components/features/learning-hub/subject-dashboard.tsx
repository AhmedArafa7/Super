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
  FileText, Video, ClipboardList, BookCheck, FormInput, Archive, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeatureHeader } from '@/components/ui/feature-header';
import { GlassCard } from '@/components/ui/glass-card';

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

/**
 * [STABILITY_ANCHOR: SUBJECT_DASHBOARD_V2.0_MERGED]
 * لوحة معلومات المادة الدراسية المطورة — Nexus V2
 */
export function SubjectDashboard({ subjectId }: SubjectDashboardProps) {
  const subject = SUBJECTS.find((s) => s.id === subjectId)!;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={subjectId}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="p-8 space-y-10 h-full"
        dir="rtl"
      >
        {/* Subject Header Integrated with V2 Style */}
        <FeatureHeader 
          title={subject.name}
          description={subject.nameEn}
          Icon={Sparkles}
          iconClassName="text-amber-400"
          action={
            <div className="flex items-center gap-4 sm:w-80 w-full animate-in slide-in-from-left duration-700">
               <LearningSearchBar />
            </div>
          }
        >
           <div className={cn(
              'size-16 rounded-3xl flex items-center justify-center text-3xl border-2 shadow-2xl transition-transform hover:scale-110 duration-500',
              subject.bgColor,
              `border-${subject.color.replace('text-', '')}/20`
            )}>
              {subject.icon}
            </div>
        </FeatureHeader>

        {/* Analytics & Progress Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <GlassCard variant="default" className="lg:col-span-2 p-6 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 size-40 bg-primary/10 blur-[60px] -mr-20 -mt-20 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
              <ProgressWidget subjectId={subjectId} />
           </GlassCard>
           
           <GlassCard variant="hover" className="p-6 flex flex-col items-center justify-center text-center gap-2 border-white/5 bg-slate-900/40">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Verified Subjects</p>
              <div className="text-3xl font-black text-white">100%</div>
              <p className="text-[9px] text-primary font-bold">CORE SYNC ACTIVE</p>
           </GlassCard>
        </div>

        {/* Tabs for Sub-sections */}
        <Tabs defaultValue="materials" className="space-y-8">
          <TabsList className="bg-white/5 border border-white/5 rounded-2xl p-1.5 h-auto flex flex-wrap gap-1.5 backdrop-blur-3xl">
            {sectionOrder.map((section) => {
              const Icon = sectionIcons[section];
              return (
                <TabsTrigger
                  key={section}
                  value={section}
                  className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 rounded-xl text-xs font-bold gap-2 h-11 px-5 text-muted-foreground/60 transition-all hover:text-white"
                >
                  <Icon className="size-4" />
                  {SECTION_LABELS[section].label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <TabsContent value="materials" className="outline-none m-0">
                <MaterialsSection subjectId={subjectId} />
              </TabsContent>
              <TabsContent value="recordings" className="outline-none m-0">
                <RecordingsSection subjectId={subjectId} />
              </TabsContent>
              <TabsContent value="assignments" className="outline-none m-0">
                <AssignmentsSection subjectId={subjectId} />
              </TabsContent>
              <TabsContent value="quizzes" className="outline-none m-0">
                <QuizzesSection subjectId={subjectId} />
              </TabsContent>
              <TabsContent value="quizForms" className="outline-none m-0">
                <QuizFormsSection subjectId={subjectId} />
              </TabsContent>
              <TabsContent value="questionBanks" className="outline-none m-0">
                <QuestionBanksSection subjectId={subjectId} />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
}
