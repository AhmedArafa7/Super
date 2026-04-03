export type SubjectId = 'data-center' | 'wireless-sensors' | 'software-architecture' | 'deep-learning' | 'embedded-rtos';

export type SectionType = 'materials' | 'recordings' | 'assignments' | 'quizzes' | 'quizForms' | 'questionBanks';

export type AssignmentStatus = 'pending' | 'submitted' | 'graded';
export type QuizFormStatus = 'not-taken' | 'completed';

export interface BaseItem {
  id: string;
  title: string;
  createdAt: string;
  url?: string;
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
  staff?: string;
  groupId?: string; // e.g. 'A', 'A1', 'A2', 'A3', 'A4'
}

export interface SubjectMeta {
  id: SubjectId;
  name: string;
  nameEn: string;
  color: string;
  bgColor: string;
  icon: string;
}
