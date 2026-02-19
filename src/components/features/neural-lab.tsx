
"use client";

import React, { useState } from "react";
import { Microscope, Zap, Cpu, Activity, ShieldAlert, Terminal, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: NEURAL_LAB_V1]
 * المختبر العصبي - بيئة تجريبية لمحاكاة استجابات الموديلات واختبار جودة الروابط.
 */
export function NeuralLab() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);

  const startSimulation = () => {
    setIsSimulating(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="text-right space-y-2">
        <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 px-4 py-1 uppercase tracking-widest font-bold text-[10px]">Experimental Protocol</Badge>
        <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
          المختبر العصبي
          <Microscope className="text-indigo-400 size-10" />
        </h1>
        <p className="text-muted-foreground text-lg">بيئة محاكاة واختبار لاستقرار الروابط العصبية وكفاءة الموديلات.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 glass border-white/5 rounded-[3rem] p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 size-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32" />
          <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 justify-end">
            مركز التحكم في المحاكاة
            <Terminal className="text-indigo-400" />
          </h3>
          
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-row-reverse">
              {[
                { label: "معدل استجابة الرابط", value: "98.4%", icon: Activity },
                { label: "كفاءة المزامنة", value: "High", icon: Sparkles },
                { label: "حمولة النخاع", value: "12% Capacity", icon: Cpu },
                { label: "بروتوكول الحماية", value: "Quantum Active", icon: ShieldAlert },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center justify-between flex-row-reverse group hover:border-indigo-500/30 transition-all">
                  <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                    <stat.icon className="size-5 text-indigo-400 group-hover:text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{stat.label}</p>
                    <p className="text-lg font-black text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-white/5 space-y-6">
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-sm font-bold text-white">تقدم المحاكاة العصبية</span>
                <span className="text-xs font-mono text-indigo-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/5" />
              <Button 
                onClick={startSimulation} 
                disabled={isSimulating}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20"
              >
                {isSimulating ? <><Loader2 className="mr-2 animate-spin" /> جاري التحليل...</> : <><Zap className="mr-2" /> بدء اختبار المزامنة</>}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="glass border-white/5 rounded-[3rem] p-10 flex flex-col text-right">
          <h3 className="text-xl font-bold text-white mb-6">سجل النشاط التجريبي</h3>
          <div className="space-y-4 flex-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 items-start flex-row-reverse opacity-60">
                <div className="size-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="text-right">
                  <p className="text-xs text-white font-bold">تم اختبار عقدة Gemini Pro #{i}</p>
                  <p className="text-[10px] text-muted-foreground">النتيجة: مزامنة مستقرة بنسبة 100%</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <p className="text-[10px] text-amber-400 font-bold leading-relaxed">تنبيه: كافة الاختبارات في هذا القسم لا تستهلك رصيداً حقيقياً، وهي مخصصة للمعايرة التقنية فقط.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
