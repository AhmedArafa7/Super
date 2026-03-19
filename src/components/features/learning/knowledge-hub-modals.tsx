'use client';

import React from 'react';
import { Cloud, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { LearningItemType } from '@/lib/learning-store';

// ─── Subject Modal ───

interface SubjectModalProps {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  value: { title: string; description: string };
  onChange: (v: { title: string; description: string }) => void;
  onSubmit: () => void;
}

export function SubjectModal({ isOpen, onOpenChange, value, onChange, onSubmit }: SubjectModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right">
        <DialogHeader>
          <DialogTitle className="text-right">إنشاء مجلد رئيسي</DialogTitle>
          <DialogDescription className="text-right text-xs">اقتراحك سيخضع للمراجعة الإدارية لضمان جودة المحتوى.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2"><Label>العنوان</Label><Input dir="auto" className="bg-white/5 border-white/10 text-right h-12" value={value.title} onChange={e => onChange({ ...value, title: e.target.value })} /></div>
          <div className="grid gap-2"><Label>الوصف</Label><Textarea dir="auto" className="bg-white/5 border-white/10 text-right" value={value.description} onChange={e => onChange({ ...value, description: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={onSubmit} className="w-full bg-primary h-12 rounded-xl font-bold">إرسال الاقتراح</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Collection Modal ───

interface CollectionModalProps {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  value: { title: string; description: string };
  onChange: (v: { title: string; description: string }) => void;
  onSubmit: () => void;
}

export function CollectionModal({ isOpen, onOpenChange, value, onChange, onSubmit }: CollectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right">
        <DialogHeader><DialogTitle className="text-right">إضافة مسار تعليمي (Collection)</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2"><Label>اسم المسار</Label><Input dir="auto" className="bg-white/5 border-white/10 text-right h-12" value={value.title} onChange={e => onChange({ ...value, title: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={onSubmit} className="w-full bg-primary h-12 rounded-xl font-bold">تأكيد الإضافة</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Item Modal ───

interface ItemModalProps {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
  value: { title: string; type: LearningItemType; externalUrl: string };
  onChange: (v: { title: string; type: LearningItemType; externalUrl: string }) => void;
  onSubmit: () => void;
}

export function ItemModal({ isOpen, onOpenChange, value, onChange, onSubmit }: ItemModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 text-right sm:max-w-md">
        <DialogHeader><DialogTitle className="text-right">ربط محتوى جديد</DialogTitle></DialogHeader>
        <div className="space-y-5 py-4">
          <div className="grid gap-2"><Label>عنوان الدرس/الملف</Label><Input dir="auto" className="bg-white/5 border-white/10 text-right h-11" value={value.title} onChange={e => onChange({ ...value, title: e.target.value })} /></div>
          <div className="grid gap-2">
            <Label>نوع المورد</Label>
            <Select value={value.type} onValueChange={(v: any) => onChange({ ...value, type: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse h-11"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                <SelectItem value="video">فيديو</SelectItem>
                <SelectItem value="audio">صوت</SelectItem>
                <SelectItem value="text">نص برمجى/مقالة</SelectItem>
                <SelectItem value="file">مستند تحميل</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2"><Label>الرابط (Drive/YouTube/Direct)</Label><Input placeholder="https://..." className="bg-white/5 border-white/10 text-right h-11" value={value.externalUrl} onChange={e => onChange({ ...value, externalUrl: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={onSubmit} disabled={!value.externalUrl} className="w-full bg-primary h-12 rounded-xl font-bold">حفظ كمسودة للمراجعة</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { VaultExplorer } from '../vault-explorer';

// ─── Drive Modal ───

interface DriveModalProps {
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
}

export function DriveModal({ isOpen, onOpenChange }: DriveModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 rounded-[2.5rem] p-6 text-right max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-right text-2xl font-black text-white flex items-center gap-3 flex-row-reverse justify-start">
            مساحة الرفع السحابية - Nexus Vault
            <Cloud className="size-6 text-emerald-400" />
          </DialogTitle>
          <DialogDescription className="text-right text-sm leading-relaxed mt-2 text-muted-foreground/90">
            قم برفع أصولك وبرمجياتك هنا مباشرة. بمجرد انتهاء الرفع، انسخ الرابط الخاص بالملف واذهب إلى المجلد التعليمي لربطه عن طريق زر <b>(إضافة مسودّة / ربط محتوى جديد)</b>.
            <br />
            <span className="text-amber-400 font-bold">تنويه:</span> لم يظهر المحتوى المضاف إلا بعد مراجعته وقبوله من قِبَل الخبراء (المؤسس، المساعد، أو الإدارة) للحفاظ على جودة النخاع.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 w-full mt-6 bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative">
          <VaultExplorer hideSidebar={true} folderId="13PPxL5FD4f0aVhhI7JMuoQo8oEENRoEm" />
        </div>

        <DialogFooter className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-emerald-400/80 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg flex-row-reverse">
            <ShieldCheck className="size-4" /> التشفير السيادي نشط
          </div>
          <Button onClick={() => onOpenChange(false)} className="bg-white/10 hover:bg-white/20 text-white h-11 rounded-xl px-8 font-bold">
            إغلاق وتوجه للربط
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
