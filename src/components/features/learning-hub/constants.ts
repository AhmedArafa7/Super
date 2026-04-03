import { SubjectMeta, SectionType } from './types';

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
