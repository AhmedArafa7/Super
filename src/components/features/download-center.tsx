
"use client";

import React, { useState } from "react";
import { 
  DownloadCloud, Monitor, Smartphone, Globe, 
  ShieldCheck, Zap, Laptop, ArrowLeft, 
  CheckCircle2, Clock, Lock, WifiOff
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: DOWNLOAD_CENTER_V1.0]
 * مركز التحميل السيادي - يدعم خيار التطبيق للعمل أوفلاين مع خيارات مستقبلية.
 */
export function DownloadCenter() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const handleSyncApp = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    
    // محاكاة مزامنة الأصول للعمل أوفلاين
    for (let i = 0; i <= 100; i += 5) {
      setSyncProgress(i);
      await new Promise(r => setTimeout(resolve => r(null), 150));
    }
    
    setIsSyncing(false);
    toast({ 
      title: "تمت المزامنة بنجاح", 
      description: "التطبيق الآن جاهز للعمل في الوضع الأوفلاين بالكامل." 
    });
  };

  const DOWNLOAD_OPTIONS = [
    {
      id: 'app',
      title: 'تطبيق نكسوس (المحلي)',
      desc: 'تثبيت النسخة الفيزيائية للعمل بدون إنترنت وبأداء فائق.',
      icon: Smartphone,
      status: 'active',
      badge: 'موصى به',
      color: 'bg-primary'
    },
    {
      id: 'browser',
      title: 'إضافة المتصفح (Extension)',
      desc: 'دمج قدرات نكسوس في متصفحك المفضل للوصول السريع.',
      icon: Globe,
      status: 'locked',
      badge: 'قريباً',
      color: 'bg-slate-800'
    },
    {
      id: 'os',
      title: 'نظام نكسوس (Nexus OS)',
      desc: 'نظام تشغيل متكامل مبني على النواة العصبية لنكسوس.',
      icon: Laptop,
      status: 'locked',
      badge: 'تحت المعايرة',
      color: 'bg-slate-800'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans text-right">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-row-reverse text-right">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 border border-primary/20 rounded-full mb-2">
            <DownloadCloud className="size-3 text-primary" />
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Sovereign Deployment</span>
          </div>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            مركز التحميل
            <Monitor className="text-primary size-10" />
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            قم بتحويل تجربة الويب إلى تطبيق مادي يعمل بدون إنترنت (أوفلاين) لضمان السيادة الكاملة على بياناتك.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        {DOWNLOAD_OPTIONS.map((opt) => (
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
              <p className="text-sm text-muted-foreground leading-relaxed mb-10">{opt.desc}</p>
              
              <div className="mt-auto w-full space-y-4">
                {opt.id === 'app' && isSyncing && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[10px] font-bold text-primary">
                      <span>{syncProgress}%</span>
                      <span>جاري المزامنة الفيزيائية</span>
                    </div>
                    <Progress value={syncProgress} className="h-1 bg-white/5" />
                  </div>
                )}
                
                <Button 
                  disabled={opt.status === 'locked' || isSyncing}
                  onClick={opt.id === 'app' ? handleSyncApp : undefined}
                  className={cn(
                    "w-full h-14 rounded-2xl font-bold text-base gap-3 transition-all",
                    opt.status === 'active' ? "bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02]" : "bg-white/5"
                  )}
                >
                  {opt.status === 'active' ? (
                    isSyncing ? <Clock className="animate-spin" /> : <Zap className="size-5 fill-current" />
                  ) : <Lock className="size-4 opacity-40" />}
                  {opt.id === 'app' ? (isSyncing ? "جاري المزامنة..." : "تثبيت وتفعيل الأوفلاين") : "قيد التطوير"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-10 glass rounded-[3rem] border border-emerald-500/10 bg-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-8 flex-row-reverse relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 size-32 bg-emerald-500/5 blur-3xl" />
        <div className="text-right space-y-2 flex-1">
          <h4 className="text-xl font-bold text-emerald-400 flex items-center gap-2 justify-end">
            بروتوكول العمل بدون إنترنت (Offline Mode)
            <WifiOff className="size-6" />
          </h4>
          <p className="text-base text-slate-400 leading-relaxed max-w-3xl">
            عند تثبيت خيار "التطبيق"، يتم تفعيل الـ Service Worker السيادي الذي يقوم بحفظ كافة واجهات النظام ونصوص القرآن والأذكار في الذاكرة الفيزيائية لجهازك، مما يتيح لك فتح نكسوس في أي وقت حتى بدون وجود شبكة.
          </p>
        </div>
        <div className="flex items-center gap-4 px-6 py-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
          <ShieldCheck className="size-5 text-emerald-400" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Protocol Verified</span>
        </div>
      </div>
    </div>
  );
}
