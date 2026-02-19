
"use client";

import React, { useState, useEffect } from "react";
import { Upload, ImageIcon, CheckCircle2, Zap, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MainCategory, SUB_CATEGORIES, AppVersionStatus, MarketItem } from "@/lib/market-store";
import { MAIN_CATEGORIES } from "./market-sidebar";

interface MarketFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editingItem: MarketItem | null;
  isSubmitting: boolean;
  progress: number;
  defaultCat: MainCategory;
}

export function MarketFormDialog({ isOpen, onClose, onSave, editingItem, isSubmitting, progress, defaultCat }: MarketFormDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    mainCategory: defaultCat,
    subCategory: "ai_models",
    imageUrl: "",
    imageFile: null as File | null,
    stockQuantity: 1,
    isLaunchable: false,
    launchUrl: "",
    downloadUrl: "",
    buildFile: null as File | null,
    versionStatus: "final" as AppVersionStatus
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        description: editingItem.description,
        price: editingItem.price,
        mainCategory: editingItem.mainCategory,
        subCategory: editingItem.subCategory,
        imageUrl: editingItem.imageUrl || "",
        imageFile: null,
        stockQuantity: editingItem.stockQuantity,
        isLaunchable: editingItem.isLaunchable || false,
        launchUrl: editingItem.launchUrl || "",
        downloadUrl: editingItem.downloadUrl || "",
        buildFile: null,
        versionStatus: editingItem.versionStatus || "final"
      });
    } else {
      setFormData(prev => ({ ...prev, mainCategory: defaultCat }));
    }
  }, [editingItem, defaultCat]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] p-8 sm:max-w-[650px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-right text-white">
            {editingItem ? "تحديث بيانات الأصل" : "إطلاق عقدة منتج جديد"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
          <div className="space-y-4 md:col-span-2">
            <div className="grid gap-2">
              <Label className="text-right">عنوان المنتج</Label>
              <Input dir="auto" placeholder="الاسم التقني..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-white/5 border-white/10 text-right" />
            </div>
            <div className="grid gap-2">
              <Label className="text-right">الوصف العصبي</Label>
              <Textarea dir="auto" placeholder="اشرح قدرات هذا المنتج..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/10 text-right min-h-[100px]" />
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <Label className="text-right block">صورة المنتج المخصصة</Label>
            <div className="relative h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all group">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={e => setFormData({...formData, imageFile: e.target.files?.[0] || null})}
                accept="image/*"
              />
              {formData.imageFile ? (
                <div className="flex items-center gap-3 text-green-400 font-bold">
                  <CheckCircle2 className="size-6" />
                  <span className="text-sm truncate max-w-[250px]">{formData.imageFile.name}</span>
                </div>
              ) : (
                <>
                  <ImageIcon className="size-8 text-muted-foreground group-hover:scale-110 transition-transform mb-2" />
                  <p className="text-xs text-muted-foreground">اضغط لرفع صورة العقدة</p>
                </>
              )}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label className="text-right">القطاع</Label>
            <Select value={formData.mainCategory} onValueChange={(v: any) => setFormData({...formData, mainCategory: v})}>
              <SelectTrigger className="bg-white/5 border-white/10 text-right flex-row-reverse"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                {MAIN_CATEGORIES.filter(c => c.id !== 'all').map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-right">البروتوكول الفرعي</Label>
            <Select value={formData.subCategory} onValueChange={(v: any) => setFormData({...formData, subCategory: v})}>
              <SelectTrigger className="bg-white/5 border-white/10 text-right flex-row-reverse"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                {SUB_CATEGORIES.filter(s => s.parent === formData.mainCategory).map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {formData.mainCategory === 'software' && (
            <div className="md:col-span-2 space-y-6 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between flex-row-reverse">
                <Label className="text-primary font-bold block text-right">إرسال حزمة البرمجيات</Label>
                <div className="flex items-center gap-2 flex-row-reverse">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold">الحالة:</Label>
                  <Select value={formData.versionStatus} onValueChange={(v: any) => setFormData({...formData, versionStatus: v})}>
                    <SelectTrigger className="h-8 w-28 bg-white/5 border-white/10 text-[10px] font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="final">نسخة نهائية</SelectItem>
                      <SelectItem value="beta">إصدار Beta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs text-right">رابط المعاينة الحية (Internal)</Label>
                  <Input placeholder="https://..." value={formData.launchUrl} onChange={e => setFormData({...formData, launchUrl: e.target.value, isLaunchable: !!e.target.value})} className="bg-white/5 border-white/10 text-right" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs text-right">رابط تحميل خارجي (اختياري)</Label>
                  <Input placeholder="https://storage.link/..." value={formData.downloadUrl} onChange={e => setFormData({...formData, downloadUrl: e.target.value})} className="bg-white/5 border-white/10 text-right" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs text-right block">أو ارفع ملف بناء جديد (ZIP, APK, EXE)</Label>
                <div className="relative h-24 bg-indigo-500/5 border-2 border-dashed border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-500/10 transition-all group">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={e => setFormData({...formData, buildFile: e.target.files?.[0] || null})}
                    accept=".apk,.exe,.zip,.rar,.ipa"
                  />
                  {formData.buildFile ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="size-5" />
                      <span className="text-sm font-bold truncate max-w-[200px]">{formData.buildFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-6 text-indigo-400 group-hover:scale-110 transition-transform mb-1" />
                      <p className="text-[10px] text-muted-foreground">اضغط لرفع ملف البناء المباشر</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label className="text-right">التقييم (Credits)</Label>
            <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="bg-white/5 border-white/10 text-right" />
          </div>

          <div className="grid gap-2">
            <Label className="text-right">الكمية المتوفرة</Label>
            <Input type="number" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} className="bg-white/5 border-white/10 text-right" />
          </div>
        </div>

        {isSubmitting && (
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-[10px] uppercase font-bold text-indigo-400">
              <span>جاري مزامنة البيانات</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1 bg-white/5" />
          </div>
        )}

        <DialogFooter>
          <Button 
            onClick={() => onSave(formData)} 
            disabled={isSubmitting || !formData.title}
            className="w-full bg-primary h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20"
          >
            {isSubmitting ? <Loader2 className="size-5 animate-spin mr-2" /> : <Zap className="size-5 mr-2" />}
            {editingItem ? "حفظ التغييرات العصبية" : "تأكيد الإطلاق"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
