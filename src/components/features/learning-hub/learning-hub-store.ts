'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ───── Types ─────

export type SubjectId = 'data-center' | 'wireless-sensors' | 'software-architecture' | 'deep-learning' | 'embedded-rtos';

export type SectionType = 'materials' | 'recordings' | 'assignments' | 'quizzes' | 'quizForms' | 'questionBanks';

export type AssignmentStatus = 'pending' | 'submitted' | 'graded';
export type QuizFormStatus = 'not-taken' | 'completed';

export interface BaseItem {
  id: string;
  title: string;
  createdAt: string;
}

export interface MaterialItem extends BaseItem {
  type: 'pdf' | 'slide' | 'link';
  url: string;
  description?: string;
}

export interface RecordingItem extends BaseItem {
  url: string;
  duration?: string;
  thumbnail?: string;
}

export interface AssignmentItem extends BaseItem {
  status: AssignmentStatus;
  deadline: string;
  description?: string;
  fileName?: string;
  grade?: number;
}

export interface QuizItem extends BaseItem {
  date: string;
  score?: number;
  maxScore: number;
  completed: boolean;
}

export interface QuizFormItem extends BaseItem {
  url: string;
  status: QuizFormStatus;
  provider: 'google-forms' | 'internal' | 'external';
}

export interface QuestionBankItem extends BaseItem {
  url: string;
  category: string;
  pages?: number;
}

export type SectionItem = MaterialItem | RecordingItem | AssignmentItem | QuizItem | QuizFormItem | QuestionBankItem;

export interface SubjectData {
  materials: MaterialItem[];
  recordings: RecordingItem[];
  assignments: AssignmentItem[];
  quizzes: QuizItem[];
  quizForms: QuizFormItem[];
  questionBanks: QuestionBankItem[];
}

export interface ScheduleEvent {
  id: string;
  subjectId: SubjectId;
  day: number; // 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu
  startHour: number;
  endHour: number;
  title: string;
  location?: string;
}

export interface SubjectMeta {
  id: SubjectId;
  name: string;
  nameEn: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const SUBJECTS: SubjectMeta[] = [
  { id: 'data-center', name: 'مركز البيانات', nameEn: 'Data Center', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: '🖥️' },
  { id: 'wireless-sensors', name: 'المستشعرات اللاسلكية', nameEn: 'Wireless Sensors', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', icon: '📡' },
  { id: 'software-architecture', name: 'هندسة البرمجيات', nameEn: 'Software Architecture', color: 'text-violet-400', bgColor: 'bg-violet-500/10', icon: '🏗️' },
  { id: 'deep-learning', name: 'التعلم العميق', nameEn: 'Deep Learning', color: 'text-orange-400', bgColor: 'bg-orange-500/10', icon: '🧠' },
  { id: 'embedded-rtos', name: 'الأنظمة المدمجة و RTOS', nameEn: 'Embedded & RTOS', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', icon: '⚙️' },
];

export const SECTION_LABELS: Record<SectionType, { label: string; labelEn: string }> = {
  materials: { label: 'المواد', labelEn: 'Materials' },
  recordings: { label: 'التسجيلات', labelEn: 'Recordings' },
  assignments: { label: 'الواجبات', labelEn: 'Assignments' },
  quizzes: { label: 'الاختبارات', labelEn: 'Quizzes' },
  quizForms: { label: 'نماذج الاختبار', labelEn: 'Quiz Forms' },
  questionBanks: { label: 'بنك الأسئلة', labelEn: 'Question Banks' },
};

export const DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

// ───── Helper ─────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function makeEmptySubject(): SubjectData {
  return { materials: [], recordings: [], assignments: [], quizzes: [], quizForms: [], questionBanks: [] };
}

// ───── Demo Data ─────

function makeDemoData(): Record<SubjectId, SubjectData> {
  return {
    'data-center': {
      materials: [
        { id: uid(), title: 'مقدمة في مراكز البيانات', type: 'pdf', url: '#', createdAt: new Date().toISOString(), description: 'ملف PDF شامل عن أساسيات مراكز البيانات' },
        { id: uid(), title: 'تصميم البنية التحتية', type: 'slide', url: '#', createdAt: new Date().toISOString(), description: 'عرض تقديمي عن تصميم البنية التحتية' },
      ],
      recordings: [
        { id: uid(), title: 'المحاضرة 1 - أساسيات الشبكات', url: '#', createdAt: new Date().toISOString(), duration: '1:30:00' },
        { id: uid(), title: 'المحاضرة 2 - أنظمة التبريد', url: '#', createdAt: new Date().toISOString(), duration: '45:00' },
      ],
      assignments: [
        { id: uid(), title: 'تقرير عن تصميم مركز بيانات', status: 'pending', deadline: '2026-04-15T23:59:00', createdAt: new Date().toISOString(), description: 'تصميم مركز بيانات صغير مع رسم توضيحي' },
        { id: uid(), title: 'تحليل أنظمة التبريد', status: 'pending', deadline: '2026-04-05T23:59:00', createdAt: new Date().toISOString() },
      ],
      quizzes: [
        { id: uid(), title: 'اختبار الفصل الأول', date: '2026-04-10T10:00:00', maxScore: 100, completed: false, createdAt: new Date().toISOString() },
        { id: uid(), title: 'اختبار منتصف الفصل', date: '2026-04-20T10:00:00', maxScore: 100, completed: false, createdAt: new Date().toISOString() },
      ],
      quizForms: [
        { id: uid(), title: 'نموذج اختبار الشبكات', url: '#', status: 'not-taken', provider: 'google-forms', createdAt: new Date().toISOString() },
      ],
      questionBanks: [
        { id: uid(), title: 'بنك أسئلة الفصل الأول', url: '#', category: 'الفصل الأول', pages: 25, createdAt: new Date().toISOString() },
      ],
    },
    'wireless-sensors': {
      materials: [
        { id: uid(), title: 'مقدمة في المستشعرات اللاسلكية', type: 'pdf', url: '#', createdAt: new Date().toISOString() },
      ],
      recordings: [
        { id: uid(), title: 'المحاضرة 1 - بروتوكولات الاتصال', url: '#', createdAt: new Date().toISOString(), duration: '1:15:00' },
      ],
      assignments: [
        { id: uid(), title: 'مشروع شبكة مستشعرات', status: 'pending', deadline: '2026-04-18T23:59:00', createdAt: new Date().toISOString() },
      ],
      quizzes: [
        { id: uid(), title: 'كويز أسبوعي 1', date: '2026-04-08T09:00:00', maxScore: 100, completed: false, createdAt: new Date().toISOString() },
      ],
      quizForms: [],
      questionBanks: [
        { id: uid(), title: 'بنك الأسئلة الشامل', url: '#', category: 'شامل', pages: 40, createdAt: new Date().toISOString() },
      ],
    },
    'software-architecture': {
      materials: [
        { id: uid(), title: 'أنماط التصميم البرمجي', type: 'pdf', url: '#', createdAt: new Date().toISOString() },
        { id: uid(), title: 'Clean Architecture', type: 'slide', url: '#', createdAt: new Date().toISOString() },
      ],
      recordings: [],
      assignments: [
        { id: uid(), title: 'تطبيق SOLID Principles', status: 'pending', deadline: '2026-04-30T23:59:00', createdAt: new Date().toISOString() },
      ],
      quizzes: [],
      quizForms: [
        { id: uid(), title: 'اختبار Design Patterns', url: '#', status: 'not-taken', provider: 'google-forms', createdAt: new Date().toISOString() },
      ],
      questionBanks: [],
    },
    'deep-learning': {
      materials: [
        { id: uid(), title: 'مقدمة في الشبكات العصبية', type: 'pdf', url: '#', createdAt: new Date().toISOString() },
      ],
      recordings: [
        { id: uid(), title: 'Neural Networks Basics', url: '#', createdAt: new Date().toISOString(), duration: '2:00:00' },
      ],
      assignments: [],
      quizzes: [
        { id: uid(), title: 'Quiz - Backpropagation', date: '2026-04-14T10:00:00', maxScore: 50, completed: false, createdAt: new Date().toISOString() },
      ],
      quizForms: [],
      questionBanks: [],
    },
    'embedded-rtos': {
      materials: [
        { id: uid(), title: 'FreeRTOS Fundamentals', type: 'pdf', url: '#', createdAt: new Date().toISOString() },
      ],
      recordings: [],
      assignments: [
        { id: uid(), title: 'مشروع FreeRTOS على STM32', status: 'pending', deadline: '2026-04-22T23:59:00', createdAt: new Date().toISOString() },
      ],
      quizzes: [],
      quizForms: [],
      questionBanks: [
        { id: uid(), title: 'أسئلة RTOS الشاملة', url: '#', category: 'RTOS', pages: 30, createdAt: new Date().toISOString() },
      ],
    },
  };
}

function makeDemoSchedule(): ScheduleEvent[] {
  return [
    { id: uid(), subjectId: 'data-center', day: 0, startHour: 8, endHour: 10, title: 'محاضرة مراكز البيانات', location: 'قاعة 301' },
    { id: uid(), subjectId: 'wireless-sensors', day: 0, startHour: 12, endHour: 14, title: 'معمل المستشعرات', location: 'المعمل 5' },
    { id: uid(), subjectId: 'software-architecture', day: 1, startHour: 10, endHour: 12, title: 'هندسة البرمجيات', location: 'قاعة 205' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 8, endHour: 10, title: 'التعلم العميق', location: 'قاعة 102' },
    { id: uid(), subjectId: 'embedded-rtos', day: 2, startHour: 14, endHour: 16, title: 'الأنظمة المدمجة', location: 'المعمل 3' },
    { id: uid(), subjectId: 'data-center', day: 3, startHour: 10, endHour: 12, title: 'سكشن مراكز البيانات', location: 'قاعة 301' },
    { id: uid(), subjectId: 'deep-learning', day: 4, startHour: 12, endHour: 14, title: 'معمل التعلم العميق', location: 'المعمل 7' },
    { id: uid(), subjectId: 'embedded-rtos', day: 5, startHour: 8, endHour: 10, title: 'سكشن RTOS', location: 'المعمل 3' },
  ];
}

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

  // Hybrid Storage (Restored)
  storageMode: 'local' | 'cloud';
  isLoading: boolean;
  setStorageMode: (mode: 'local' | 'cloud') => void;
  initCloudSync: () => Promise<void>;
}

export const useLearningHubStore = create<LearningHubState>()(
  persist(
    (set, get) => ({
      subjects: makeDemoData(),
      schedule: makeDemoSchedule(),
      searchQuery: '',

      addItem: (subjectId, section, item) => {
        set((state) => {
          const subj = { ...state.subjects[subjectId] };
          const arr = [...(subj[section] as any[])];
          arr.push({ ...item, id: uid(), createdAt: new Date().toISOString() });
          subj[section] = arr as any;
          return { subjects: { ...state.subjects, [subjectId]: subj } };
        });
      },

      editItem: (subjectId, section, itemId, updates) => {
        set((state) => {
          const subj = { ...state.subjects[subjectId] };
          const arr = (subj[section] as any[]).map((item: any) =>
            item.id === itemId ? { ...item, ...updates } : item
          );
          subj[section] = arr as any;
          return { subjects: { ...state.subjects, [subjectId]: subj } };
        });
      },

      deleteItem: (subjectId, section, itemId) => {
        set((state) => {
          const subj = { ...state.subjects[subjectId] };
          const arr = (subj[section] as any[]).filter((item: any) => item.id !== itemId);
          subj[section] = arr as any;
          return { subjects: { ...state.subjects, [subjectId]: subj } };
        });
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

      // Hybrid Storage Implementation (Restored)
      storageMode: 'local',
      isLoading: false,
      setStorageMode: (mode) => set({ storageMode: mode }),
      initCloudSync: async () => {
        set({ isLoading: true });
        // Simulate cloud sync initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        set({ isLoading: false });
      },
    }),
    {
      name: 'nexus-learning-hub-v3', // Force reset to clear potential corrupt state from merge
    }
  )
);
