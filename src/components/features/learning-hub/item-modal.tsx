'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SectionType, SECTION_LABELS } from './learning-hub-store';
import { Save, X } from 'lucide-react';

interface ItemModalProps {
  open: boolean;
  onClose: () => void;
  sectionType: SectionType;
  initialData?: any;
  onSave: (data: any) => void;
  mode: 'add' | 'edit';
}

const sectionFields: Record<SectionType, { key: string; label: string; type: string; required?: boolean; options?: { value: string; label: string }[] }[]> = {
  materials: [
    { key: 'title', label: 'العنوان', type: 'text', required: true },
    { key: 'description', label: 'الوصف', type: 'textarea' },
    { key: 'url', label: 'رابط الملف', type: 'url', required: true },
    { key: 'type', label: 'النوع', type: 'select', required: true, options: [{ value: 'pdf', label: 'PDF' }, { value: 'slide', label: 'عرض تقديمي' }, { value: 'link', label: 'رابط خارجي' }] },
  ],
  recordings: [
    { key: 'title', label: 'العنوان', type: 'text', required: true },
    { key: 'url', label: 'رابط الفيديو', type: 'url', required: true },
    { key: 'duration', label: 'المدة', type: 'text' },
  ],
  assignments: [
    { key: 'title', label: 'العنوان', type: 'text', required: true },
    { key: 'description', label: 'الوصف', type: 'textarea' },
    { key: 'deadline', label: 'الموعد النهائي', type: 'datetime-local', required: true },
    { key: 'status', label: 'الحالة', type: 'select', required: true, options: [{ value: 'pending', label: 'معلق' }, { value: 'submitted', label: 'تم التسليم' }, { value: 'graded', label: 'تم التقييم' }] },
  ],
  quizzes: [
    { key: 'title', label: 'العنوان', type: 'text', required: true },
    { key: 'date', label: 'التاريخ', type: 'datetime-local', required: true },
    { key: 'maxScore', label: 'الدرجة الكبرى', type: 'number', required: true },
    { key: 'score', label: 'الدرجة المحصلة', type: 'number' },
  ],
  quizForms: [
    { key: 'title', label: 'العنوان', type: 'text', required: true },
    { key: 'url', label: 'رابط النموذج', type: 'url', required: true },
    { key: 'provider', label: 'المزود', type: 'select', required: true, options: [{ value: 'google-forms', label: 'Google Forms' }, { value: 'internal', label: 'داخلي' }, { value: 'external', label: 'خارجي' }] },
    { key: 'status', label: 'الحالة', type: 'select', required: true, options: [{ value: 'not-taken', label: 'لم يُحل' }, { value: 'completed', label: 'تم الحل' }] },
  ],
  questionBanks: [
    { key: 'title', label: 'العنوان', type: 'text', required: true },
    { key: 'url', label: 'رابط الملف', type: 'url', required: true },
    { key: 'category', label: 'التصنيف', type: 'text', required: true },
    { key: 'pages', label: 'عدد الصفحات', type: 'number' },
  ],
};

export function ItemModal({ open, onClose, sectionType, initialData, onSave, mode }: ItemModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const fields = sectionFields[sectionType];

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      const defaults: Record<string, any> = {};
      fields.forEach((f) => {
        if (f.type === 'select' && f.options) defaults[f.key] = f.options[0].value;
        else if (f.type === 'number') defaults[f.key] = 0;
        else defaults[f.key] = '';
      });
      setFormData(defaults);
    }
  }, [initialData, open]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = { ...formData };
    if (cleaned.maxScore) cleaned.maxScore = Number(cleaned.maxScore);
    if (cleaned.score) cleaned.score = Number(cleaned.score);
    if (cleaned.pages) cleaned.pages = Number(cleaned.pages);
    if (sectionType === 'quizzes') {
      cleaned.completed = !!cleaned.score && cleaned.score > 0;
    }
    onSave(cleaned);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-2xl sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-lg font-bold">
            {mode === 'add' ? 'إضافة' : 'تعديل'} — {SECTION_LABELS[sectionType].label}
          </DialogTitle>
          <DialogDescription className="text-right text-muted-foreground text-sm">
            {mode === 'add' ? 'أدخل تفاصيل العنصر الجديد' : 'عدّل البيانات ثم اضغط حفظ'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </Label>

              {field.type === 'select' && field.options ? (
                <Select value={formData[field.key] || ''} onValueChange={(v) => handleChange(field.key, v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-right h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl min-h-[80px] text-right"
                  placeholder={field.label}
                />
              ) : (
                <Input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-right"
                  placeholder={field.label}
                  required={field.required}
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2">
              <Save className="size-4" />
              {mode === 'add' ? 'إضافة' : 'حفظ التعديلات'}
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
