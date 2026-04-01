"use client";

import React from "react";
import { 
  AppWindow, TabletSmartphone, Monitor, 
  Globe, MonitorSmartphone, Zap, ShieldCheck,
  Download, Loader2, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// GitHub Release URL — يتم تحديثها تلقائياً عند كل push
const APK_DOWNLOAD_URL = "https://github.com/AhmedArafa7/Super/releases/download/mobile-latest/nexusai-latest.apk";

interface Option {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  status: 'active' | 'locked' | 'building';
  badge: string;
  badgeColor: string;
  glowColor: string;
  iconBg: string;
  actionLabel: string;
  onClick?: () => void;
  href?: string;
}

interface DeploymentOptionsProps {
  onInstallPWA: () => void;
  onDownloadApk: () => void;
  deferredPrompt: Event | null;
}

/**
 * [STABILITY_ANCHOR: DEPLOYMENT_OPTIONS_NODE_V2.0]
 * وحدة منصات التشغيل السيادية — Nexus V2
 */
export function DeploymentOptions({ onInstallPWA, deferredPrompt }: DeploymentOptionsProps) {
  const OPTIONS: Option[] = [
    {
      id: 'pwa',
      title: 'تطبيق نكسوس (PWA)',
      desc: 'ثبت نسخة الويب المتقدمة للوصول السريع من شاشتك الرئيسية مع دعم العمل أوفلاين.',
      icon: AppWindow,
      status: 'active',
      badge: 'موصى به',
      badgeColor: 'border-primary/30 text-primary bg-primary/5',
      glowColor: 'hover:shadow-primary/20',
      iconBg: 'bg-gradient-to-br from-primary to-violet-600',
      actionLabel: deferredPrompt ? 'تثبيت على الجهاز' : 'تم التثبيت / غير مدعوم',
      onClick: onInstallPWA,
    },
    {
      id: 'android',
      title: 'تطبيق أندرويد (Native)',
      desc: 'نسخة APK مخصصة للهواتف الذكية مع دعم كامل للتنبيهات العميقة والوصول للمستشعرات.',
      icon: TabletSmartphone,
      status: 'active',
      badge: 'آخر إصدار تلقائي',
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
      glowColor: 'hover:shadow-emerald-500/20',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      actionLabel: 'تحميل التطبيق (APK)',
      href: APK_DOWNLOAD_URL,
    },
    {
      id: 'desktop',
      title: 'نسخة الحاسوب (Desktop)',
      desc: 'تطبيق EXE متكامل للحواسب الشخصية (ويندوز/ماك) يوفر أداء فائقاً ومعالجة محلية.',
      icon: Monitor,
      status: 'building',
      badge: 'تحت البناء',
      badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
      glowColor: '',
      iconBg: 'bg-gradient-to-br from-slate-700 to-slate-800',
      actionLabel: 'قيد الإعداد...',
    },
    {
      id: 'browser',
      title: 'متصفح نكسوس (Sovereign Browser)',
      desc: 'متصفح مبني على نواة نكسوس يوفر تشفيراً عصبياً وتكاملاً مباشراً مع أدوات النظام.',
      icon: Globe,
      status: 'locked',
      badge: 'قيد التطوير',
      badgeColor: 'border-white/10 text-muted-foreground',
      glowColor: '',
      iconBg: 'bg-gradient-to-br from-slate-700 to-slate-800',
      actionLabel: 'قيد المزامنة',
    },
    {
      id: 'os',
      title: 'نظام تشغيل نكسوس (OS)',
      desc: 'النظام البيئي الكامل؛ بيئة عمل متكاملة مبنية على Linux ومحسنة لمعالجة النبضات العصبية.',
      icon: MonitorSmartphone,
      status: 'locked',
      badge: 'مشروع مستقبلي',
      badgeColor: 'border-white/10 text-muted-foreground',
      glowColor: '',
      iconBg: 'bg-gradient-to-br from-slate-700 to-slate-800',
      actionLabel: 'بانتظار البروتوكول',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10 animate-in fade-in duration-500">
      {OPTIONS.map((opt) => (
        <div
          key={opt.id}
          className={cn(
            "group relative glass border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 flex flex-col",
            "hover:border-white/10 hover:shadow-2xl",
            opt.glowColor,
            opt.status === 'locked' && "opacity-50 grayscale",
            opt.status === 'building' && "opacity-70"
          )}
        >
          {/* Glow Effect */}
          {opt.status === 'active' && (
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl",
              opt.id === 'android' ? "bg-emerald-500/5" : "bg-primary/5"
            )} />
          )}

          <div className="p-8 flex flex-col items-center text-center flex-1">
            {/* Icon */}
            <div className={cn(
              "size-20 rounded-2xl flex items-center justify-center mb-6 shadow-2xl",
              "transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
              opt.iconBg
            )}>
              <opt.icon className="size-9 text-white drop-shadow-md" />
            </div>

            {/* Badge */}
            <Badge
              variant="outline"
              className={cn("mb-4 text-[10px] uppercase font-black tracking-widest px-3 py-1", opt.badgeColor)}
            >
              {opt.status === 'building' ? (
                <><Loader2 className="size-2.5 mr-1.5 animate-spin" />{opt.badge}</>
              ) : opt.badge}
            </Badge>

            <h3 className="text-xl font-bold text-white mb-3 leading-tight">{opt.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">{opt.desc}</p>

            {/* Action Button */}
            {opt.href ? (
              <a
                href={opt.href}
                download
                className={cn(
                  "w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all mt-auto",
                  "bg-gradient-to-r from-emerald-600 to-teal-600 text-white",
                  "hover:scale-[1.03] active:scale-95 shadow-xl shadow-emerald-500/20"
                )}
              >
                <Download className="size-4" />
                {opt.actionLabel}
              </a>
            ) : (
              <Button
                disabled={opt.status !== 'active'}
                onClick={opt.onClick}
                className={cn(
                  "w-full h-12 rounded-2xl font-bold text-sm gap-2 transition-all mt-auto",
                  opt.status === 'active'
                    ? "bg-gradient-to-r from-primary to-violet-600 shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95"
                    : opt.status === 'building'
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-not-allowed"
                    : "bg-white/5 text-muted-foreground cursor-not-allowed"
                )}
              >
                {opt.status === 'active' && <Zap className="size-4 fill-current" />}
                {opt.status === 'building' && <Loader2 className="size-4 animate-spin" />}
                {opt.status === 'locked' && <ShieldCheck className="size-4 opacity-40" />}
                {opt.actionLabel}
              </Button>
            )}
          </div>

          {/* Bottom Accent Line for active cards */}
          {opt.status === 'active' && (
            <div className={cn(
              "h-0.5 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              opt.id === 'android' ? "bg-gradient-to-r from-transparent via-emerald-500 to-transparent" : "bg-gradient-to-r from-transparent via-primary to-transparent"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
