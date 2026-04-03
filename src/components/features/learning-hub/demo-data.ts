import { SubjectId, SubjectData, ScheduleEvent } from './types';

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function makeEmptySubject(): SubjectData {
  return { materials: [], recordings: [], assignments: [], quizzes: [], quizForms: [], questionBanks: [] };
}

export function makeDemoData(): Record<SubjectId, SubjectData> {
  return {
    'data-center': makeEmptySubject(),
    'wireless-sensors': makeEmptySubject(),
    'software-architecture': makeEmptySubject(),
    'deep-learning': makeEmptySubject(),
    'embedded-rtos': makeEmptySubject(),
  };
}

export function makeDemoSchedule(): ScheduleEvent[] {
  return [
    // --- Data Center Virtualization ---
    { id: uid(), subjectId: 'data-center', day: 0, startHour: 9, endHour: 10, title: 'محاضرة: Data Center', location: 'Hall 7 (Building 7)' },
    { id: uid(), subjectId: 'data-center', day: 1, startHour: 10, endHour: 11, title: 'سكشن A1: Data Center', location: 'Lab 5 (105)' },
    { id: uid(), subjectId: 'data-center', day: 1, startHour: 12, endHour: 13, title: 'سكشن A3: Data Center', location: 'Lab 3 (412)' },
    { id: uid(), subjectId: 'data-center', day: 2, startHour: 11, endHour: 12, title: 'سكشن A4: Data Center', location: 'Lab 2 (102)' },
    { id: uid(), subjectId: 'data-center', day: 2, startHour: 12, endHour: 13, title: 'سكشن A2: Data Center', location: 'Lab 2 (102)' },

    // --- Embedded and Real Time Operating Systems ---
    { id: uid(), subjectId: 'embedded-rtos', day: 1, startHour: 9, endHour: 10, title: 'محاضرة: Embedded Systems', location: 'Hall 8 (Building 8)' },
    { id: uid(), subjectId: 'embedded-rtos', day: 2, startHour: 11, endHour: 12, title: 'سكشن A3: Embedded', location: 'Lab 6 (107)' },
    { id: uid(), subjectId: 'embedded-rtos', day: 2, startHour: 11, endHour: 12, title: 'سكشن A2: Embedded', location: 'Lab 5 (105)' },
    { id: uid(), subjectId: 'embedded-rtos', day: 2, startHour: 13, endHour: 14, title: 'سكشن A4: Embedded', location: 'Lab 3 (412)' },
    { id: uid(), subjectId: 'embedded-rtos', day: 2, startHour: 13, endHour: 14, title: 'سكشن A1: Embedded', location: 'Lab 6 (107)' },

    // --- Wireless Sensor Protocols ---
    { id: uid(), subjectId: 'wireless-sensors', day: 0, startHour: 10, endHour: 11, title: 'محاضرة: Wireless Sensors', location: 'Hall 7 (Building 7)' },
    { id: uid(), subjectId: 'wireless-sensors', day: 1, startHour: 10, endHour: 11, title: 'سكشن A4: Wireless', location: 'Lab 2 (102)' },
    { id: uid(), subjectId: 'wireless-sensors', day: 1, startHour: 13, endHour: 14, title: 'سكشن A2: Wireless', location: 'Lab 8 (306)' },
    { id: uid(), subjectId: 'wireless-sensors', day: 2, startHour: 9, endHour: 10, title: 'سكشن A1: Wireless', location: 'Lab 2 (102)' },
    { id: uid(), subjectId: 'wireless-sensors', day: 2, startHour: 13, endHour: 14, title: 'سكشن A3: Wireless', location: 'Lab 2 (102)' },

    // --- Deep Learning ---
    { id: uid(), subjectId: 'deep-learning', day: 1, startHour: 10, endHour: 11, title: 'محاضرة (1): Deep Learning', location: 'Hall 6 (Building 7)' },
    { id: uid(), subjectId: 'deep-learning', day: 1, startHour: 11, endHour: 12, title: 'محاضرة (2): Deep Learning', location: 'Hall 6 (Building 7)' },
    { id: uid(), subjectId: 'deep-learning', day: 1, startHour: 10, endHour: 11, title: 'سكشن A3: Deep Learning', location: 'Lab 6 (107)' },
    { id: uid(), subjectId: 'deep-learning', day: 1, startHour: 11, endHour: 12, title: 'سكشن A4: Deep Learning', location: 'Lab 6 (107)' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 9, endHour: 10, title: 'سكشن A2: Deep Learning', location: 'Lab 6 (107)' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 9, endHour: 10, title: 'سكشن A4: Deep Learning', location: 'Lab 5 (105)' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 11, endHour: 12, title: 'سكشن A1: Deep Learning', location: 'Lab 9 (307)' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 12, endHour: 13, title: 'سكشن A1: Deep Learning', location: 'Lab 9 (307)' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 13, endHour: 14, title: 'سكشن A2: Deep Learning', location: 'Lab 4 (414)' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 13, endHour: 14, title: 'سكشن A3: Deep Learning', location: 'Lab 7 (428)' },

    // --- Software Architecture ---
    { id: uid(), subjectId: 'software-architecture', day: 0, startHour: 12, endHour: 13, title: 'محاضرة: Software Arch', location: 'Hall 7 (Building 7)' },
    { id: uid(), subjectId: 'software-architecture', day: 2, startHour: 10, endHour: 11, title: 'سكشن A3: Software Arch', location: 'Lab 3 (103)' },
    { id: uid(), subjectId: 'software-architecture', day: 2, startHour: 11, endHour: 12, title: 'سكشن A1: Software Arch', location: 'Lab 3 (103)' },
    { id: uid(), subjectId: 'software-architecture', day: 2, startHour: 12, endHour: 13, title: 'سكشن A4: Software Arch', location: 'Lab 3 (103)' },
    { id: uid(), subjectId: 'software-architecture', day: 2, startHour: 13, endHour: 14, title: 'سكشن A2: Software Arch', location: 'Lab 3 (103)' },
  ];
}
