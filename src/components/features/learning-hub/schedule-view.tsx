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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CalendarDays, Plus, MapPin, Clock, Edit3, Trash2, Save, X } from 'lucide-react';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8AM to 8PM

const subjectColorMap: Record<SubjectId, { bg: string; border: string; text: string }> = {
  'data-center': { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300' },
  'wireless-sensors': { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-300' },
  'software-architecture': { bg: 'bg-violet-500/20', border: 'border-violet-500/30', text: 'text-violet-300' },
  'deep-learning': { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-300' },
  'embedded-rtos': { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-300' },
};

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

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setSubjectId(initialData.subjectId);
      setDay(initialData.day.toString());
      setStartHour(initialData.startHour.toString());
      setEndHour(initialData.endHour.toString());
      setLocation(initialData.location || '');
    } else {
      setTitle('');
      setSubjectId('data-center');
      setDay('0');
      setStartHour('8');
      setEndHour('10');
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
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-2xl w-[calc(100%-2rem)] max-w-md mx-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">
            {mode === 'add' ? 'إضافة حصة' : 'تعديل حصة'}
          </DialogTitle>
          <DialogDescription className="text-right text-sm text-muted-foreground">
            {mode === 'add' ? 'أدخل تفاصيل الحصة الجديدة' : 'عدّل البيانات ثم اضغط حفظ'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">العنوان <span className="text-red-400">*</span></Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-white/5 border-white/10 rounded-xl h-10 text-right" placeholder="مثال: محاضرة الشبكات" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">المادة</Label>
            <Select value={subjectId} onValueChange={(v) => setSubjectId(v as SubjectId)}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-10 text-right"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {SUBJECTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">اليوم</Label>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-10 text-right"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {DAYS.map((d, i) => (
                  <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">من الساعة</Label>
              <Select value={startHour} onValueChange={setStartHour}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-10 text-right"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">إلى الساعة</Label>
              <Select value={endHour} onValueChange={setEndHour}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-10 text-right"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">المكان</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-10 text-right" placeholder="مثال: قاعة 301" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2">
              <Save className="size-4" />
              {mode === 'add' ? 'إضافة' : 'حفظ'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="h-11 rounded-xl border-white/10 px-6">
              <X className="size-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ScheduleView() {
  const { schedule, addScheduleEvent, editScheduleEvent, deleteScheduleEvent } = useLearningHubStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  const handleSave = (data: any) => {
    if (editingEvent) {
      editScheduleEvent(editingEvent.id, data);
    } else {
      addScheduleEvent(data);
    }
    setEditingEvent(null);
  };

  const getEventsForCell = (day: number, hour: number) => {
    return schedule.filter((e) => e.day === day && e.startHour <= hour && e.endHour > hour);
  };

  const isEventStart = (event: ScheduleEvent, hour: number) => event.startHour === hour;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <CalendarDays className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">الجدول الأسبوعي</h2>
            <p className="text-[11px] text-muted-foreground">جدول المحاضرات والمعامل</p>
          </div>
        </div>
        <Button
          onClick={() => { setEditingEvent(null); setModalOpen(true); }}
          className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold gap-1.5"
        >
          <Plus className="size-4" />
          إضافة حصة
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {SUBJECTS.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <div className={cn('size-3 rounded-sm', subjectColorMap[s.id].bg, 'border', subjectColorMap[s.id].border)} />
            <span className="text-[10px] text-muted-foreground">{s.name}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="p-2 text-[10px] font-bold text-muted-foreground bg-white/5 border-b border-r border-white/10 w-16 sticky right-0 z-10">
                <Clock className="size-3 mx-auto" />
              </th>
              {DAYS.map((day, i) => (
                <th key={i} className="p-2.5 text-xs font-bold text-white bg-white/5 border-b border-r border-white/10 last:border-r-0">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="p-2 text-[10px] font-bold text-muted-foreground text-center bg-white/[0.02] border-b border-r border-white/5 sticky right-0 z-10 tabular-nums">
                  {hour}:00
                </td>
                {DAYS.map((_, dayIndex) => {
                  const events = getEventsForCell(dayIndex, hour);
                  const event = events[0];

                  if (event && !isEventStart(event, hour)) {
                    return null; // Covered by rowSpan
                  }

                  if (event && isEventStart(event, hour)) {
                    const span = event.endHour - event.startHour;
                    const colors = subjectColorMap[event.subjectId];
                    const subject = SUBJECTS.find((s) => s.id === event.subjectId);

                    return (
                      <td
                        key={dayIndex}
                        rowSpan={span}
                        className={cn(
                          'p-0 border-b border-r border-white/5 last:border-r-0 relative group'
                        )}
                      >
                        <div className={cn(
                          'absolute inset-0.5 rounded-xl p-2 flex flex-col justify-between border transition-all',
                          colors.bg, colors.border,
                          'hover:scale-[1.02] hover:shadow-lg cursor-pointer'
                        )}>
                          <div>
                            <p className={cn('text-[11px] font-bold truncate', colors.text)}>
                              {event.title}
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              {subject?.icon} {subject?.name}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-auto">
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="size-2.5 text-muted-foreground" />
                                <span className="text-[9px] text-muted-foreground">{event.location}</span>
                              </div>
                            )}
                            <span className="text-[9px] text-muted-foreground tabular-nums">
                              {event.startHour}:00 - {event.endHour}:00
                            </span>
                          </div>

                          {/* Hover Actions */}
                          <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon" variant="ghost"
                              className="size-6 rounded-lg bg-black/40 text-white hover:bg-black/60"
                              onClick={() => { setEditingEvent(event); setModalOpen(true); }}
                            >
                              <Edit3 className="size-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="size-6 rounded-lg bg-black/40 text-red-400 hover:bg-black/60">
                                  <Trash2 className="size-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-950 border-white/10 rounded-2xl w-[calc(100%-2rem)] max-w-md" dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>حذف الحصة</AlertDialogTitle>
                                  <AlertDialogDescription>هل أنت متأكد من حذف &quot;{event.title}&quot;؟</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-row-reverse gap-2">
                                  <AlertDialogAction onClick={() => deleteScheduleEvent(event.id)} className="bg-red-600 hover:bg-red-700 rounded-xl">حذف</AlertDialogAction>
                                  <AlertDialogCancel className="rounded-xl border-white/10">إلغاء</AlertDialogCancel>
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
                      className="border-b border-r border-white/5 last:border-r-0 h-12 hover:bg-white/[0.02] cursor-pointer transition-colors"
                      onClick={() => {
                        setEditingEvent(null);
                        setModalOpen(true);
                      }}
                    />
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
        mode={editingEvent ? 'edit' : 'add'}
      />
    </div>
  );
}
