
"use client";

import React, { useState, useEffect } from "react";
import { 
  DownloadCloud, Monitor, Smartphone, Globe, 
  ShieldCheck, Zap, Laptop, HardDrive, 
  Trash2, Heart, Database, Settings2, Info,
  BookOpen, Video, GraduationCap, Cpu, ChevronRight,
  AppWindow, TabletSmartphone, MonitorSmartphone
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useGlobalStorage, AssetType } from "@/lib/global-storage-store";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: DOWNLOAD_CENTER_V4.0]
 * مركز التحميل المطور - تم استعادة خيارات المتصفح ونظام التشغيل مع دعم PWA.
 */
export function DownloadCenter() {
  const { toast } = useToast();
  const { 
    cachedAssets, categoryLimits, removeAsset, toggleFavorite, 
    setCategoryLimit, getUsedSpaceByCategory 
  } = useGlobalStorage();

  const [activeView, setActiveView] = useState<'deployment' | 'storage'>('deployment');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // [STABILITY_ANCHOR: PWA_INSTALL_LISTENER]
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast({ 
        title: "التطبيق مثبت بالفعل", 
        description: "يمكنك فتح NexusAI مباشرة من قائمة تطبيقاتك أو سطح المكتب." 
      });
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      toast({ title: "بدأ التثبيت", description: "يتم الآن إضافة نكسوس إلى جهازك." });
    }
  };

  const SECTIONS: { id: AssetType, label: string, icon: any, color: string }[] = [
    { id: 'quran', label: 'القرآن الكريم', icon: BookOpen, color: 'text-emerald-400' },
    { id: 'video', label: 'WeTube (فيديو)', icon: Video, color: 'text-indigo-400' },
    { id: 'learning_asset', label: 'المكتبة التعليمية', icon: GraduationCap, color: 'text-blue-400' },
    { id: 'ai_model_data', label: 'النبضات العصبية (AI)', icon: Cpu, color: 'text-primary' },
  ];

  const DEPLOYMENT_OPTIONS = [
    {
      id: 'pwa',
      title: 'تطبيق نكسوس (PWA)',
      desc: 'ثبت نسخة الويب المتقدمة للوصول السريع من شاشتك الرئيسية مع دعم العمل أوفلاين.',
      icon: AppWindow,
      status: 'active',
      badge: 'موصى به',
      color: 'bg-primary',
      actionLabel: 'تثبيت على الجهاز',
      onClick: handleInstallPWA
    },
    {
      id: 'android',
      title: 'تطبيق أندرويد (Native)',
      desc: 'نسخة APK مخصصة للهواتف الذكية مع دعم كامل للتنبيهات العميقة والوصول للمستشعرات.',
      icon: TabletSmartphone,
      status: 'locked',
      badge: 'قريباً جداً',
      color: 'bg-slate-800',
      actionLabel: 'قيد المعايرة'
    },
    {
      id: 'desktop',
      title: 'نسخة الحاسوب (Desktop)',
      desc: 'تطبيق EXE متكامل للحواسب الشخصية (ويندوز/ماك) يوفر أداء فائقاً ومعالجة محلية.',
      icon: Monitor,
      status: 'locked',
      badge: 'تحت التطوير',
      color: 'bg-slate-800',
      actionLabel: 'قيد المزامنة'
    },
    {
      id: 'browser',
      title: 'متصفح نكسوس (Sovereign Browser)',
      desc: 'متصفح مبني على نواة نكسوس يوفر تشفيراً عصبياً وتكاملاً مباشراً مع أدوات النظام.',
      icon: Globe,
      status: 'locked',
      badge: 'قيد التطوير',
      color: 'bg-slate-800',
      actionLabel: 'قيد المزامنة'
    },
    {
      id: 'os',
      title: 'نظام تشغيل نكسوس (Nexus OS)',
      desc: 'النظام البيئي الكامل؛ بيئة عمل متكاملة مبنية على Linux ومحسنة لمعالجة النبضات العصبية.',
      icon: MonitorSmartphone,
      status: 'locked',
      badge: 'مشروع مستقبلي',
      color: 'bg-slate-800',
      actionLabel: 'بانتظار البروتوكول'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans text-right">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-row-reverse">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 border border-primary/20 rounded-full mb-2">
            <DownloadCloud className="size-3 text-primary" />
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Sovereign Asset Management</span>
          </div>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            مركز التحميل والذاكرة
            <HardDrive className="text-primary size-10" />
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">اختر المنصة المناسبة لتشغيل نكسوس، وراقب المساحة المخصصة لكل قطاع في عقدتك.</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-1 rounded-2xl flex gap-1 flex-row-reverse shadow-xl">
          <Button 
            variant={activeView === 'deployment' ? 'default' : 'ghost'} 
            onClick={() => setActiveView('deployment')}
            className="rounded-xl px-6 h-11 font-bold"
          >
            خيارات التثبيت
          </Button>
          <Button 
            variant={activeView === 'storage' ? 'default' : 'ghost'} 
            onClick={() => setActiveView('storage')}
            className="rounded-xl px-6 h-11 font-bold"
          >
            إدارة الذاكرة والحدود
          </Button>
        </div>
      </header>

      {activeView === 'deployment' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
          {DEPLOYMENT_OPTIONS.map((opt) => (
            <Card 
              key={opt.id} 
              className={cn(
                "group glass border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 flex flex-col",
                opt.status === 'active' ? "hover:border-primary/40 shadow-2xl" : "opacity-60 grayscale cursor-not-allowed"
              )}
            >
              <CardContent className="p-10 flex flex-col items-center text-center flex-1">
                <div className={cn("size-20 rounded-3xl flex items-center justify-center mb-8 shadow-xl transition-all group-hover:scale-110", opt.color)}>
                  <opt.icon className="size-10 text-white" />
                </div>
                <Badge variant="outline" className="mb-4 border-white/10 text-[10px] uppercase font-black tracking-widest">{opt.badge}</Badge>
                <h3 className="text-2xl font-bold text-white mb-3">{opt.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-10 h-20">{opt.desc}</p>
                <Button 
                  disabled={opt.status === 'locked'}
                  onClick={opt.onClick}
                  className={cn(
                    "w-full h-14 rounded-2xl font-bold text-base gap-3 transition-all mt-auto",
                    opt.status === 'active' ? "bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95" : "bg-white/5"
                  )}
                >
                  {opt.status === 'active' ? <Zap className="size-5 fill-current" /> : <ShieldCheck className="size-4 opacity-40" />}
                  {opt.actionLabel}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass border-white/5 rounded-[3rem] p-8 text-right space-y-8">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3 justify-end">
                حدود السعة الفيزيائية
                <Settings2 className="text-indigo-400" />
              </h3>
              <div className="space-y-6">
                {SECTIONS.map(section => {
                  const used = getUsedSpaceByCategory(section.id);
                  const limit = categoryLimits[section.id];
                  const percentage = Math.min(100, Math.round((used / limit) * 100));
                  
                  return (
                    <div key={section.id} className="space-y-3">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <section.icon className={cn("size-4", section.color)} />
                          <span className="text-sm font-bold text-white">{section.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 border border-white/5">
                            <Input 
                              type="number" 
                              className="w-16 h-8 bg-transparent border-none text-center text-xs p-0 focus-visible:ring-0"
                              value={limit}
                              onChange={(e) => setCategoryLimit(section.id, Number(e.target.value))}
                            />
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">MB</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{used.toFixed(1)} MB مستخدم</span>
                        </div>
                      </div>
                      <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-1000", percentage > 85 ? "bg-red-500" : "bg-primary")} 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4 flex-row-reverse shadow-inner">
                <Info className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  بروتوكول التنظيف الذكي نشط: عند تجاوز الحد المخصص لأي قسم، سيقوم النظام تلقائياً بمسح أقدم الأصول المخزنة في ذلك القسم فقط لضمان توفير مساحة للأصول الجديدة.
                </p>
              </div>
            </Card>

            <Card className="glass border-white/5 rounded-[3rem] p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6 flex-row-reverse border-b border-white/5 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-row-reverse">
                  <Database className="text-indigo-400" />
                  الأصول المزامنة حالياً
                </h3>
                <Badge variant="outline" className="border-indigo-500/20 text-indigo-400">{cachedAssets.length} ملف</Badge>
              </div>
              <ScrollArea className="flex-1 max-h-[400px]">
                <div className="space-y-2 pr-4">
                  {cachedAssets.length === 0 ? (
                    <div className="py-20 text-center opacity-20 italic text-sm">لا توجد أصول في الذاكرة المحلية</div>
                  ) : (
                    cachedAssets.sort((a,b) => b.timestamp - a.timestamp).map(asset => (
                      <div key={asset.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-all flex-row-reverse group">
                        <div className="flex items-center gap-4 flex-row-reverse overflow-hidden">
                          <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                            {SECTIONS.find(s => s.id === asset.type)?.icon ? 
                              React.createElement(SECTIONS.find(s => s.id === asset.type)!.icon, { className: "size-5 text-muted-foreground" }) : 
                              <Database className="size-5" />
                            }
                          </div>
                          <div className="text-right overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{asset.title}</p>
                            <div className="flex items-center gap-2 justify-end mt-0.5">
                              <span className="text-[8px] text-muted-foreground uppercase font-black">{asset.type}</span>
                              <div className="size-1 rounded-full bg-white/20" />
                              <span className="text-[8px] font-mono text-indigo-400">{asset.sizeMB} MB</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("size-8 rounded-lg", asset.isFavorite ? "text-red-500" : "text-muted-foreground")}
                            onClick={() => toggleFavorite(asset.id)}
                          >
                            <Heart className={cn("size-4", asset.isFavorite && "fill-current")} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 rounded-lg text-red-400 hover:bg-red-500/10"
                            onClick={() => removeAsset(asset.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      )}

      <footer className="p-10 glass rounded-[3rem] border border-emerald-500/10 bg-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-8 flex-row-reverse relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 size-32 bg-emerald-500/5 blur-3xl" />
        <div className="text-right space-y-2 flex-1">
          <h4 className="text-xl font-bold text-emerald-400 flex items-center gap-2 justify-end">
            بروتوكول التوافق المتعدد (Cross-Platform Integrity)
            <ShieldCheck className="size-6" />
          </h4>
          <p className="text-base text-slate-400 leading-relaxed max-w-3xl">
            نظام نكسوس مصمم ليعمل كـ "عقدة واحدة في أجهزة متعددة". خيارات التثبيت أعلاه تضمن لك الوصول لأدواتك العصبية بأعلى سرعة ممكنة وبشكل مستقل عن المتصفح التقليدي.
          </p>
        </div>
        <div className="flex items-center gap-4 px-6 py-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-inner">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px] font-black uppercase tracking-widest">Universal Node Ready</Badge>
        </div>
      </footer>
    </div>
  );
}
