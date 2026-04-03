'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { learningService } from '@/lib/learning-service';

// Import from modular files
import { 
  SubjectId, 
  SectionType, 
  SubjectData, 
  ScheduleEvent, 
  AssignmentItem, 
  QuizItem, 
  AssignmentStatus 
} from './types';
import { makeDemoData, makeDemoSchedule, uid } from './demo-data';

// Re-export everything for backward compatibility
export * from './types';
export * from './constants';
export * from './demo-data';

// ───── Store Interface ─────

interface LearningHubState {
  subjects: Record<SubjectId, SubjectData>;
  schedule: ScheduleEvent[];
  searchQuery: string;

  // CRUD
  addItem: (subjectId: SubjectId, section: SectionType, item: any) => void;
  editItem: (subjectId: SubjectId, section: SectionType, itemId: string, updates: Partial<any>) => void;
  deleteItem: (subjectId: SubjectId, section: SectionType, itemId: string) => void;

  // Assignment status
  toggleAssignmentStatus: (subjectId: SubjectId, itemId: string) => void;

  // Schedule
  addScheduleEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
  editScheduleEvent: (id: string, updates: Partial<ScheduleEvent>) => void;
  deleteScheduleEvent: (id: string) => void;

  // Search
  setSearchQuery: (q: string) => void;

  // Progress
  getProgress: (subjectId: SubjectId) => number;

  // Deadline
  getNextDeadline: () => { item: AssignmentItem | QuizItem; subjectId: SubjectId } | null;

  // Hybrid Storage (Real Firestore Sync)
  storageMode: 'local' | 'cloud';
  isLoading: boolean;
  setStorageMode: (mode: 'local' | 'cloud') => void;
  initCloudSync: () => Promise<void>;
  _unsubscribe?: () => void;
}

export const useLearningHubStore = create<LearningHubState>()(
  persist(
    (set, get) => ({
      subjects: makeDemoData(),
      schedule: makeDemoSchedule(),
      searchQuery: '',

      addItem: (subjectId, section, item) => {
        const id = uid();
        const newItem = { ...item, id, createdAt: new Date().toISOString() };
        
        set((state) => {
          const subj = { ...state.subjects[subjectId] };
          const arr = [...(subj[section] as any[])];
          arr.push(newItem);
          subj[section] = arr as any;
          return { subjects: { ...state.subjects, [subjectId]: subj } };
        });

        // Cloud Sync
        const { storageMode } = get();
        if (storageMode === 'cloud') {
          learningService.syncItem(subjectId, section, newItem).catch(console.error);
        }
      },

      editItem: (subjectId, section, itemId, updates) => {
        let updatedItem: any = null;
        set((state) => {
          const subj = { ...state.subjects[subjectId] };
          const arr = (subj[section] as any[]).map((item: any) => {
            if (item.id === itemId) {
              updatedItem = { ...item, ...updates };
              return updatedItem;
            }
            return item;
          });
          subj[section] = arr as any;
          return { subjects: { ...state.subjects, [subjectId]: subj } };
        });

        // Cloud Sync
        const { storageMode } = get();
        if (storageMode === 'cloud' && updatedItem) {
          learningService.syncItem(subjectId, section, updatedItem).catch(console.error);
        }
      },

      deleteItem: (subjectId, section, itemId) => {
        set((state) => {
          const subj = { ...state.subjects[subjectId] };
          const arr = (subj[section] as any[]).filter((item: any) => item.id !== itemId);
          subj[section] = arr as any;
          return { subjects: { ...state.subjects, [subjectId]: subj } };
        });

        // Cloud Sync
        const { storageMode } = get();
        if (storageMode === 'cloud') {
          learningService.deleteItem(subjectId, section, itemId).catch(console.error);
        }
      },

      toggleAssignmentStatus: (subjectId, itemId) => {
        set((state) => {
          const subj = { ...state.subjects[subjectId] };
          subj.assignments = subj.assignments.map((a) => {
            if (a.id !== itemId) return a;
            const nextStatus: AssignmentStatus = a.status === 'pending' ? 'submitted' : a.status === 'submitted' ? 'graded' : 'pending';
            return { ...a, status: nextStatus };
          });
          return { subjects: { ...state.subjects, [subjectId]: subj } };
        });
      },

      addScheduleEvent: (event) => {
        set((state) => ({
          schedule: [...state.schedule, { ...event, id: uid() }],
        }));
      },

      editScheduleEvent: (id, updates) => {
        set((state) => ({
          schedule: state.schedule.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }));
      },

      deleteScheduleEvent: (id) => {
        set((state) => ({
          schedule: state.schedule.filter((e) => e.id !== id),
        }));
      },

      setSearchQuery: (q) => set({ searchQuery: q }),

      getProgress: (subjectId) => {
        const subj = get().subjects[subjectId];
        const totalAssignments = subj.assignments.length;
        const completedAssignments = subj.assignments.filter((a) => a.status === 'submitted' || a.status === 'graded').length;
        const totalQuizzes = subj.quizzes.length;
        const completedQuizzes = subj.quizzes.filter((q) => q.completed).length;
        const total = totalAssignments + totalQuizzes;
        if (total === 0) return 0;
        return Math.round(((completedAssignments + completedQuizzes) / total) * 100);
      },

      getNextDeadline: () => {
        const { subjects } = get();
        const now = new Date();
        let nearest: { item: AssignmentItem | QuizItem; subjectId: SubjectId; date: Date } | null = null;

        for (const [sid, subj] of Object.entries(subjects)) {
          for (const a of subj.assignments) {
            if (a.status === 'pending') {
              const d = new Date(a.deadline);
              if (d > now && (!nearest || d < nearest.date)) {
                nearest = { item: a, subjectId: sid as SubjectId, date: d };
              }
            }
          }
          for (const q of subj.quizzes) {
            if (!q.completed) {
              const d = new Date(q.date);
              if (d > now && (!nearest || d < nearest.date)) {
                nearest = { item: q, subjectId: sid as SubjectId, date: d };
              }
            }
          }
        }
        return nearest ? { item: nearest.item, subjectId: nearest.subjectId } : null;
      },

      // Hybrid Storage Implementation (Real Firestore Sync)
      storageMode: 'local',
      isLoading: false,
      setStorageMode: (mode) => {
        set({ storageMode: mode });
        if (mode === 'cloud') {
          get().initCloudSync();
        } else {
          // Cleanup subscription when leaving cloud mode
          const state = get();
          if (state._unsubscribe) {
            state._unsubscribe();
            set({ _unsubscribe: undefined });
          }
        }
      },
      initCloudSync: async () => {
        const { storageMode, _unsubscribe } = get();
        if (storageMode !== 'cloud') return;

        set({ isLoading: true });

        try {
          // 1. Fetch initial snapshot
          const cloudData = await learningService.getCloudHub();
          if (cloudData) {
            set((state) => {
              const newSubjects = { ...state.subjects };
              for (const [subjId, cloudSubjData] of Object.entries(cloudData)) {
                const sId = subjId as SubjectId;
                newSubjects[sId] = {
                  materials: cloudSubjData.materials || [],
                  recordings: cloudSubjData.recordings || [],
                  assignments: cloudSubjData.assignments || [],
                  quizzes: cloudSubjData.quizzes || [],
                  quizForms: cloudSubjData.quizForms || [],
                  questionBanks: cloudSubjData.questionBanks || [],
                };
              }
              return { subjects: newSubjects };
            });
          }

          // 2. Setup real-time listener if not already active
          if (!_unsubscribe) {
            const unsub = learningService.subscribeToHub((updatedData) => {
              set((state) => {
                const newSubjects = { ...state.subjects };
                for (const [subjId, cloudSubjData] of Object.entries(updatedData)) {
                  const sId = subjId as SubjectId;
                  newSubjects[sId] = {
                    materials: cloudSubjData.materials || [],
                    recordings: cloudSubjData.recordings || [],
                    assignments: cloudSubjData.assignments || [],
                    quizzes: cloudSubjData.quizzes || [],
                    quizForms: cloudSubjData.quizForms || [],
                    questionBanks: cloudSubjData.questionBanks || [],
                  };
                }
                return { subjects: newSubjects };
              });
              console.log('[Cloud Hub] Synchronized in real-time.');
            });
            set({ _unsubscribe: unsub });
          }
        } catch (error) {
          console.error('[Cloud Sync] Failed to initialize:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'nexus-learning-hub-v3', 
    }
  )
);
