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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CalendarDays, Plus, MapPin, Clock, Edit3, Trash2, Save, X, Hash } from 'lucide-react';
import { FeatureHeader } from '@/components/ui/feature-header';
import { GlassCard } from '@/components/ui/glass-card';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8AM to 8PM

const subjectColorMap: Record<SubjectId, { bg: string; border: string; text: string; shadow: string }> = {
  'data-center': { bg: 'bg-blue-500/20', border: 'border-blue-400/30', text: 'text-blue-300', shadow: 'shadow-blue-500/10' },
  'wireless-sensors': { bg: 'bg-emerald-500/20', border: 'border-emerald-400/30', text: 'text-emerald-300', shadow: 'shadow-emerald-500/10' },
  'software-architecture': { bg: 'bg-violet-500/20', border: 'border-violet-400/30', text: 'text-violet-300', shadow: 'shadow-violet-500/10' },
  'deep-learning': { bg: 'bg-orange-500/20', border: 'border-orange-400/30', text: 'text-orange-300', shadow: 'shadow-orange-500/10' },
  'embedded-rtos': { bg: 'bg-cyan-500/20', border: 'border-cyan-400/30', text: 'text-cyan-300', shadow: 'shadow-cyan-500/10' },
};

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: ScheduleEvent | null;
  onSave: (data: Omit<ScheduleEvent, 'id'> | Partial<ScheduleEvent>) => void;
  mode: 'add' | 'edit';
}

/**
 * [STABILITY_ANCHOR: SCHEDULE_MODAL_V2.0_MERGED]
 * نافذة إضافة/تعديل المواعيد الدراسية — Nexus V2
 */
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
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-10 text-right sm:max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)]" dir="rtl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black text-white text-right">
            {mode === 'add' ? 'إضافة موعد دراسي' : 'تحديث بيانات الحصة'}
          </DialogTitle>
          <DialogDescription className="text-right text-sm text-muted-foreground mt-2 leading-relaxed">
            {mode === 'add' ? 'قم بإدخال تفاصيل الموعد الأكاديمي الجديد في قاعدة البيانات.' : 'يمكنك تعديل المربعات أدناه لتحديث تفاصيل الجدول الموحد.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">العنوان الأكاديمي</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
              className="bg-white/5 border-white/10 rounded-2xl h-14 text-right focus:ring-primary/40 text-base" 
              placeholder="مثال: محاضرة النمذجة الرياضية" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">المادة العلمية</Label>
              <Select value={subjectId} onValueChange={(v) => setSubjectId(v as SubjectId)}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-14 text-right flex-row-reverse"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/10 text-white">
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">يوم الحصة</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-14 text-right flex-row-reverse"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/10 text-white">
                  {DAYS.map((d, i) => (
                    <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">وقت البدء</Label>
              <Select value={startHour} onValueChange={setStartHour}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-14 text-right flex-row-reverse"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/10 text-white">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">وقت الانتهاء</Label>
              <Select value={endHour} onValueChange={setEndHour}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-14 text-right flex-row-reverse"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/10 text-white">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h.toString()}>{h}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">موقع الحصة (فيزيائي/رقمي)</Label>
            <Input 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              className="bg-white/5 border-white/10 rounded-2xl h-14 text-right focus:ring-primary/40" 
              placeholder="مثال: قاعة 305 أو رابط Zoom" 
            />
          </div>

          <DialogFooter className="pt-6">
            <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 gap-3 transition-all active:scale-95">
              <Save className="size-6" />
              {mode === 'add' ? 'تأكيد الإضافة للسجل' : 'حفظ التغييرات النهائية'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * [STABILITY_ANCHOR: SCHEDULE_VIEW_V2.0_MERGED]
 * عرض الجدول الأسبوعي المتكامل — Nexus V2
 */
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000" dir="rtl">
      {/* Premium V2 Header */}
      <FeatureHeader 
        title="الجدول الأكاديمي الموحد"
        description="تتبع وإدارة مواعيد المحاضرات والمعامل في بيئة Nexus المركزية."
        Icon={CalendarDays}
        iconClassName="text-amber-400"
        action={
          <Button
            onClick={() => { setEditingEvent(null); setModalOpen(true); }}
            className="h-12 px-8 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 shadow-2xl font-black gap-3 transition-all active:scale-95"
          >
            <Plus className="size-5" />
            حصة جديدة
          </Button>
        }
      />

      {/* Grid Meta Information */}
      <div className="flex items-center justify-between flex-wrap gap-6 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-6 flex-wrap">
          {SUBJECTS.map((s) => (
            <div key={s.id} className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <div className={cn('size-3 rounded-full', subjectColorMap[s.id].bg, 'shadow-[0_0_10px_rgba(255,255,255,0.1)]')} />
              <span className="text-[10px] font-black text-white/60 tracking-widest uppercase">{s.nameEn}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground/40 font-mono text-[10px]">
           <Hash className="size-3" /> NODE_SYNC_ID: {Date.now().toString(36).toUpperCase()}
        </div>
      </div>

      {/* Modern Calendar Grid */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-2xl backdrop-blur-3xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className="p-6 text-[10px] font-black text-muted-foreground border-b border-l border-white/5 w-24 sticky right-0 z-20 bg-slate-900/90 backdrop-blur-xl">
                  <Clock className="size-4 mx-auto text-primary" />
                </th>
                {DAYS.map((day, i) => (
                  <th key={i} className="p-6 text-xs font-black text-white border-b border-l border-white/5 last:border-l-0 tracking-[0.1em]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour} className="group/row">
                  <td className="p-4 text-[11px] font-black text-muted-foreground text-center border-b border-l border-white/5 sticky right-0 z-20 bg-slate-900/40 backdrop-blur-xl tabular-nums group-hover/row:text-white transition-colors">
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
                          className="p-1.5 border-b border-l border-white/5 last:border-l-0 relative group/cell"
                        >
                          <GlassCard
                            variant="borderless"
                            noPadding
                            onClick={() => { setEditingEvent(event); setModalOpen(true); }}
                            className={cn(
                              'h-full p-4 flex flex-col justify-between border cursor-pointer transition-all duration-500 overflow-hidden',
                              colors.bg, colors.border, colors.shadow,
                              'hover:scale-[0.98] group-hover/cell:opacity-100 hover:brightness-110 active:scale-95'
                            )}
                          >
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-2">
                                <p className={cn('text-xs font-black leading-tight', colors.text)}>
                                  {event.title}
                                </p>
                                <div className="p-1 rounded-lg bg-black/20 text-white/40 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                   <Edit3 className="size-3" />
                                </div>
                              </div>
                              <p className="text-[10px] font-bold text-white/50 flex items-center gap-1.5">
                                <span className="opacity-70">{subject?.icon}</span> {subject?.nameEn}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-6 relative z-10">
                              {event.location && (
                                <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
                                  <MapPin className="size-2.5 text-primary" />
                                  <span className="text-[9px] font-black text-primary/80 uppercase tracking-tighter truncate max-w-[80px]">{event.location}</span>
                                </div>
                              )}
                              <span className="text-[9px] font-black text-white/30 tabular-nums">
                                {event.startHour}:00 - {event.endHour}:00
                              </span>
                            </div>
                            
                            {/* Decorative Glow */}
                            <div className="absolute -bottom-10 -right-10 size-24 bg-white/10 blur-[40px] opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                          </GlassCard>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={dayIndex}
                        className="border-b border-l border-white/5 last:border-l-0 h-20 hover:bg-white/[0.01] cursor-pointer transition-colors relative"
                        onClick={() => {
                          setEditingEvent(null);
                          setModalOpen(true);
                        }}
                      >
                         <div className="absolute inset-0 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Plus className="size-4 text-white/10" />
                         </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
