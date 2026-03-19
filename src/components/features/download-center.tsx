"use client";

import React, { useState, useEffect } from "react";
import { 
  DownloadCloud, HardDrive, ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DeploymentOptions } from "./downloads/deployment-options";
import { StorageManagement } from "./downloads/storage-management";

/**
 * [STABILITY_ANCHOR: DOWNLOAD_CENTER_REFACTORED_V5.0]
 * المنسق الرئيسي لمركز التحميل - تم التفكيك لضمان الاستقرار الهيكلي.
 */
export function DownloadCenter() {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'deployment' | 'storage'>('deployment');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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

  const handleDownloadApk = () => {
    toast({ 
      title: "جاري المعالجة", 
      description: "سيتم توفير رابط النسخة النهائية للتطبيق (APK) للتحميل قريباً بمجرد تصديرها من Android Studio." 
    });
  };

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
          <p className="text-muted-foreground text-lg max-w-2xl text-right">اختر المنصة المناسبة لتشغيل نكسوس، وراقب المساحة المخصصة لكل قطاع في عقدتك.</p>
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
        <DeploymentOptions 
          onInstallPWA={handleInstallPWA} 
          onDownloadApk={handleDownloadApk}
          deferredPrompt={deferredPrompt} 
        />
      ) : (
        <StorageManagement />
      )}

      {/*<footer className="p-10 glass rounded-[3rem] border border-emerald-500/10 bg-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-8 flex-row-reverse relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 size-32 bg-emerald-500/5 blur-3xl" />
        <div className="text-right space-y-2 flex-1">
          <h4 className="text-xl font-bold text-emerald-400 flex items-center gap-2 justify-end">
            بروتوكول التوافق المتعدد (Cross-Platform Integrity)
            <ShieldCheck className="size-6" />
          </h4>
          <p className="text-base text-slate-400 leading-relaxed max-w-3xl text-right">
            نظام نكسوس مصمم ليعمل كـ "عقدة واحدة في أجهزة متعددة". خيارات التثبيت أعلاه تضمن لك الوصول لأدواتك العصبية بأعلى سرعة ممكنة وبشكل مستقل عن المتصفح التقليدي.
          </p>
        </div>
        <div className="flex items-center gap-4 px-6 py-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-inner">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px] font-black uppercase tracking-widest">Universal Node Ready</Badge>
        </div>
      </footer>*/}
    </div>
  );
}
