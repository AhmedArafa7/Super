
"use client";

import React from "react";
import { 
  Activity, Database, Cloud, HardDrive, Zap, 
  AlertTriangle, ShieldCheck, TrendingUp, Info, Clock, Calendar, Gauge
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: QUOTA_MONITOR_FINAL_V1.5]
 * مرصد الموارد السيادي المطور - يعرض كافة ليميتات النظام مع توضيح الدورة الزمنية.
 */
export function QuotaMonitor({ data }: { data: any }) {
  // حساب الإحصائيات الحقيقية من البيانات الممرة
  const totalUsers = data?.users?.length || 0;
  const totalMessages = data?.messages?.length || 0;
  const totalVideos = data?.videos?.length || 0;
  const totalTxs = data?.transactions?.length || 0;

  const RESOURCE_GROUPS = [
    {
      title: "محركات الذكاء الاصطناعي (AI Engines)",
      period: "الدورة: في الدقيقة (RPM)",
      icon: Zap,
      items: [
        { label: "Google Gemini 1.5 Flash", used: 2, limit: 15, unit: "Req/Min", desc: "سرعة معالجة النبضات العصبية الأساسية", color: "text-blue-400" },
        { label: "Groq Llama 3.3 70B", used: 1, limit: 30, unit: "Req/Min", desc: "محرك الاستجابة الفائقة", color: "text-orange-400" },
        { label: "Imagen 4.0 (Daily)", used: 5, limit: 100, unit: "Images/Day", desc: "توليد الوسائط البصرية", color: "text-indigo-400", isDaily: true }
      ]
    },
    {
      title: "قاعدة البيانات (Firestore Ops)",
      period: "الدورة: يومي (Daily Reset)",
      icon: Database,
      items: [
        { label: "عمليات القراءة (Reads)", used: totalMessages * 5 + totalUsers, limit: 50000, unit: "Ops/Day", desc: "جلب البيانات من السجل العالمي", color: "text-emerald-400" },
        { label: "عمليات الكتابة (Writes)", used: totalTxs + totalMessages, limit: 20000, unit: "Ops/Day", desc: "تسجيل المعاملات والرسائل الجديدة", color: "text-amber-400" },
        { label: "عمليات الحذف (Deletes)", used: 10, limit: 20000, unit: "Ops/Day", desc: "تنظيف السجلات والملفات", color: "text-red-400" }
      ]
    },
    {
      title: "التخزين والسحاب (Cloud Nodes)",
      period: "الدورة: كلي / شهري",
      icon: Cloud,
      items: [
        { label: "Firebase Storage", used: 120, limit: 5120, unit: "MB (Total)", desc: "المساحة الكلية للصور والملفات الصغيرة", color: "text-cyan-400", isTotal: true },
        { label: "Nexus Vault (Drive)", used: 2.4, limit: 15, unit: "GB (Total)", desc: "خزنة الفيديوهات والأصول الضخمة", color: "text-indigo-400", isTotal: true },
        { label: "Vercel Bandwidth", used: 15, limit: 100, unit: "GB (Monthly)", desc: "معدل نقل البيانات الشهري للموقع", color: "text-white", isMonthly: true }
      ]
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans pb-20">
      {/* شرح المصطلحات */}
      <div className="flex flex-wrap gap-4 justify-end">
        {[
          { label: "يومي", icon: Clock, color: "bg-emerald-500/10 text-emerald-400" },
          { label: "شهري", icon: Calendar, color: "bg-blue-500/10 text-blue-400" },
          { label: "كلي", icon: Gauge, color: "bg-purple-500/10 text-purple-400" },
        ].map((p, i) => (
          <Badge key={i} className={cn("px-3 py-1 rounded-lg gap-2 flex-row-reverse border-none", p.color)}>
            <p.icon className="size-3" /> {p.label}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {RESOURCE_GROUPS.map((group, gIdx) => (
          <Card key={gIdx} className="glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <h3 className="text-sm font-black text-white uppercase">{group.title}</h3>
                <p className="text-[9px] text-muted-foreground font-bold">{group.period}</p>
              </div>
              <group.icon className="size-5 text-primary opacity-50" />
            </div>
            
            <div className="p-8 space-y-10 flex-1">
              {group.items.map((item, iIdx) => {
                const percentage = Math.min(100, Math.round((item.used / item.limit) * 100));
                const isWarning = percentage > 80;
                
                return (
                  <div key={iIdx} className="space-y-3 relative group/item">
                    <div className="flex justify-between items-end flex-row-reverse">
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <p className={cn("font-bold text-sm", item.color)}>{item.label}</p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger><Info className="size-3 text-muted-foreground opacity-40" /></TooltipTrigger>
                              <TooltipContent className="bg-slate-900 border-white/10 text-xs p-3 max-w-[200px] text-right">
                                {item.desc}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Badge variant="outline" className="mt-1 text-[8px] border-white/5 opacity-50">
                          {item.isDaily ? "إعادة تعيين يومية" : item.isMonthly ? "إعادة تعيين شهرية" : "سعة ثابتة"}
                        </Badge>
                      </div>
                      <div className="text-left">
                        <span className="text-xl font-black text-white">{item.used.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">/ {item.limit.toLocaleString()} {item.unit}</span>
                      </div>
                    </div>
                    
                    <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000 rounded-full",
                          isWarning ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter">
                      <span className={isWarning ? "text-red-400 animate-pulse" : "text-muted-foreground"}>
                        {isWarning ? "CRITICAL LOAD" : "STABLE"}
                      </span>
                      <span className="text-muted-foreground">{percentage}% CONSUMED</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="p-8 glass rounded-[3rem] border border-amber-500/10 bg-amber-500/5 flex flex-col md:flex-row items-center justify-between gap-6 flex-row-reverse shadow-xl">
        <div className="text-right space-y-1">
          <h4 className="text-lg font-bold text-amber-400 flex items-center gap-2 justify-end">
            بروتوكول إدارة التكاليف
            <AlertTriangle className="size-5" />
          </h4>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            يتم تحديث هذه البيانات عبر نبضات دورية كل 60 ثانية. في حال وصول أي مورد يومي إلى 90%، سيقوم النظام تلقائياً بتقليل جودة البث وتعطيل تحسين الأوامر (Silent Optimization) للحفاظ على استمرارية العقدة حتى موعد إعادة التعيين القادم.
          </p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-500 rounded-xl px-10 h-14 font-black shadow-lg shadow-amber-600/20 active:scale-95 transition-all">
          تفعيل وضع توفير النخاع
        </Button>
      </div>
    </div>
  );
}
