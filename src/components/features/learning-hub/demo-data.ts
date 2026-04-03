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
    // ───── SATURDAY (Day 0) ─────
    { id: uid(), subjectId: 'data-center', day: 0, startHour: 9, endHour: 10, title: 'محاضرة: Data Center Virtualization', location: 'Hall 7 (435) - Bldg 7', staff: 'د. أحمد عبد الحميد', groupId: 'A' },
    { id: uid(), subjectId: 'wireless-sensors', day: 0, startHour: 10, endHour: 11, title: 'محاضرة: Wireless Sensor Protocols', location: 'Hall 7 (435) - Bldg 7', staff: 'د. أحمد عبد الحميد', groupId: 'A' },
    { id: uid(), subjectId: 'software-architecture', day: 0, startHour: 12, endHour: 13, title: 'محاضرة: Software Architecture', location: 'Hall 7 (435) - Bldg 7', staff: 'د. أحمد عبد الحميد', groupId: 'A' },

    // ───── SUNDAY (Day 1) ─────
    { id: uid(), subjectId: 'embedded-rtos', day: 1, startHour: 9, endHour: 10, title: 'محاضرة: Embedded Systems', location: '8 مدرج - Bldg 8 (419)', staff: 'م. محمد شريف', groupId: 'A' },
    { id: uid(), subjectId: 'deep-learning', day: 1, startHour: 10, endHour: 11, title: 'محاضرة: Deep Learning (1)', location: 'Hall 6 (314) - Bldg 7', staff: 'د. نهى العطار', groupId: 'A' },
    { id: uid(), subjectId: 'data-center', day: 1, startHour: 10, endHour: 11, title: 'سكشن: Data Center (Practical)', location: 'Lab 5 (105)', staff: 'م. مروة محمد يسرى', groupId: 'A1' },
    { id: uid(), subjectId: 'wireless-sensors', day: 1, startHour: 10, endHour: 11, title: 'سكشن: Wireless Sensors (Prac)', location: 'Lab 2 (102)', staff: 'م. هاجر عماد الدين', groupId: 'A4' },
    { id: uid(), subjectId: 'deep-learning', day: 1, startHour: 10, endHour: 11, title: 'سكشن: Deep Learning (Prac)', location: 'Lab 6 (107)', staff: 'م. مريم وديع', groupId: 'A3' },
    { id: uid(), subjectId: 'deep-learning', day: 1, startHour: 11, endHour: 12, title: 'محاضرة: Deep Learning (2)', location: 'Hall 6 (314) - Bldg 7', staff: 'د. نهى العطار', groupId: 'A' },
    { id: uid(), subjectId: 'deep-learning', day: 1, startHour: 11, endHour: 12, title: 'سكشن: Deep Learning (Prac)', location: 'Lab 6 (107)', staff: 'م. مريم وديع', groupId: 'A4' },
    { id: uid(), subjectId: 'data-center', day: 1, startHour: 12, endHour: 13, title: 'سكشن: Data Center (Practical)', location: 'Lab 3 (412)', staff: 'م. مروة محمد يسرى', groupId: 'A3' },
    { id: uid(), subjectId: 'wireless-sensors', day: 1, startHour: 13, endHour: 14, title: 'سكشن: Wireless Sensors (Prac)', location: 'Lab 8 (306)', staff: 'م. هاجر عماد الدين', groupId: 'A2' },

    // ───── MONDAY (Day 2) ─────
    { id: uid(), subjectId: 'wireless-sensors', day: 2, startHour: 9, endHour: 10, title: 'سكشن: Wireless Sensors (A1)', location: 'Lab 2 (102)', staff: 'م. هاجر عماد الدين', groupId: 'A1' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 9, endHour: 10, title: 'سكشن: Deep Learning (A2)', location: 'Lab 6 (107)', staff: 'م. مريم وديع', groupId: 'A2' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 9, endHour: 10, title: 'سكشن: Deep Learning (A4)', location: 'Lab 5 (105)', staff: 'م. هدير محمد شريف', groupId: 'A4' },
    { id: uid(), subjectId: 'software-architecture', day: 2, startHour: 10, endHour: 11, title: 'سكشن: Software Arch (A3)', location: 'Lab 3 (103)', staff: 'م. آية محمد إبراهيم', groupId: 'A3' },
    { id: uid(), subjectId: 'embedded-rtos', day: 2, startHour: 11, endHour: 12, title: 'سكشن: Embedded Systems (A3)', location: 'Lab 6 (107)', staff: 'م. علياء غانم على', groupId: 'A3' },
    { id: uid(), subjectId: 'embedded-rtos', day: 2, startHour: 11, endHour: 12, title: 'سكشن: Embedded Systems (A2)', location: 'Lab 5 (105)', staff: 'م. خالد محمد عبد العزيز', groupId: 'A2' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 11, endHour: 12, title: 'سكشن: Deep Learning (A1)', location: 'Lab 9 (307)', staff: 'م. هدير محمد شريف', groupId: 'A1' },
    { id: uid(), subjectId: 'software-architecture', day: 2, startHour: 11, endHour: 12, title: 'سكشن: Software Arch (A1)', location: 'Lab 3 (103)', staff: 'م. آية محمد إبراهيم', groupId: 'A1' },
    { id: uid(), subjectId: 'data-center', day: 2, startHour: 11, endHour: 12, title: 'سكشن: Data Center (A4)', location: 'Lab 2 (102)', staff: 'م. منار وسيد', groupId: 'A4' },
    { id: uid(), subjectId: 'data-center', day: 2, startHour: 12, endHour: 13, title: 'سكشن: Data Center (A2)', location: 'Lab 2 (102)', staff: 'م. منار وسيد', groupId: 'A2' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 12, endHour: 13, title: 'سكشن: Deep Learning (A1-extra)', location: 'Lab 9 (307)', staff: 'م. هدير محمد شريف', groupId: 'A1' },
    { id: uid(), subjectId: 'software-architecture', day: 2, startHour: 12, endHour: 13, title: 'سكشن: Software Arch (A4)', location: 'Lab 3 (103)', staff: 'م. آية محمد إبراهيم', groupId: 'A4' },
    { id: uid(), subjectId: 'embedded-rtos', day: 2, startHour: 13, endHour: 14, title: 'سكشن: Embedded Systems (A4)', location: 'Lab 3 (412)', staff: 'م. خالد محمد عبد العزيز', groupId: 'A4' },
    { id: uid(), subjectId: 'embedded-rtos', day: 2, startHour: 13, endHour: 14, title: 'سكشن: Embedded Systems (A1)', location: 'Lab 6 (107)', staff: 'م. علياء غانم على', groupId: 'A1' },
    { id: uid(), subjectId: 'wireless-sensors', day: 2, startHour: 13, endHour: 14, title: 'سكشن: Wireless Sensors (A3)', location: 'Lab 2 (102)', staff: 'م. هاجر عماد الدين', groupId: 'A3' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 13, endHour: 14, title: 'سكشن: Deep Learning (A2)', location: 'Lab 4 (414)', staff: 'م. هدير محمد شريف', groupId: 'A2' },
    { id: uid(), subjectId: 'deep-learning', day: 2, startHour: 13, endHour: 14, title: 'سكشن: Deep Learning (A3)', location: 'Lab 7 (428)', staff: 'م. مريم وديع', groupId: 'A3' },
    { id: uid(), subjectId: 'software-architecture', day: 2, startHour: 13, endHour: 14, title: 'سكشن: Software Arch (A2)', location: 'Lab 3 (103)', staff: 'م. آية محمد إبراهيم', groupId: 'A2' },
  ];
}
