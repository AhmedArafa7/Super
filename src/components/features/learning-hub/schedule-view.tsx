'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  useLearningHubStore, SUBJECTS, DAYS, ScheduleEvent, SubjectId,
} from './learning-hub-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CalendarDays, Plus, MapPin, Clock, Edit3, Trash2, Save, X, User } from 'lucide-react';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8AM to 8PM

const subjectColorMap: Record<SubjectId, { bg: string; border: string; text: string }> = {
  'data-center': { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300' },
  'wireless-sensors': { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-300' },
  'software-architecture': { bg: 'bg-violet-500/20', border: 'border-violet-500/30', text: 'text-violet-300' },
  'deep-learning': { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-300' },
  'embedded-rtos': { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-300' },
};

const GROUPS = ['A1', 'A2', 'A3', 'A4', 'All'];

export function ScheduleView() {
  const { 
    schedule, 
    addScheduleEvent, 
    editScheduleEvent, 
    deleteScheduleEvent,
    selectedGroup,
    setSelectedGroup
  } = useLearningHubStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  const handleSave = (data: any) => {
    if (editingEvent?.id) {
      editScheduleEvent(editingEvent.id, data);
    } else {
      addScheduleEvent(data);
    }
    setEditingEvent(null);
  };

  const getEventsForCell = (day: number, hour: number) => {
    const filtered = schedule.filter(e => {
        if (selectedGroup === 'All') return true;
        return e.groupId === 'A' || e.groupId === selectedGroup;
    });
    return filtered.filter((e) => e.day === day && e.startHour <= hour && e.endHour > hour);
  };

  const isEventStart = (event: ScheduleEvent, hour: number) => event.startHour === hour;
  const ACTIVE_DAYS = DAYS.slice(0, 3); // Saturday, Sunday, Monday

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Group Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <CalendarDays className="size-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">الجدول الأكاديمي</h2>
            <p className="text-xs text-muted-foreground">تتبع المجموعات والمحاضرات الفنية</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                selectedGroup === g 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              {g === 'All' ? 'عرض الكل' : `Group ${g}`}
            </button>
          ))}
        </div>

        <Button
          onClick={() => { setEditingEvent(null); setModalOpen(true); }}
          className="h-11 rounded-2xl bg-primary hover:bg-primary/90 text-sm font-bold gap-2 px-6 shadow-xl shadow-primary/10"
        >
          <Plus className="size-5" />
          إضافة حصة
        </Button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-md">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="p-4 text-[10px] font-black text-slate-500 bg-white/5 border-b border-l border-white/5 w-20 sticky right-0 z-20">
                <div className="flex flex-col items-center gap-1 opacity-40">
                    <Clock className="size-4" />
                    <span>TIME</span>
                </div>
              </th>
              {ACTIVE_DAYS.map((day, i) => (
                <th key={i} className="p-4 text-sm font-black text-slate-200 bg-white/5 border-b border-l border-white/5 last:border-l-0">
                  <div className="flex items-center justify-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {day}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour} className="group/row">
                <td className="p-4 text-xs font-black text-slate-400 text-center bg-white/[0.01] border-b border-l border-white/5 sticky right-0 z-10 tabular-nums">
                  {hour < 10 ? `0${hour}` : hour}:00
                </td>
                {ACTIVE_DAYS.map((_, dayIndex) => {
                  const events = getEventsForCell(dayIndex, hour);
                  const event = events[0];

                  if (event && !isEventStart(event, hour)) {
                    return null;
                  }

                  if (event && isEventStart(event, hour)) {
                    const span = event.endHour - event.startHour;
                    const colors = subjectColorMap[event.subjectId];
                    const subject = SUBJECTS.find((s) => s.id === event.subjectId);

                    return (
                      <td
                        key={dayIndex}
                        rowSpan={span}
                        className="p-1 border-b border-l border-white/5 relative group/cell"
                      >
                        <div className={cn(
                          'absolute inset-1 rounded-2xl p-3 flex flex-col justify-between border transition-all duration-300',
                          colors.bg, colors.border,
                          'hover:scale-[1.01] hover:shadow-2xl hover:z-30 cursor-pointer overflow-hidden'
                        )}
                        onClick={() => { setEditingEvent(event); setModalOpen(true); }}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <p className={cn('text-[11px] font-black leading-tight', colors.text)}>
                                    {event.title}
                                </p>
                                <div className={cn(
                                    "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter",
                                    event.groupId === 'A' ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-white/50"
                                )}>
                                    {event.groupId === 'A' ? 'Lecture' : event.groupId}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {subject?.icon} {subject?.name}
                                </span>
                            </div>
                            
                            {/* Doctor Name - Prominent */}
                            {event.staff && (
                                <div className="flex items-center gap-1.5 mt-1 bg-white/5 rounded-lg px-2 py-1 w-fit group-hover/cell:bg-white/10 transition-colors">
                                    <User className="size-3 text-primary animate-pulse" />
                                    <span className="text-[9px] text-primary/90 font-black truncate max-w-[120px]">
                                        {event.staff}
                                    </span>
                                </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-white/10">
                            {event.location && (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <MapPin className="size-3 text-slate-500 shrink-0" />
                                <span className="text-[9px] text-slate-400 truncate">{event.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Clock className="size-3 text-slate-500 shrink-0" />
                                <span className="text-[10px] text-slate-300 font-bold tabular-nums">
                                    {event.startHour}:00 - {event.endHour}:00
                                </span>
                            </div>
                          </div>
                          
                          {/* Fast Actions */}
                          <div className="absolute top-1 left-1 opacity-0 group-hover/cell:opacity-100 transition-opacity flex gap-1">
                             <button className="p-1 text-slate-400 hover:text-white" onClick={e => { e.stopPropagation(); setEditingEvent(event); setModalOpen(true); }}>
                                <Edit3 className="size-3" />
                             </button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button className="p-1 text-red-500/60 hover:text-red-400" onClick={e => e.stopPropagation()}>
                                        <Trash2 className="size-3" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-slate-950 border-white/10 rounded-2xl w-[calc(100%-2rem)] max-w-md" dir="rtl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>حذف من الجدول</AlertDialogTitle>
                                        <AlertDialogDescription>سيتم حذف "{event.title}" نهائياً.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-row-reverse gap-2">
                                        <AlertDialogAction onClick={() => deleteScheduleEvent(event.id)} className="bg-red-600 rounded-xl">حذف</AlertDialogAction>
                                        <AlertDialogCancel className="rounded-xl border-white/10 text-white">إلغاء</AlertDialogCancel>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                             </AlertDialog>
                          </div>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={dayIndex}
                      className="border-b border-l border-white/5 h-24 hover:bg-white/[0.03] transition-colors relative"
                      onClick={() => {
                        setEditingEvent({ id: '', subjectId: 'data-center', day: dayIndex, startHour: hour, endHour: hour + 1, title: '', groupId: selectedGroup === 'All' ? 'A' : selectedGroup });
                        setModalOpen(true);
                      }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/row:opacity-10 group-hover/cell:opacity-100 transition-opacity">
                            <Plus className="size-4 text-white" />
                        </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ScheduleModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEvent(null); }}
        initialData={editingEvent}
        onSave={handleSave}
        mode={editingEvent?.id ? 'edit' : 'add'}
      />
    </div>
  );
}

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: ScheduleEvent | null;
  onSave: (data: Omit<ScheduleEvent, 'id'> | Partial<ScheduleEvent>) => void;
  mode: 'add' | 'edit';
}

function ScheduleModal({ open, onClose, initialData, onSave, mode }: ScheduleModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [subjectId, setSubjectId] = useState<SubjectId>(initialData?.subjectId || 'data-center');
  const [day, setDay] = useState(initialData?.day?.toString() || '0');
  const [startHour, setStartHour] = useState(initialData?.startHour?.toString() || '8');
  const [endHour, setEndHour] = useState(initialData?.endHour?.toString() || '10');
  const [location, setLocation] = useState(initialData?.location || '');
  const [staff, setStaff] = useState(initialData?.staff || '');
  const [groupId, setGroupId] = useState(initialData?.groupId || 'A');

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSubjectId(initialData.subjectId || 'data-center');
      setDay(initialData.day?.toString() || '0');
      setStartHour(initialData.startHour?.toString() || '8');
      setEndHour(initialData.endHour?.toString() || '10');
      setLocation(initialData.location || '');
      setStaff(initialData.staff || '');
      setGroupId(initialData.groupId || 'A');
    } else {
        setTitle('');
        setStaff('');
        setLocation('');
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      subjectId,
      day: parseInt(day),
      startHour: parseInt(startHour),
      endHour: parseInt(endHour),
      location: location || undefined,
      staff: staff || undefined,
      groupId
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-3xl w-[calc(100%-2rem)] max-w-md mx-auto overflow-hidden" dir="rtl">
        <DialogHeader className="p-2">
          <DialogTitle className="text-right text-xl font-black">
            {mode === 'add' ? 'إضافة حصة جديدة' : 'تعديل بيانات الحصة'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">المادة</Label>
                <Select value={subjectId} onValueChange={(v) => setSubjectId(v as SubjectId)}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-11 text-right"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                    {SUBJECTS.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="rounded-xl">{s.icon} {s.name}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">المجموعة (Group)</Label>
                <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-11 text-right"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                    <SelectItem value="A" className="rounded-xl font-bold text-amber-300">A (Lecture)</SelectItem>
                    <SelectItem value="A1" className="rounded-xl">A1</SelectItem>
                    <SelectItem value="A2" className="rounded-xl">A2</SelectItem>
                    <SelectItem value="A3" className="rounded-xl">A3</SelectItem>
                    <SelectItem value="A4" className="rounded-xl">A4</SelectItem>
                </SelectContent>
                </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">العنوان</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-white/5 border-white/10 rounded-2xl h-11 text-right" placeholder="اسم السكشن أو المحاضرة" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">أستاذ المادة / الدكتور</Label>
            <div className="relative">
                <Input value={staff} onChange={(e) => setStaff(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-11 text-right pr-9" placeholder="د. فلان / م. فلان" />
                <User className="absolute right-3 top-3.5 size-4 text-slate-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">اليوم</Label>
                <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-11 text-right"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                    {DAYS.slice(0, 3).map((d, i) => (
                    <SelectItem key={i} value={i.toString()} className="rounded-xl">{d}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">المكان</Label>
                <div className="relative">
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-11 text-right pr-9" placeholder="قاعة / معمل" />
                    <MapPin className="absolute right-3 top-3.5 size-4 text-slate-500" />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">من الساعة</Label>
              <Select value={startHour} onValueChange={setStartHour}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-11 text-right tabular-nums"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h.toString()} className="tabular-nums">{h < 10 ? `0${h}` : h}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">إلى الساعة</Label>
              <Select value={endHour} onValueChange={setEndHour}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-11 text-right tabular-nums"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h.toString()} className="tabular-nums">{h < 10 ? `0${h}` : h}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="submit" className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 font-black gap-2 text-white">
              <Save className="size-5" />
              {mode === 'add' ? 'إضافة للجدول' : 'حفظ التعديلات'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="h-12 rounded-2xl border-white/10 px-6">
              <X className="size-5 text-slate-400" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
