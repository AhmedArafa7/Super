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
import { Save, X, FileUp, CheckCircle2, Loader2, Cloud, Database } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { learningService } from '@/lib/learning-service';
import { useToast } from '@/hooks/use-toast';

interface ItemModalProps {
  open: boolean;
  onClose: () => void;
  sectionType: SectionType;
  initialData?: any;
  onSave: (data: any, syncToCloud: boolean) => void;
  mode: 'add' | 'edit';
}

const sectionFields: Record<SectionType, { key: string; label: string; type: string; required?: boolean; options?: { value: string; label: string }[] }[]> = {
  materials: [
    { key: 'title', label: 'العنوان', type: 'text', required: false },
    { key: 'description', label: 'الوصف', type: 'textarea' },
    { key: 'type', label: 'النوع', type: 'select', required: false, options: [{ value: 'pdf', label: 'PDF' }, { value: 'slide', label: 'عرض تقديمي' }, { value: 'link', label: 'رابط خارجي' }] },
  ],
  recordings: [
    { key: 'title', label: 'العنوان', type: 'text', required: false },
    { key: 'duration', label: 'المدة', type: 'text' },
  ],
  assignments: [
    { key: 'title', label: 'العنوان', type: 'text', required: false },
    { key: 'description', label: 'الوصف', type: 'textarea' },
    { key: 'deadline', label: 'الموعد النهائي', type: 'datetime-local', required: false },
    { key: 'status', label: 'الحالة', type: 'select', required: false, options: [{ value: 'pending', label: 'معلق' }, { value: 'submitted', label: 'تم التسليم' }, { value: 'graded', label: 'تم التقييم' }] },
  ],
  quizzes: [
    { key: 'title', label: 'العنوان', type: 'text', required: false },
    { key: 'date', label: 'التاريخ', type: 'datetime-local', required: false },
    { key: 'maxScore', label: 'الدرجة الكبرى', type: 'number', required: false },
    { key: 'score', label: 'الدرجة المحصلة', type: 'number' },
  ],
  quizForms: [
    { key: 'title', label: 'العنوان', type: 'text', required: false },
    { key: 'provider', label: 'المزود', type: 'select', required: false, options: [{ value: 'google-forms', label: 'Google Forms' }, { value: 'internal', label: 'داخلي' }, { value: 'external', label: 'خارجي' }] },
    { key: 'status', label: 'الحالة', type: 'select', required: false, options: [{ value: 'not-taken', label: 'لم يُحل' }, { value: 'completed', label: 'تم الحل' }] },
  ],
  questionBanks: [
    { key: 'title', label: 'العنوان', type: 'text', required: false },
    { key: 'category', label: 'التصنيف', type: 'text', required: false },
    { key: 'pages', label: 'عدد الصفحات', type: 'number' },
  ],
};

export function ItemModal({ open, onClose, sectionType, initialData, onSave, mode }: ItemModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCloudShared, setIsCloudShared] = useState(true);
  
  const fields = sectionFields[sectionType] || [];
  const sectionLabel = SECTION_LABELS[sectionType]?.label || 'عنصر';

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
      setSelectedFile(null);
      setUploadProgress(0);
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
    }
  }, [initialData, open, sectionType, fields]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title || formData.title === 'عنصر جديد' || formData.title === '') {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
        handleChange('title', nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    let finalData = { ...formData };
    
    try {
      if (selectedFile && isCloudShared) {
        toast({ title: "جاري الرفع العصبي...", description: "نرفع ملفك لسحابة نكسوس المشتركة." });
        const downloadUrl = await learningService.uploadFile(selectedFile, (progress) => {
          setUploadProgress(progress);
        });
        finalData.url = downloadUrl;
      }

      if (!finalData.title) finalData.title = 'عنصر جديد';
      
      const needsUrl = ['materials', 'recordings', 'quizForms', 'questionBanks'].includes(sectionType);
      if (needsUrl && (!finalData.url || finalData.url.trim() === '')) {
        finalData.url = '#';
      }
      
      if (sectionType === 'assignments' && !finalData.deadline) finalData.deadline = new Date().toISOString().slice(0, 16);
      if (sectionType === 'quizzes' && !finalData.date) finalData.date = new Date().toISOString().slice(0, 16);
      
      if (finalData.maxScore) finalData.maxScore = Number(finalData.maxScore);
      else if (sectionType === 'quizzes') finalData.maxScore = 100;
      
      if (finalData.score) finalData.score = Number(finalData.score);
      if (finalData.pages) finalData.pages = Number(finalData.pages);
      
      if (sectionType === 'quizzes') {
        finalData.completed = !!finalData.score && finalData.score > 0;
      }
      
      onSave(finalData, isCloudShared);
      onClose();
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "فشل الرفع", 
        description: error.message || "حدث خطأ غير متوقع أثناء معالجة الملف." 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const showFileDrop = ['materials', 'questionBanks', 'recordings'].includes(sectionType) && mode === 'add';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-2xl w-[calc(100%-2rem)] max-w-lg mx-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-lg font-bold">
            {mode === 'add' ? 'إضافة' : 'تعديل'} — {sectionLabel}
          </DialogTitle>
          <DialogDescription className="text-right text-muted-foreground text-sm">
            {mode === 'add' ? 'أدخل تفاصيل موردك الجديد لبناء نكسوس الخاصة بك.' : 'عدّل البيانات ثم اضغط حفظ للتحديث.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {mode === 'add' && (
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="flex items-center gap-3">
                <div className={cn("size-10 rounded-xl flex items-center justify-center", isCloudShared ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground")}>
                  {isCloudShared ? <Cloud className="size-5" /> : <Database className="size-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">مشاركة مع سحابة نكسوس</p>
                  <p className="text-[10px] text-muted-foreground">تظهر للزملاء في الوضع السحابي</p>
                </div>
              </div>
              <Switch 
                checked={isCloudShared} 
                onCheckedChange={setIsCloudShared} 
                disabled={isUploading}
              />
            </div>
          )}

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
                  accept={
                    sectionType === 'recordings' 
                      ? "video/*,audio/*" 
                      : sectionType === 'materials' 
                        ? ".pdf,.doc,.docx,.ppt,.pptx,image/*" 
                        : ".pdf"
                  }
                  disabled={isUploading}
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <CheckCircle2 className="size-8 text-primary animate-in zoom-in duration-300" />
                    <p className="text-xs font-bold text-white truncate max-w-full px-4">{selectedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">جاهز للمزامنة</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileUp className="size-8 text-white/20" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">اسحب الملف أو اضغط هنا</p>
                  </div>
                )}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 space-y-4">
                    <Loader2 className="size-8 text-primary animate-spin" />
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300 ease-out" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-white tracking-widest uppercase animate-pulse">
                      جاري الحقن بالسحابة... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </Label>

              {field.type === 'select' && field.options ? (
                <Select value={formData[field.key] || ''} onValueChange={(v) => handleChange(field.key, v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-right h-11 rounded-xl">
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
                  className="bg-white/5 border-white/10 rounded-xl h-11 text-right"
                  placeholder={field.label}
                  required={field.required}
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Button 
                type="submit" 
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2 text-sm"
                disabled={isUploading}
            >
              <Save className="size-4" />
              {mode === 'add' ? 'إضافة المورد' : 'حفظ التعديلات'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="h-12 rounded-xl border-white/10 px-6" disabled={isUploading}>
              <X className="size-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
