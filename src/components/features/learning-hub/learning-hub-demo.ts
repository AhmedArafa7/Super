// ─────────────────────────────────────────────────────────────
// learning-hub-demo.ts
// بيانات تجريبية للمواد الدراسية والجدول الأسبوعي
// ─────────────────────────────────────────────────────────────

import type {
  SubjectId, SubjectData, ScheduleEvent,
  MaterialItem, RecordingItem, AssignmentItem,
  QuizItem, QuizFormItem, QuestionBankItem,
} from './learning-hub-types';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function makeEmptySubject(): SubjectData {
  return { materials: [], recordings: [], assignments: [], quizzes: [], quizForms: [], questionBanks: [] };
}

export function makeDemoData(): Record<SubjectId, SubjectData> {
  return {
    'data-center': {
      materials: [
        { id: uid(), title: 'مقدمة في مراكز البيانات',  type: 'pdf',   url: '#', createdAt: new Date().toISOString(), description: 'ملف PDF شامل عن أساسيات مراكز البيانات' },
        { id: uid(), title: 'تصميم البنية التحتية',     type: 'slide', url: '#', createdAt: new Date().toISOString(), description: 'عرض تقديمي عن تصميم البنية التحتية' },
      ] as MaterialItem[],
      recordings: [
        { id: uid(), title: 'المحاضرة 1 - أساسيات الشبكات', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', createdAt: new Date().toISOString(), duration: '1:30:00' },
        { id: uid(), title: 'المحاضرة 2 - أنظمة التبريد',   url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', createdAt: new Date().toISOString(), duration: '45:00' },
      ] as RecordingItem[],
      assignments: [
        { id: uid(), title: 'تقرير عن تصميم مركز بيانات', status: 'pending',    deadline: '2026-04-15T23:59:00', createdAt: new Date().toISOString(), description: 'تصميم مركز بيانات صغير مع رسم توضيحي' },
        { id: uid(), title: 'تحليل أنظمة التبريد',         status: 'submitted',  deadline: '2026-04-05T23:59:00', createdAt: new Date().toISOString() },
      ] as AssignmentItem[],
      quizzes: [
        { id: uid(), title: 'اختبار الفصل الأول',   date: '2026-04-10T10:00:00', score: 85, maxScore: 100, completed: true,  createdAt: new Date().toISOString() },
        { id: uid(), title: 'اختبار منتصف الفصل',   date: '2026-04-20T10:00:00',            maxScore: 100, completed: false, createdAt: new Date().toISOString() },
      ] as QuizItem[],
      quizForms:     [{ id: uid(), title: 'نموذج اختبار الشبكات', url: 'https://forms.google.com', status: 'completed', provider: 'google-forms', createdAt: new Date().toISOString() }] as QuizFormItem[],
      questionBanks: [{ id: uid(), title: 'بنك أسئلة الفصل الأول', url: '#', category: 'الفصل الأول', pages: 25, createdAt: new Date().toISOString() }] as QuestionBankItem[],
    },
    'wireless-sensors': {
      materials:     [{ id: uid(), title: 'مقدمة في المستشعرات اللاسلكية', type: 'pdf', url: '#', createdAt: new Date().toISOString() }] as MaterialItem[],
      recordings:    [{ id: uid(), title: 'المحاضرة 1 - بروتوكولات الاتصال', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', createdAt: new Date().toISOString(), duration: '1:15:00' }] as RecordingItem[],
      assignments:   [{ id: uid(), title: 'مشروع شبكة مستشعرات', status: 'pending', deadline: '2026-04-18T23:59:00', createdAt: new Date().toISOString() }] as AssignmentItem[],
      quizzes:       [{ id: uid(), title: 'كويز أسبوعي 1', date: '2026-04-08T09:00:00', score: 90, maxScore: 100, completed: true, createdAt: new Date().toISOString() }] as QuizItem[],
      quizForms:     [],
      questionBanks: [{ id: uid(), title: 'بنك الأسئلة الشامل', url: '#', category: 'شامل', pages: 40, createdAt: new Date().toISOString() }] as QuestionBankItem[],
    },
    'software-architecture': {
      materials:     [
        { id: uid(), title: 'أنماط التصميم البرمجي', type: 'pdf',   url: '#', createdAt: new Date().toISOString() },
        { id: uid(), title: 'Clean Architecture',     type: 'slide', url: '#', createdAt: new Date().toISOString() },
      ] as MaterialItem[],
      recordings:    [],
      assignments:   [{ id: uid(), title: 'تطبيق SOLID Principles', status: 'graded', deadline: '2026-03-30T23:59:00', createdAt: new Date().toISOString(), grade: 95 }] as AssignmentItem[],
      quizzes:       [],
      quizForms:     [{ id: uid(), title: 'اختبار Design Patterns', url: 'https://forms.google.com', status: 'not-taken', provider: 'google-forms', createdAt: new Date().toISOString() }] as QuizFormItem[],
      questionBanks: [],
    },
    'deep-learning': {
      materials:     [{ id: uid(), title: 'مقدمة في الشبكات العصبية', type: 'pdf', url: '#', createdAt: new Date().toISOString() }] as MaterialItem[],
      recordings:    [{ id: uid(), title: 'Neural Networks Basics', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', createdAt: new Date().toISOString(), duration: '2:00:00' }] as RecordingItem[],
      assignments:   [{ id: uid(), title: 'تدريب نموذج CNN', status: 'pending', deadline: '2026-04-12T23:59:00', createdAt: new Date().toISOString() }] as AssignmentItem[],
      quizzes:       [{ id: uid(), title: 'Quiz - Backpropagation', date: '2026-04-14T10:00:00', maxScore: 50, completed: false, createdAt: new Date().toISOString() }] as QuizItem[],
      quizForms:     [],
      questionBanks: [],
    },
    'embedded-rtos': {
      materials:     [{ id: uid(), title: 'FreeRTOS Fundamentals', type: 'pdf', url: '#', createdAt: new Date().toISOString() }] as MaterialItem[],
      recordings:    [],
      assignments:   [{ id: uid(), title: 'مشروع FreeRTOS على STM32', status: 'pending', deadline: '2026-04-22T23:59:00', createdAt: new Date().toISOString() }] as AssignmentItem[],
      quizzes:       [],
      quizForms:     [],
      questionBanks: [{ id: uid(), title: 'أسئلة RTOS الشاملة', url: '#', category: 'RTOS', pages: 30, createdAt: new Date().toISOString() }] as QuestionBankItem[],
    },
  };
}

export function makeDemoSchedule(): ScheduleEvent[] {
  return [
    { id: uid(), subjectId: 'data-center',          day: 0, startHour: 8,  endHour: 10, title: 'محاضرة مراكز البيانات',   location: 'قاعة 301' },
    { id: uid(), subjectId: 'wireless-sensors',     day: 0, startHour: 12, endHour: 14, title: 'معمل المستشعرات',         location: 'المعمل 5' },
    { id: uid(), subjectId: 'software-architecture',day: 1, startHour: 10, endHour: 12, title: 'هندسة البرمجيات',         location: 'قاعة 205' },
    { id: uid(), subjectId: 'deep-learning',        day: 2, startHour: 8,  endHour: 10, title: 'التعلم العميق',            location: 'قاعة 102' },
    { id: uid(), subjectId: 'embedded-rtos',        day: 2, startHour: 14, endHour: 16, title: 'الأنظمة المدمجة',         location: 'المعمل 3' },
    { id: uid(), subjectId: 'data-center',          day: 3, startHour: 10, endHour: 12, title: 'سكشن مراكز البيانات',     location: 'قاعة 301' },
    { id: uid(), subjectId: 'deep-learning',        day: 4, startHour: 12, endHour: 14, title: 'معمل التعلم العميق',      location: 'المعمل 7' },
    { id: uid(), subjectId: 'embedded-rtos',        day: 5, startHour: 8,  endHour: 10, title: 'سكشن RTOS',               location: 'المعمل 3' },
  ];
}
