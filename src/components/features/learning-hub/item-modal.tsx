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
import { Save, X, Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { learningService } from '@/lib/learning-service';
import { Progress } from '@/components/ui/progress';

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
    { key: 'type', label: 'النوع', type: 'select', required: true, options: [{ value: 'pdf', label: 'PDF' }, { value: 'slide', label: 'عرض تقديمي' }, { value: 'link', label: 'رابط خارجي' }] },
    { key: 'url', label: 'رابط الملف (أو اتركه فارغاً للرفع)', type: 'url', required: false },
  ],
  recordings: [
    { key: 'title', label: 'العنوان', type: 'text', required: true },
    { key: 'url', label: 'رابط الفيديو (YouTube/Drive)', type: 'url', required: true },
    { key: 'duration', label: 'المدة (اختياري)', type: 'text' },
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
    { key: 'category', label: 'التصنيف (اختياري)', type: 'text', required: false },
    { key: 'pages', label: 'عدد الصفحات', type: 'number' },
    { key: 'url', label: 'رابط الملف (أو اتركه فارغاً للرفع)', type: 'url', required: false },
  ],
};

export function ItemModal({ open, onClose, sectionType, initialData, onSave, mode }: ItemModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fields = sectionFields[sectionType];

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
      setSelectedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
    } else {
      const defaults: Record<string, any> = {};
      fields.forEach((f) => {
        if (f.type === 'select' && f.options) defaults[f.key] = f.options[0].value;
        else if (f.type === 'number') defaults[f.key] = 0;
        else defaults[f.key] = '';
      });
      setFormData(defaults);
      setSelectedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [initialData, open, sectionType]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // تحديث العنوان تلقائياً إذا كان فارغاً
      if (!formData.title || formData.title === 'عنصر جديد') {
        handleChange('title', file.name.split('.')[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...formData };
    
    // 1. التعامل مع الرفع الحقيقي إذا وجد ملف
    if (selectedFile) {
      setIsUploading(true);
      try {
        const downloadUrl = await learningService.uploadFile(selectedFile, (prog) => {
          setUploadProgress(prog);
        });
        finalData.url = downloadUrl;
      } catch (error) {
        console.error("Upload failed", error);
        alert("فشل رفع الملف. يرجى المحاولة لاحقاً.");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // 2. تنقية البيانات النهائية
    if (!finalData.title) finalData.title = 'عنصر جديد';
    const needsUrl = ['materials', 'recordings', 'quizForms', 'questionBanks'].includes(sectionType);
    if (needsUrl && (!finalData.url || finalData.url.trim() === '')) {
      finalData.url = '#';
    }
    
    if (sectionType === 'assignments' && !finalData.deadline) 
      finalData.deadline = new Date().toISOString().slice(0, 16);
    if (sectionType === 'quizzes' && !finalData.date) 
      finalData.date = new Date().toISOString().slice(0, 16);
    
    if (finalData.maxScore) finalData.maxScore = Number(finalData.maxScore);
    if (finalData.score) finalData.score = Number(finalData.score);
    if (finalData.pages) finalData.pages = Number(finalData.pages);
    
    if (sectionType === 'quizzes') {
      finalData.completed = !!finalData.score && finalData.score > 0;
    }
    
    onSave(finalData);
    onClose();
  };

  const showFileDrop = ['materials', 'questionBanks'].includes(sectionType) && mode === 'add';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] sm:max-w-xl p-8" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-2xl font-bold text-white">
            {mode === 'add' ? 'إضافة' : 'تعديل'} — {SECTION_LABELS[sectionType].label}
          </DialogTitle>
          <DialogDescription className="text-right text-muted-foreground text-sm">
            {mode === 'add' ? 'أدخل تفاصيل موردك الجديد لبناء نكسوس الخاصة بك.' : 'عدّل البيانات ثم اضغط حفظ للتحديث.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* منطقة رفع الملف تظهر فقط في الحالات المناسبة */}
          {showFileDrop && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">رفع المصدر الأصلي</Label>
              <div 
                className={cn(
                  "relative h-32 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden",
                  selectedFile ? "border-primary bg-primary/5" : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={handleFileChange}
                  accept={sectionType === 'materials' ? ".pdf,.doc,.docx,.ppt,.pptx,image/*" : ".pdf"}
                  disabled={isUploading}
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <CheckCircle2 className="size-10 text-primary mb-2" />
                    <span className="text-xs font-bold text-white max-w-[200px] truncate">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Upload className="size-8 mb-2" />
                    <span className="text-xs font-bold">اسحب ملفاتك أو اضغط هنا</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key} className={cn("space-y-1.5", field.type === 'textarea' && "md:col-span-2")}>
                <Label className="text-xs font-bold text-muted-foreground">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </Label>

                {field.type === 'select' && field.options ? (
                  <Select value={formData[field.key] || ''} onValueChange={(v) => handleChange(field.key, v)} disabled={isUploading}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-right h-12 rounded-2xl focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 rounded-xl">
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-right">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'textarea' ? (
                  <Textarea
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="bg-white/5 border-white/10 rounded-2xl min-h-[100px] text-right focus:ring-primary/20"
                    placeholder={field.label}
                    disabled={isUploading}
                    dir="auto"
                  />
                ) : (
                  <Input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="bg-white/5 border-white/10 rounded-2xl h-12 text-right focus:ring-primary/20"
                    placeholder={field.label}
                    required={field.required && !selectedFile}
                    disabled={isUploading}
                    dir="auto"
                  />
                )}
              </div>
            ))}
          </div>

          {/* حالة الرفع (Progress) */}
          {isUploading && (
            <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between text-[10px] font-bold text-primary px-1">
                <span>{Math.round(uploadProgress)}%</span>
                <span>جارِ النقل العصبي لـ {selectedFile?.name}</span>
              </div>
              <Progress value={uploadProgress} className="h-2 bg-white/5" />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1 h-14 rounded-3xl bg-primary hover:bg-primary/90 font-bold text-lg shadow-lg shadow-primary/20 gap-3"
              disabled={isUploading || (!formData.title && !selectedFile)}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  جارِ الرفع...
                </>
              ) : (
                <>
                  <Save className="size-5" />
                  {mode === 'add' ? 'إضافة المورد' : 'حفظ التحديثات'}
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="h-14 rounded-3xl border-white/10 px-8 hover:bg-white/5 transition-colors"
              disabled={isUploading}
            >
              <X className="size-5" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
