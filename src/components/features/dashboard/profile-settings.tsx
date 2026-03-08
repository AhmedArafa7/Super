"use client";

import React, { useState, useRef } from "react";
import { User, Loader2, CheckCircle2, Camera, Palette, Store, Moon, Monitor } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { updateUserProfile, uploadAvatar } from "@/lib/auth-store";
import { getMarketItems, MarketItem, addMarketItem } from "@/lib/market-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: PROFILE_SETTINGS_V3.5]
 * واجهة إعدادات الهوية المحدثة - تدعم الضغط التلقائي للصور والمزامنة العصبية.
 */
export function ProfileSettings({ user }: any) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storeThemes, setStoreThemes] = useState<MarketItem[]>([]);
  const [isFetchingThemes, setIsFetchingThemes] = useState(false);

  const ownedThemeIds = user?.ownedThemes || ['nexus'];
  const activeTheme = user?.activeTheme || 'nexus';
  const themeMode = user?.themeMode || 'dark';

  React.useEffect(() => {
    const fetchThemes = async () => {
      setIsFetchingThemes(true);
      try {
        const { items } = await getMarketItems(10, undefined, 'themes', 'ui_themes', undefined, true);
        if (items.length === 0 && user?.role && ['founder', 'cofounder', 'admin'].includes(user.role)) {
          // Auto-seed the DULMS theme product if none exist
          await addMarketItem({
            title: "\u062c\u0627\u0645\u0639\u0629 \u0627\u0644\u062f\u0644\u062a\u0627 (DULMS)",
            description: "\u062a\u0635\u0645\u064a\u0645 \u0645\u0637\u0627\u0628\u0642 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0644\u0646\u0638\u0627\u0645 \u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062a\u0639\u0644\u0645 \u0627\u0644\u062e\u0627\u0635 \u0628\u062c\u0627\u0645\u0639\u0629 \u0627\u0644\u062f\u0644\u062a\u0627. \u064a\u062f\u0639\u0645 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064a\u0644\u064a \u0648\u0627\u0644\u0641\u0627\u062a\u062d.",
            price: 0,
            sellerId: "nexus_system",
            mainCategory: "themes",
            subCategory: "ui_themes",
            stockQuantity: 999999,
          }, true);
          // Re-fetch after seeding
          const { items: newItems } = await getMarketItems(10, undefined, 'themes', 'ui_themes', undefined, true);
          setStoreThemes(newItems);
        } else {
          setStoreThemes(items);
        }
      } catch (err) {
        console.error("Failed to fetch themes", err);
      } finally {
        setIsFetchingThemes(false);
      }
    };
    fetchThemes();
  }, []);

  const handleSeedDulmsTheme = async () => {
    try {
      await addMarketItem({
        title: "جامعة الدلتا (DULMS)",
        description: "تصميم مطابق بالكامل لنظام إدارة التعلم الخاص بجامعة الدلتا (DULMS Layout).",
        price: 0,
        sellerId: "nexus_system",
        mainCategory: "themes",
        subCategory: "ui_themes",
        stockQuantity: 999999,
      }, true);
      toast({ title: "تم إضافة التصميم للمتجر بنجاح!" });
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      toast({ variant: "destructive", title: "فشل الإضافة" });
    }
  };

  const handleActivateTheme = async (themeId: string) => {
    setIsUpdating(true);
    try {
      await updateUserProfile(user.id, { activeTheme: themeId });
      toast({ title: "تم تفعيل التصميم بنجاح" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التفعيل" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePurchaseTheme = async (themeId: string) => {
    setIsUpdating(true);
    try {
      await updateUserProfile(user.id, { ownedThemes: [...ownedThemeIds, themeId] });
      toast({ title: "تم الحصول على التصميم بنجاح!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل الشراء" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleThemeMode = async (checked: boolean) => {
    try {
      await updateUserProfile(user.id, { themeMode: checked ? 'dark' : 'light' });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل تحديث الإعدادات" });
    }
  };

  const handleUpdateProfile = async () => {
    if (!user?.id || !displayName.trim()) return;
    setIsUpdating(true);
    try {
      await updateUserProfile(user.id, { name: displayName });
      toast({ title: "تم تحديث الملف", description: "تمت مزامنة هويتك العصبية مع السجل العالمي." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "فشل التحديث", description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // التحقق من النوع
    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "نوع غير مدعوم", description: "يرجى اختيار صورة صالحة (JPG, PNG, WEBP)." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // سيتم الضغط تلقائياً داخل uploadAvatar
      const url = await uploadAvatar(file, (pct) => setUploadProgress(pct));
      await updateUserProfile(user.id, { avatar_url: url });
      toast({ title: "تمت المزامنة البصرية", description: "تم ضغط الصورة ورفعها بنجاح." });
    } catch (err: any) {
      console.error("Upload Error:", err);
      toast({
        variant: "destructive",
        title: "فشل الرفع السحابي",
        description: err.message?.includes('permission')
          ? "تم رفض العملية من قبل بروتوكول الأمان (الحجم أو النوع غير مسموح)."
          : "حدث اضطراب في الاتصال بحاوية التخزين."
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 font-sans">
      <Card className="glass border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 size-32 bg-primary/5 blur-3xl -mr-16 -mt-16" />

        <div className="relative group mb-6">
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={cn(
              "size-32 rounded-[2.5rem] bg-indigo-500/10 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 cursor-pointer relative shadow-inner",
              isUploading && "cursor-wait"
            )}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} className="size-full object-cover group-hover:opacity-40 transition-opacity" alt="avatar" />
            ) : (
              <User className="size-12 text-muted-foreground group-hover:opacity-40 transition-opacity" />
            )}

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <Camera className="size-8 text-white" />
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 gap-2">
                <Loader2 className="size-8 text-primary animate-spin" />
                <span className="text-[10px] font-black text-white">{Math.round(uploadProgress)}%</span>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        {isUploading && (
          <div className="w-full space-y-2 mb-4 animate-in fade-in">
            <Progress value={uploadProgress} className="h-1 bg-white/5" />
            <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">
              {uploadProgress < 10 ? "جاري المعالجة العصبية (الضغط)..." : "جاري المزامنة السحابية..."}
            </p>
          </div>
        )}

        <h3 dir="auto" className="text-xl font-bold text-white mb-1">{user?.name}</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-mono">@{user?.username}</p>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="mt-6 text-[10px] uppercase font-bold text-indigo-400 hover:bg-indigo-500/10 rounded-xl h-9 px-6 border-white/5 bg-white/5"
        >
          {user?.avatar_url ? "تغيير أيقونة الهوية" : "رفع أيقونة الهوية"}
        </Button>
      </Card>

      <Card className="lg:col-span-2 glass border-white/5 rounded-[2.5rem] p-8 shadow-xl">
        <CardHeader className="px-0 pt-0 text-right">
          <CardTitle className="text-2xl font-bold text-white">إعدادات الهوية</CardTitle>
          <CardDescription className="text-muted-foreground">تحديث معلومات العقدة العامة الخاصة بك في السجل العالمي.</CardDescription>
        </CardHeader>

        <div className="space-y-8 mt-6">
          <div className="grid gap-3">
            <Label htmlFor="displayName" className="text-right text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">الاسم المعروض</Label>
            <Input
              id="displayName"
              dir="auto"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-white/5 border-white/10 h-14 rounded-2xl text-right text-lg focus-visible:ring-primary shadow-inner"
              placeholder="اسمك في الشبكة..."
            />
          </div>

          <div className="grid gap-3 opacity-60">
            <Label htmlFor="username" className="text-right text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">معرف نكسوس (Username)</Label>
            <Input id="username" value={user?.username} disabled className="bg-white/5 border-white/10 h-14 rounded-2xl text-right font-mono" />
            <p className="text-[10px] text-amber-500/70 italic text-right font-bold">لا يمكن تعديل معرفات Nexus بمجرد تثبيتها لضمان سلامة الروابط.</p>
          </div>

          <div className="pt-6 border-t border-white/5">
            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdating || displayName === user?.name}
              className="bg-primary hover:bg-primary/90 rounded-2xl h-14 px-10 shadow-xl shadow-primary/20 w-full sm:w-auto font-black text-base transition-all active:scale-95"
            >
              {isUpdating ? <Loader2 className="size-5 animate-spin mr-2" /> : <CheckCircle2 className="size-5 mr-2" />}
              مزامنة بيانات العقدة
            </Button>
          </div>
        </div>
      </Card>

      {/* Themes & Appearance Card */}
      <Card className="lg:col-span-3 glass border-white/5 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <CardHeader className="px-0 pt-0 text-right relative z-10">
          <CardTitle className="text-2xl font-bold text-white flex items-center justify-end gap-3"><Palette className="size-6 text-indigo-400" /> المظهر والتصميم</CardTitle>
          <CardDescription className="text-muted-foreground">تخصيص الواجهة والتبديل بين التصميمات المشتراة أو الحصول على المزيد.</CardDescription>
        </CardHeader>

        <div className="space-y-8 mt-6 relative z-10">

          {/* Theme Mode Toggle (Light/Dark) */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl flex-row-reverse">
            <div className="flex items-center gap-3 flex-row-reverse text-right">
              <div className="size-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5">
                <Moon className="size-5 text-indigo-300" />
              </div>
              <div>
                <h4 className="font-bold text-white leading-tight">الوضع الليلي (Dark Mode)</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px]">يُطبق فقط على التصميمات التي تدعم الوضعين (مثل DULMS). تصميم Nexus الأساسي ليلي دائماً.</p>
              </div>
            </div>
            <Switch
              checked={themeMode === 'dark'}
              onCheckedChange={handleToggleThemeMode}
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Owned Themes */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white text-right flex items-center justify-end gap-2">
                تصميماتك <Monitor className="size-4" />
              </h4>
              <div className="space-y-3">
                {ownedThemeIds.includes('nexus') && (
                  <div className={cn("p-4 rounded-2xl border transition-all text-right flex flex-col gap-3", activeTheme === 'nexus' ? "bg-primary/10 border-primary" : "bg-white/5 border-white/10 hover:border-white/20")}>
                    <div className="flex items-center justify-between flex-row-reverse">
                      <span className="font-bold text-base text-white">Nexus (الافتراضي)</span>
                      {activeTheme === 'nexus' && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">مُفعّل</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">الواجهة الذكية الافتراضية الخاصة بالنظام الزجاجي.</p>
                    {activeTheme !== 'nexus' && (
                      <Button size="sm" variant="outline" className="w-full rounded-xl bg-transparent border-white/10 mt-1" onClick={() => handleActivateTheme('nexus')} disabled={isUpdating}>
                        تفعيل التصميم
                      </Button>
                    )}
                  </div>
                )}

                {storeThemes.filter(t => ownedThemeIds.includes(t.id)).map(theme => (
                  <div key={theme.id} className={cn("p-4 rounded-2xl border transition-all text-right flex flex-col gap-3", activeTheme === theme.id ? "bg-primary/10 border-primary" : "bg-white/5 border-white/10 hover:border-white/20")}>
                    <div className="flex items-center justify-between flex-row-reverse">
                      <span className="font-bold text-base text-white">{theme.title}</span>
                      {activeTheme === theme.id && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">مُفعّل</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{theme.description}</p>
                    {activeTheme !== theme.id && (
                      <Button size="sm" variant="outline" className="w-full rounded-xl bg-transparent border-white/10 mt-1" onClick={() => handleActivateTheme(theme.id)} disabled={isUpdating}>
                        تفعيل التصميم
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Store Themes */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white text-right flex items-center justify-end gap-2">
                المتجر <Store className="size-4" />
              </h4>
              <div className="space-y-3">
                {isFetchingThemes ? (
                  <div className="p-8 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10">
                    <Loader2 className="size-6 text-muted-foreground animate-spin" />
                  </div>
                ) : storeThemes.filter(t => !ownedThemeIds.includes(t.id)).length > 0 ? (
                  storeThemes.filter(t => !ownedThemeIds.includes(t.id)).map(theme => (
                    <div key={theme.id} className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-right flex flex-col gap-3">
                      <div className="flex items-center justify-between flex-row-reverse">
                        <span className="font-bold text-base text-white">{theme.title}</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">مجاني</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{theme.description}</p>
                      <Button size="sm" className="w-full rounded-xl mt-1 font-bold shadow-xl shadow-primary/10" onClick={() => handlePurchaseTheme(theme.id)} disabled={isUpdating}>
                        الحصول على التصميم لتغيير المظهر
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/10 text-center gap-4">
                    <p className="text-xs text-muted-foreground font-bold">لا توجد تصميمات جديدة في المتجر حالياً.</p>
                    {user?.role === 'founder' && (
                      <Button variant="outline" size="sm" onClick={handleSeedDulmsTheme} className="rounded-xl border-dashed border-white/20 text-[10px]">
                        + Seed DULMS Theme (Developer)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </Card>
    </div>
  );
}
