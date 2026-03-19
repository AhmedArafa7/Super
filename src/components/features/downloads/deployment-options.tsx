"use client";

import React from "react";
import { 
  AppWindow, TabletSmartphone, Monitor, 
  Globe, MonitorSmartphone, Zap, ShieldCheck 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DeploymentOptionsProps {
  onInstallPWA: () => void;
  onDownloadApk: () => void;
  deferredPrompt: any;
}

/**
 * [STABILITY_ANCHOR: DEPLOYMENT_OPTIONS_NODE_V1.0]
 * وحدة منصات التشغيل السيادية.
 */
export function DeploymentOptions({ onInstallPWA, onDownloadApk, deferredPrompt }: DeploymentOptionsProps) {
  const OPTIONS = [
    {
      id: 'pwa',
      title: 'تطبيق نكسوس (PWA)',
      desc: 'ثبت نسخة الويب المتقدمة للوصول السريع من شاشتك الرئيسية مع دعم العمل أوفلاين.',
      icon: AppWindow,
      status: 'active',
      badge: 'موصى به',
      color: 'bg-primary',
      actionLabel: deferredPrompt ? 'تثبيت على الجهاز' : 'تم التثبيت / غير مدعوم',
      onClick: onInstallPWA
    },
    {
      id: 'android',
      title: 'تطبيق أندرويد (Native)',
      desc: 'نسخة APK مخصصة للهواتف الذكية مع دعم كامل للتنبيهات العميقة والوصول للمستشعرات.',
      icon: TabletSmartphone,
      status: 'active',
      badge: 'متوفر الآن',
      color: 'bg-emerald-600',
      actionLabel: 'تحميل التطبيق (APK)',
      onClick: onDownloadApk
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10 animate-in fade-in duration-500">
      {OPTIONS.map((opt) => (
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
  );
}
