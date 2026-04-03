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
    // --- Saturday (Day 0) ---
    { id: uid(), subjectId: 'data-center', day: 0, startHour: 9, endHour: 10, title: 'محاضرة: Data Center Virtualization', location: 'Hall 7 (435) - Bldg 7 (د. أحمد عبد الحميد)' },
    { id: uid(), subjectId: 'software-architecture', day: 0, startHour: 10, endHour: 11, title: 'محاضرة: Software Architecture', location: 'Hall 7 (435) - Bldg 7 (د. أحمد جمال)' },
    { id: uid(), subjectId: 'deep-learning', day: 0, startHour: 12, endHour: 13, title: 'محاضرة (1): Deep Learning', location: 'Hall 7 (435) - Bldg 7 (د. شيماء الزيات)' },
    { id: uid(), subjectId: 'deep-learning', day: 0, startHour: 13, endHour: 14, title: 'محاضرة (2): Deep Learning', location: 'Hall 7 (435) - Bldg 7 (د. شيماء الزيات)' },

    // --- Sunday (Day 1) ---
    { id: uid(), subjectId: 'deep-learning', day: 1, startHour: 8, endHour: 9, title: 'معمل: Deep Learning (A3/A4)', location: 'Lab 5/6 (د. شيريهان / م. مروة)' },
    { id: uid(), subjectId: 'deep-learning', day: 1, startHour: 9, endHour: 10, title: 'معمل: Deep Learning (A3/A4)', location: 'Lab 5/6 (د. شيريهان / م. مروة)' },
    { id: uid(), subjectId: 'data-center', day: 1, startHour: 10, endHour: 11, title: 'سكشن: Data Center (A1)', location: 'Lab 5 (105) - (م. مروة)' },
    { id: uid(), subjectId: 'data-center', day: 1, startHour: 12, endHour: 13, title: 'سكشن: Data Center (A3/A4)', location: 'Lab 3/5 - (م. عمرو / م. مروة)' },

    // --- Monday (Day 2) ---
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 8, endHour: 9, title: 'معمل: Deep Learning (A1/A2)', location: 'Lab 4/7 - (م. عمرو / م. محمد خالد)' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 9, endHour: 10, title: 'معمل: Deep Learning (A1/A2)', location: 'Lab 4/7 - (م. عمرو / م. محمد خالد)' },
    { id: uid(), subjectId: 'data-center', day: 2, startHour: 10, endHour: 11, title: 'سكشن: Data Center (A2)', location: 'Lab 3 (412) - (م. عمرو)' },
    { id: uid(), subjectId: 'embedded-rtos', day: 2, startHour: 11, endHour: 12, title: 'محاضرة: Embedded Systems', location: 'Hall 7 (435) - Bldg 7 (د. أحمد عبد الحميد)' },
    { id: uid(), subjectId: 'software-architecture', day: 2, startHour: 12, endHour: 13, title: 'سكشن: Software Architecture (A1)', location: 'Lab 3 (103) - (م. مصطفى)' },
    { id: uid(), subjectId: 'software-architecture', day: 2, startHour: 13, endHour: 14, title: 'سكشن: Software Architecture (A3)', location: 'Lab 3 (103) - (م. مصطفى)' },

    // --- Tuesday (Day 3) ---
    { id: uid(), subjectId: 'embedded-rtos', day: 3, startHour: 9, endHour: 10, title: 'سكشن: Embedded Systems (A2/A3)', location: 'Lab 5/6 - (د. شيريهان / م. مروة)' },
    { id: uid(), subjectId: 'embedded-rtos', day: 3, startHour: 12, endHour: 13, title: 'سكشن: Embedded Systems (A1/A4)', location: 'Lab 3/6 - (م. عمرو / د. شيريهان)' },

    // --- Wednesday (Day 4) ---
    { id: uid(), subjectId: 'wireless-sensors', day: 4, startHour: 9, endHour: 10, title: 'محاضرة: Wireless Sensors', location: 'Hall 7 (435) - Bldg 7 (د. أحمد عبد الحميد)' },
    { id: uid(), subjectId: 'software-architecture', day: 4, startHour: 10, endHour: 11, title: 'سكشن: Software Architecture (A4)', location: 'Lab 3 (103) - (م. مصطفى)' },
    { id: uid(), subjectId: 'software-architecture', day: 4, startHour: 11, endHour: 12, title: 'سكشن: Software Architecture (A2)', location: 'Lab 3 (103) - (م. مصطفى)' },

    // --- Thursday (Day 5) ---
    { id: uid(), subjectId: 'wireless-sensors', day: 5, startHour: 9, endHour: 10, title: 'سكشن: Wireless Sensors (A1)', location: 'Lab 2 (102) - (م. مصطفى)' },
    { id: uid(), subjectId: 'wireless-sensors', day: 5, startHour: 11, endHour: 12, title: 'سكشن: Wireless Sensors (A2)', location: 'Lab 8 (306) - (م. مصطفى)' },
    { id: uid(), subjectId: 'wireless-sensors', day: 5, startHour: 12, endHour: 13, title: 'سكشن: Wireless Sensors (A4)', location: 'Lab 2 (102) - (م. مصطفى)' },
    { id: uid(), subjectId: 'wireless-sensors', day: 5, startHour: 13, endHour: 14, title: 'سكشن: Wireless Sensors (A3)', location: 'Lab 2 (102) - (م. مصطفى)' },
  ];
}
