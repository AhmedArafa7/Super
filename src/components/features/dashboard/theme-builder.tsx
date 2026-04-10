"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, BoxSelect, CheckCircle2, RotateCcw, PaintBucket } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { activateTheme } from '@/lib/theme-store';
import { updateUserProfile } from '@/lib/auth-store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { IconSafe } from '@/components/ui/icon-safe';

const LAYOUT_OPTIONS = [
  { id: 'nexus', name: 'الهيكل القياسي (Nexus)', desc: 'شريط جانبي أيسر مغلق مع شاشة زجاجية مركزية.' },
  { id: 'dulms', name: 'هيكل المنصات الأكاديمية (DULMS)', desc: 'شريط علوي متقدم مع قائمة جانبية مرنة، مفضل للكورسات.' }
] as const;

const PRESET_COLORS = [
  { name: 'Indigo Core', hex: '#6366f1' },
  { name: 'Emerald Spark', hex: '#10b981' },
  { name: 'Amber Glow', hex: '#f59e0b' },
  { name: 'Rose Petal', hex: '#f43f5e' },
  { name: 'Cyan Tech', hex: '#06b6d4' },
];

export function ThemeBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [themeName, setThemeName] = useState('تصميمي الخاص');
  const [layoutEngine, setLayoutEngine] = useState<'nexus' | 'dulms'>('nexus');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [bgColor, setBgColor] = useState('#0f111a'); // For body backgrounds
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTheme = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const slug = `custom_${user.id}_${Date.now()}`;
      
      const newCustomDef = {
        slug,
        layoutEngine,
        customColors: {
          primary: primaryColor,
          background: bgColor
        }
      };

      // حفظ خصائص التصميم
      await updateUserProfile(user.id, { 
        customThemeDef: newCustomDef,
        activeTheme: slug // تفعيل تلقائي
      });

      toast({ title: 'تم الحفظ والتطبيق! جاري التحديث...' });
      
      // Reboot to apply layout and CSS variables
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'فشل حفظ التصميم', description: err.message });
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await activateTheme(user.id, 'nexus');
      toast({ title: 'تمت العودة للوضع القياسي...' });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setIsSaving(false);
    }
  };

  return (
    <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-white/5 text-right p-8 relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Palette className="size-32" />
        </div>
        <CardTitle className="text-3xl font-black text-white flex items-center justify-end gap-3">
          الاستوديو البصري (No-Code Builder) <IconSafe icon={PaintBucket} className="text-primary size-8" />
        </CardTitle>
        <p className="text-muted-foreground mt-2 font-medium">صمم تخطيطك الخاص وألوانك بدون الحاجة لكتابة أي كود برمجي، وسيطبق فوراً على كامل المنصة.</p>
      </CardHeader>

      <CardContent className="p-8 space-y-12 text-right">
        
        {/* Name Input */}
        <div className="space-y-3">
          <Label className="text-white font-bold text-lg">اسم التصميم الجديد</Label>
          <Input 
            dir="auto"
            value={themeName} 
            onChange={(e) => setThemeName(e.target.value)}
            className="h-14 bg-white/5 border-white/10 rounded-2xl text-right font-bold text-xl focus-visible:ring-primary/50"
          />
        </div>

        {/* Layout Engine Selection */}
        <div className="space-y-4">
          <Label className="text-white font-bold text-lg flex items-center justify-end gap-2">
            هيكل المنصة الآلي <BoxSelect className="size-5 text-primary" />
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LAYOUT_OPTIONS.map(opt => (
              <div 
                key={opt.id} 
                onClick={() => setLayoutEngine(opt.id)}
                className={cn(
                  "p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden text-right flex flex-col justify-end h-32",
                  layoutEngine === opt.id ? "bg-primary/10 border-primary shadow-[0_0_30px_rgba(99,102,241,0.2)]" : "bg-white/5 border-white/10 hover:border-white/20"
                )}
              >
                {layoutEngine === opt.id && <CheckCircle2 className="absolute top-4 left-4 text-primary size-6 animate-in zoom-in" />}
                <h3 className="font-bold text-white text-lg">{opt.name}</h3>
                <p className="text-xs text-muted-foreground mt-2">{opt.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Color Palette Selection */}
        <div className="space-y-4">
          <Label className="text-white font-bold text-lg flex items-center justify-end gap-2">
            البصمة اللونية للمنصة <Palette className="size-5 text-emerald-400" />
          </Label>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-end gap-4">
              {PRESET_COLORS.map(color => (
                <div 
                  key={color.hex}
                  onClick={() => setPrimaryColor(color.hex)}
                  className={cn(
                    "size-12 rounded-full cursor-pointer transition-all flex items-center justify-center border-4",
                    primaryColor === color.hex ? "scale-110 border-white shadow-xl" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {primaryColor === color.hex && <CheckCircle2 className="text-white size-5 drop-shadow-md" />}
                </div>
              ))}
              <div className="h-10 w-px bg-white/10 mx-2" />
              <div className="flex items-center gap-3">
                <Input 
                  type="color" 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="size-12 p-1 rounded-full bg-white/10 border-white/20 cursor-pointer"
                />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-bold">لون مخصص</p>
                  <p className="text-sm font-black text-white">{primaryColor}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Background */}
        <div className="space-y-4">
          <Label className="text-white font-bold text-lg flex items-center justify-end gap-2">
            لون الخلفية المركزي
          </Label>
          <div className="flex items-center justify-end gap-3 flex-row-reverse">
             <Input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full max-w-[120px] h-12 p-1 rounded-2xl bg-white/10 border-white/20 cursor-pointer"
              />
              <span className="text-sm font-bold text-muted-foreground bg-white/5 px-4 py-3 rounded-xl border border-white/10">Default: #0f111a</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-6 border-t border-white/5 flex-row-reverse">
          <Button 
            onClick={handleSaveTheme} 
            disabled={isSaving}
            className="flex-1 h-14 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 gap-3"
          >
            {isSaving ? "جاري التطبيق..." : "حفظ وتفعيل التصميم (Live)"} <PaintBucket className="size-5" />
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset} 
            disabled={isSaving}
            className="h-14 px-8 rounded-2xl border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white"
          >
            تراجع لـ Nexus <RotateCcw className="size-4 ml-2" />
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
