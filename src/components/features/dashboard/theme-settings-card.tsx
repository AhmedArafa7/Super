'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Palette, Store, Moon, Monitor } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  getOwnedThemes, getAvailableThemes, getActiveThemeSlug,
  activateTheme, purchaseTheme, toggleThemeMode,
  ensureThemeProductsExist, ThemeDefinition
} from '@/lib/theme-store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ThemeSettingsCardProps {
  user: any;
}

export function ThemeSettingsCard({ user }: ThemeSettingsCardProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(true);

  const ownedThemes = getOwnedThemes(user);
  const availableThemes = getAvailableThemes(user);
  const activeSlug = getActiveThemeSlug(user);
  const themeMode = user?.themeMode || 'dark';

  useEffect(() => {
    ensureThemeProductsExist()
      .catch(err => console.error("Theme seed error:", err))
      .finally(() => setIsSeeding(false));
  }, []);

  const handleActivateTheme = async (slug: string) => {
    setIsUpdating(true);
    try {
      await activateTheme(user.id, slug);
      toast({ title: "تم تفعيل التصميم بنجاح، جاري إعادة التحميل..." });
      setTimeout(() => window.location.reload(), 800);
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التفعيل", description: err.message });
      setIsUpdating(false);
    }
  };

  const handlePurchaseTheme = async (slug: string) => {
    setIsUpdating(true);
    try {
      const currentOwned = user?.ownedThemes || ['nexus'];
      await purchaseTheme(user.id, slug, currentOwned);
      toast({ title: "تم الحصول على التصميم بنجاح!" });
      setTimeout(() => window.location.reload(), 800);
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الشراء" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleThemeMode = async (checked: boolean) => {
    try {
      await toggleThemeMode(user.id, checked ? 'dark' : 'light');
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل تحديث الإعدادات" });
    }
  };

  return (
    <Card className="lg:col-span-3 glass border-white/5 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <CardHeader className="px-0 pt-0 text-right relative z-10">
        <CardTitle className="text-2xl font-bold text-white flex items-center justify-end gap-3"><Palette className="size-6 text-indigo-400" /> المظهر والتصميم</CardTitle>
        <CardDescription className="text-muted-foreground">تخصيص الواجهة والتبديل بين التصميمات المشتراة أو الحصول على المزيد.</CardDescription>
      </CardHeader>

      <div className="space-y-8 mt-6 relative z-10">
        {/* Theme Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl flex-row-reverse">
          <div className="flex items-center gap-3 flex-row-reverse text-right">
            <div className="size-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5">
              <Moon className="size-5 text-indigo-300" />
            </div>
            <div>
              <h4 className="font-bold text-white leading-tight">الوضع الليلي (Dark Mode)</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px]">يُطبق فقط على التصميمات التي تدعم الوضعين. تصميم Nexus ليلي دائماً.</p>
            </div>
          </div>
          <Switch checked={themeMode === 'dark'} onCheckedChange={handleToggleThemeMode} dir="ltr" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Owned Themes */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white text-right flex items-center justify-end gap-2">
              تصميماتك <Monitor className="size-4" />
            </h4>
            <div className="space-y-3">
              {ownedThemes.map(theme => (
                <div key={theme.slug} className={cn("p-4 rounded-2xl border transition-all text-right flex flex-col gap-3", activeSlug === theme.slug ? "bg-primary/10 border-primary" : "bg-white/5 border-white/10 hover:border-white/20")}>
                  <div className="flex items-center justify-between flex-row-reverse">
                    <span className="font-bold text-base text-white">{theme.name}</span>
                    {activeSlug === theme.slug && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">مُفعّل</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{theme.description}</p>
                  {activeSlug !== theme.slug && (
                    <Button size="sm" variant="outline" className="w-full rounded-xl bg-transparent border-white/10 mt-1" onClick={() => handleActivateTheme(theme.slug)} disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="size-4 animate-spin" /> : "تفعيل التصميم"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Available Themes */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white text-right flex items-center justify-end gap-2">
              المتجر <Store className="size-4" />
            </h4>
            <div className="space-y-3">
              {isSeeding ? (
                <div className="p-8 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10">
                  <Loader2 className="size-6 text-muted-foreground animate-spin" />
                </div>
              ) : availableThemes.length > 0 ? (
                availableThemes.map(theme => (
                  <div key={theme.slug} className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-right flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <span className="font-bold text-base text-white">{theme.name}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">{theme.storePrice === 0 ? 'مجاني' : `${theme.storePrice} Credits`}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{theme.description}</p>
                    <Button size="sm" className="w-full rounded-xl mt-1 font-bold shadow-xl shadow-primary/10" onClick={() => handlePurchaseTheme(theme.slug)} disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="size-4 animate-spin" /> : "الحصول على التصميم"}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-8 flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/10 text-center">
                  <p className="text-xs text-muted-foreground font-bold">تمتلك جميع التصميمات المتاحة حالياً. ترقبوا المزيد!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
