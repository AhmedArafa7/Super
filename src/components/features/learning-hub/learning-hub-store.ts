'use client';

// ─────────────────────────────────────────────────────────────
// learning-hub-store.ts  (refactored — clean & minimal)
// يحتوي فقط على منطق الـ Zustand Store
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { learningService } from '@/lib/learning-service';

// Re-export everything from sub-modules so existing imports still work
export type {
  SubjectId, SectionType, AssignmentStatus, QuizFormStatus,
  BaseItem, MaterialItem, RecordingItem, AssignmentItem,
  QuizItem, QuizFormItem, QuestionBankItem, SectionItem,
  SubjectData, ScheduleEvent, SubjectMeta,
} from './learning-hub-types';
export { SUBJECTS, SECTION_LABELS, DAYS } from './learning-hub-types';

import type {
  SubjectId, SectionType, AssignmentStatus,
  SectionItem, SubjectData, ScheduleEvent,
  AssignmentItem, QuizItem,
} from './learning-hub-types';
import { makeEmptySubject, makeDemoData, makeDemoSchedule } from './learning-hub-demo';

// ── uid helper ──
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Store Interface ──
interface LearningHubState {
  subjects: Record<SubjectId, SubjectData>;
  cloudSubjects: Record<SubjectId, SubjectData>;
  schedule: ScheduleEvent[];
  searchQuery: string;
  storageMode: 'cloud' | 'local';
  isLoading: boolean;

  // Sync
  initCloudSync: () => void;
  setStorageMode: (mode: 'cloud' | 'local') => void;

  // CRUD
  addItem:      (subjectId: SubjectId, section: SectionType, item: Omit<SectionItem, 'id' | 'createdAt'>) => Promise<void>;
  editItem:     (subjectId: SubjectId, section: SectionType, itemId: string, updates: Partial<SectionItem>) => Promise<void>;
  deleteItem:   (subjectId: SubjectId, section: SectionType, itemId: string) => Promise<void>;
  uploadToCloud:(subjectId: SubjectId, section: SectionType, item: SectionItem) => Promise<void>;

  // Assignment
  toggleAssignmentStatus: (subjectId: SubjectId, itemId: string) => void;

  // Schedule
  addScheduleEvent:    (event: Omit<ScheduleEvent, 'id'>) => void;
  editScheduleEvent:   (id: string, updates: Partial<ScheduleEvent>) => void;
  deleteScheduleEvent: (id: string) => void;

  // Search
  setSearchQuery: (q: string) => void;

  // Computed
  getMergedSubject: (subjectId: SubjectId) => SubjectData;
  getProgress:      (subjectId: SubjectId) => number;
  getNextDeadline:  () => { item: AssignmentItem | QuizItem; subjectId: SubjectId } | null;
}

// ── Store ──
export const useLearningHubStore = create<LearningHubState>()(
  persist(
    (set, get) => ({
      subjects:      makeDemoData(),
      cloudSubjects: {} as any,
      schedule:      makeDemoSchedule(),
      searchQuery:   '',
      storageMode:   'local',
      isLoading:     false,

      // ── Cloud Sync ──
      initCloudSync: () => {
        if (get().isLoading) return; // منع الاشتراك المزدوج
        set({ isLoading: true });
        const unsubscribe = learningService.subscribeToHub((data) => {
          set({ cloudSubjects: data, isLoading: false });
        });
        return unsubscribe;
      },

      setStorageMode: (mode) => set({ storageMode: mode }),

      // ── CRUD ──
      addItem: async (subjectId, section, item) => {
        const newItem: SectionItem = {
          ...(item as any),
          id: uid(),
          createdAt: new Date().toISOString(),
          source: get().storageMode,
        };
        if (get().storageMode === 'cloud') {
          await learningService.syncItem(subjectId, section, newItem);
        } else {
          set((state) => {
            const subj = { ...state.subjects[subjectId] };
            const arr  = [...(subj[section] as SectionItem[])];
            arr.push(newItem);
            (subj as any)[section] = arr;
            return { subjects: { ...state.subjects, [subjectId]: subj } };
          });
        }
      },

      editItem: async (subjectId, section, itemId, updates) => {
        const merged = get().getMergedSubject(subjectId);
        const item   = (merged[section] as SectionItem[]).find(i => i.id === itemId);
        if (!item) return;
        const updatedItem = { ...item, ...updates } as any;
        if (item.source === 'cloud') {
          await learningService.syncItem(subjectId, section, updatedItem);
        } else {
          set((state) => {
            const subj = { ...state.subjects[subjectId] };
            (subj as any)[section] = (subj[section] as SectionItem[]).map(i =>
              i.id === itemId ? updatedItem : i
            );
            return { subjects: { ...state.subjects, [subjectId]: subj } };
          });
        }
      },

      deleteItem: async (subjectId, section, itemId) => {
        const merged = get().getMergedSubject(subjectId);
        const item   = (merged[section] as SectionItem[]).find(i => i.id === itemId);
        if (!item) return;
        if (item.source === 'cloud') {
          await learningService.deleteItem(subjectId, section, itemId);
        } else {
          set((state) => {
            const subj = { ...state.subjects[subjectId] };
            (subj as any)[section] = (subj[section] as SectionItem[]).filter(i => i.id !== itemId);
            return { subjects: { ...state.subjects, [subjectId]: subj } };
          });
        }
      },

      uploadToCloud: async (subjectId, section, item) => {
        await learningService.syncItem(subjectId, section, { ...item, source: 'cloud' });
        set((state) => {
          const subj = { ...state.subjects[subjectId] };
          (subj as any)[section] = (subj[section] as SectionItem[]).filter(i => i.id !== item.id);
          return { subjects: { ...state.subjects, [subjectId]: subj } };
        });
      },

      // ── Assignment ──
      toggleAssignmentStatus: (subjectId, itemId) => {
        const merged     = get().getMergedSubject(subjectId);
        const assignment = merged.assignments.find(a => a.id === itemId);
        if (!assignment) return;
        const nextStatus: AssignmentStatus =
          assignment.status === 'pending'   ? 'submitted' :
          assignment.status === 'submitted' ? 'graded'    : 'pending';
        get().editItem(subjectId, 'assignments', itemId, { status: nextStatus });
      },

      // ── Schedule ──
      addScheduleEvent:    (event)         => set(s => ({ schedule: [...s.schedule, { ...event, id: uid() }] })),
      editScheduleEvent:   (id, updates)   => set(s => ({ schedule: s.schedule.map(e => e.id === id ? { ...e, ...updates } : e) })),
      deleteScheduleEvent: (id)            => set(s => ({ schedule: s.schedule.filter(e => e.id !== id) })),

      // ── Search ──
      setSearchQuery: (q) => set({ searchQuery: q }),

      // ── Computed ──
      getMergedSubject: (subjectId) => {
        const local = get().subjects[subjectId]      || makeEmptySubject();
        const cloud = get().cloudSubjects[subjectId] || makeEmptySubject();
        return {
          materials:     [...(local.materials     || []), ...(cloud.materials     || [])],
          recordings:    [...(local.recordings    || []), ...(cloud.recordings    || [])],
          assignments:   [...(local.assignments   || []), ...(cloud.assignments   || [])],
          quizzes:       [...(local.quizzes       || []), ...(cloud.quizzes       || [])],
          quizForms:     [...(local.quizForms     || []), ...(cloud.quizForms     || [])],
          questionBanks: [...(local.questionBanks || []), ...(cloud.questionBanks || [])],
        };
      },

      getProgress: (subjectId) => {
        const subj = get().getMergedSubject(subjectId);
        const completedAssignments = subj.assignments.filter(a => a.status === 'submitted' || a.status === 'graded').length;
        const completedQuizzes     = subj.quizzes.filter(q => q.completed).length;
        const total = subj.assignments.length + subj.quizzes.length;
        if (total === 0) return 0;
        return Math.round(((completedAssignments + completedQuizzes) / total) * 100);
      },

      getNextDeadline: () => {
        const { subjects, getMergedSubject } = get();
        const now = new Date();
        let nearest: { item: AssignmentItem | QuizItem; subjectId: SubjectId; date: Date } | null = null;
        for (const [sid] of Object.entries(subjects)) {
          const subj = getMergedSubject(sid as SubjectId);
          for (const a of subj.assignments) {
            if (a.status === 'pending') {
              const d = new Date(a.deadline);
              if (d > now && (!nearest || d < nearest.date)) nearest = { item: a, subjectId: sid as SubjectId, date: d };
            }
          }
          for (const q of subj.quizzes) {
            if (!q.completed) {
              const d = new Date(q.date);
              if (d > now && (!nearest || d < nearest.date)) nearest = { item: q, subjectId: sid as SubjectId, date: d };
            }
          }
        }
        return nearest ? { item: nearest.item, subjectId: nearest.subjectId } : null;
      },
    }),
    {
      name: 'nexus-learning-hub-v2',
      partialize: (state) => ({
        subjects:     state.subjects,
        schedule:     state.schedule,
        storageMode:  state.storageMode,
      }),
    }
  )
);
