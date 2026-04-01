// ─────────────────────────────────────────────────────────────
// learning-hub-types.ts
// جميع الأنواع والثوابت الخاصة بمركز التعلم
// ─────────────────────────────────────────────────────────────

export type SubjectId =
  | 'data-center'
  | 'wireless-sensors'
  | 'software-architecture'
  | 'deep-learning'
  | 'embedded-rtos';

export type SectionType =
  | 'materials'
  | 'recordings'
  | 'assignments'
  | 'quizzes'
  | 'quizForms'
  | 'questionBanks';

export type AssignmentStatus = 'pending' | 'submitted' | 'graded';
export type QuizFormStatus = 'not-taken' | 'completed';

// ── Item Interfaces ──

export interface BaseItem {
  id: string;
  title: string;
  createdAt: string;
  source?: 'local' | 'cloud';
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

export type SectionItem =
  | MaterialItem
  | RecordingItem
  | AssignmentItem
  | QuizItem
  | QuizFormItem
  | QuestionBankItem;

// ── Subject & Schedule Interfaces ──

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

// ── Constants ──

export const SUBJECTS: SubjectMeta[] = [
  { id: 'data-center',          name: 'مركز البيانات',          nameEn: 'Data Center',         color: 'text-blue-400',    bgColor: 'bg-blue-500/10',    icon: '🖥️' },
  { id: 'wireless-sensors',     name: 'المستشعرات اللاسلكية',   nameEn: 'Wireless Sensors',    color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', icon: '📡' },
  { id: 'software-architecture',name: 'هندسة البرمجيات',        nameEn: 'Software Architecture',color: 'text-violet-400', bgColor: 'bg-violet-500/10',  icon: '🏗️' },
  { id: 'deep-learning',        name: 'التعلم العميق',           nameEn: 'Deep Learning',       color: 'text-orange-400',  bgColor: 'bg-orange-500/10',  icon: '🧠' },
  { id: 'embedded-rtos',        name: 'الأنظمة المدمجة و RTOS', nameEn: 'Embedded & RTOS',     color: 'text-cyan-400',    bgColor: 'bg-cyan-500/10',    icon: '⚙️' },
];

export const SECTION_LABELS: Record<SectionType, { label: string; labelEn: string }> = {
  materials:     { label: 'المواد',          labelEn: 'Materials' },
  recordings:    { label: 'التسجيلات',       labelEn: 'Recordings' },
  assignments:   { label: 'الواجبات',        labelEn: 'Assignments' },
  quizzes:       { label: 'الاختبارات',      labelEn: 'Quizzes' },
  quizForms:     { label: 'نماذج الاختبار',  labelEn: 'Quiz Forms' },
  questionBanks: { label: 'بنك الأسئلة',     labelEn: 'Question Banks' },
};

export const DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
