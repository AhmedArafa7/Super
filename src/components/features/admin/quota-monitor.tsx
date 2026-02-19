
"use client";

import React from "react";
import { 
  Activity, Cpu, Database, Cloud, Globe, 
  HardDrive, Zap, Gauge, AlertTriangle, ShieldCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: QUOTA_MONITOR_NODE_V1.0]
 * مرصد الموارد السيادي - واجهة مراقبة حية لاستهلاك الـ APIs والمساحات التخزينية.
 */
export function QuotaMonitor({ data }: { data: any }) {
  // بيانات افتراضية للحدود بناءً على التير المجاني (Free Tier)
  const QUOTAS = [
    {
      group: "Neural Engines (AI)",
      items: [
        { label: "Gemini 1.5 Flash", used: 4, limit: 15, unit: "RPM", desc: "طلبات الذكاء الاصطناعي الأساسية", color: "text-blue-400" },
        { label: "Groq Llama 3.3", used: 12, limit: 30, unit: "RPM", desc: "محرك المعالجة الفائقة", color: "text-orange-400" },
        { label: "Imagen 4.0", used: 2, limit: 5, unit: "Img/Hr", desc: "توليد الصور العصبية", color: "text-pink-400" }
      ]
    },
    {
      group: "Storage & Vault",
      items: [
        { label: "Firebase Storage", used: 1.2, limit: 5, unit: "GB", desc: "الصور والملفات الصغيرة", color: "text-emerald-400" },
        { label: "Nexus Vault (Drive)", used: 85, limit: 100, unit: "GB", desc: "مخزن الفيديوهات الضخم", color: "text-indigo-400" }
      ]
    },
    {
      group: "External Nodes (APIs)",
      items: [
        { label: "Aladhan API", used: 450, limit: 1000, unit: "Req/Day", desc: "مزامنة مواقيت الصلاة", color: "text-amber-400" },
        { label: "Quran Cloud", used: 890, limit: 5000, unit: "Req/Day", desc: "استدعاء النصوص العثمانية", color: "text-green-400" }
      ]
    },
    {
      group: "Database Integrity",
      items: [
        { label: "Firestore Reads", used: 12000, limit: 50000, unit: "Ops/Day", desc: "عمليات استدعاء البيانات", color: "text-cyan-400" },
        { label: "Firestore Writes", used: 3500, limit: 20000, unit: "Ops/Day", desc: "عمليات تسجيل البيانات", color: "text-purple-400" }
      ]
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "System Load", val: "12%", icon: Gauge, status: "Optimal" },
          { label: "API Latency", val: "145ms", icon: Activity, status: "Good" },
          { label: "Uptime", val: "99.9%", icon: ShieldCheck, status: "Secure" },
          { label: "Active Connections", val: data?.users?.length || 0, icon: Globe, status: "Live" }
        ].map((v, i) => (
          <Card key={i} className="p-6 glass border-white/5 rounded-3xl flex flex-col gap-2 hover:border-primary/20 transition-all">
            <div className="flex justify-between items-center flex-row-reverse">
              <v.icon className="size-5 text-primary opacity-50" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{v.label}</span>
            </div>
            <p className="text-3xl font-black text-white">{v.val}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-bold text-green-500 uppercase">{v.status}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {QUOTAS.map((group, gIdx) => (
          <Card key={gIdx} className="glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between flex-row-reverse">
              <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">{group.group}</h3>
              <Database className="size-4 text-muted-foreground" />
            </div>
            <div className="p-8 space-y-8">
              {group.items.map((item, iIdx) => {
                const percentage = Math.round((item.used / item.limit) * 100);
                const isWarning = percentage > 80;
                
                return (
                  <div key={iIdx} className="space-y-3">
                    <div className="flex justify-between items-end flex-row-reverse">
                      <div className="text-right">
                        <p className={cn("font-bold text-sm", item.color)}>{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                      <div className="text-left">
                        <span className="text-xl font-black text-white">{item.used}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">/ {item.limit} {item.unit}</span>
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
                      <span className={isWarning ? "text-red-400" : "text-muted-foreground"}>
                        {isWarning ? "CRITICAL LOAD" : "NOMINAL"}
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

      <div className="p-8 glass rounded-[3rem] border border-amber-500/10 bg-amber-500/5 flex flex-col md:flex-row items-center justify-between gap-6 flex-row-reverse">
        <div className="text-right space-y-1">
          <h4 className="text-lg font-bold text-amber-400 flex items-center gap-2 justify-end">
            تنبيه المزامنة التلقائية
            <AlertTriangle className="size-5" />
          </h4>
          <p className="text-sm text-slate-400 max-w-xl">
            يتم تحديث هذه البيانات بناءً على تقديرات الاستهلاك الحالية. في حال الوصول لـ 90% من أي مورد، سيقوم النظام تلقائياً بتفعيل بروتوكول "توفير الطاقة" لضمان استمرار الخدمات الأساسية.
          </p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-500 rounded-xl px-8 h-12 font-black shadow-lg shadow-amber-600/20">
          تفعيل وضع التوفير
        </Button>
      </div>
    </div>
  );
}
