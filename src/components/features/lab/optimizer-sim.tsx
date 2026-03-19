
"use client";

import React, { useState } from "react";
import { Sparkles, Send, Loader2, Wand2, Info, ArrowLeft, RefreshCw, Cpu, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { labOptimizePrompt } from "@/ai/flows/neural-lab-flows";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: OPTIMIZER_SIM_ACTIVE_V1.2]
 * محاكي التحسين الصامت - تم تحسين واجهة الاستجابة وتوضيح دور المستخدم.
 */
export function OptimizerSim() {
  const { toast } = useToast();
  const [testPrompt, setTestPrompt] = useState("");
  const [result, setResult] = useState<{ optimizedPrompt: string, analysis: string } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const simulate = async () => {
    if (!testPrompt.trim() || isOptimizing) return;
    setIsOptimizing(true);
    
    try {
      const output = await labOptimizePrompt({ prompt: testPrompt });
      if (output.success) {
        setResult({
          optimizedPrompt: output.optimizedPrompt || "",
          analysis: output.analysis || ""
        });
        toast({ title: "تمت المعايرة بنجاح", description: "تم مواءمة الأمر مع بروتوكولات نكسوس." });
      } else {
        throw new Error(output.message);
      }
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "فشل التحسين", 
        description: err.message || "حدث اضطراب في الاتصال بالمحرك العصبي." 
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReset = () => {
    setTestPrompt("");
    setResult(null);
  };

  return (
    <Card className="glass border-white/5 rounded-[3rem] p-10 flex flex-col shadow-2xl relative min-h-[500px]">
      <div className="absolute top-0 right-0 size-64 bg-primary/5 blur-[100px] -ml-32 -mt-32" />
      
      <div className="flex items-center justify-between mb-8 flex-row-reverse relative z-10">
        <div className="text-right">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3 flex-row-reverse">
            محاكي التحسين الصامت
            <Sparkles className="text-primary animate-pulse" />
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Manual Prompt Calibration</p>
        </div>
        {result && (
          <Button variant="ghost" size="icon" onClick={handleReset} className="rounded-xl text-muted-foreground hover:text-white bg-white/5">
            <RefreshCw className="size-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-8 flex-1 relative z-10">
        <div className="grid gap-3">
          <p className="text-[10px] text-muted-foreground text-right uppercase font-black px-1 tracking-[0.2em]">أدخل أمرك التجريبي هنا</p>
          <div className="relative">
            <Input 
              value={testPrompt} 
              onChange={e => setTestPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && simulate()}
              placeholder="اكتب أمراً بسيطاً (مثلاً: كيف أطور موقعي؟)"
              className="h-16 bg-white/5 border-white/10 rounded-[1.5rem] pr-6 pl-16 text-right text-white text-lg focus-visible:ring-primary shadow-inner"
              dir="auto"
              disabled={isOptimizing}
            />
            <Button 
              onClick={simulate}
              disabled={isOptimizing || !testPrompt.trim()}
              size="icon" 
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 size-12 rounded-2xl transition-all",
                isOptimizing ? "bg-slate-800" : "bg-primary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
              )}
            >
              {isOptimizing ? <Loader2 className="animate-spin size-5 text-primary" /> : <Wand2 className="size-5" />}
            </Button>
          </div>
        </div>

        {isOptimizing && (
          <div className="flex flex-col items-center justify-center py-12 gap-6 animate-in fade-in duration-500">
            <div className="relative size-20">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] animate-pulse">جاري إعادة الهيكلة العصبية...</p>
              <div className="flex gap-1 justify-center">
                <div className="size-1 bg-primary/40 rounded-full animate-bounce delay-75" />
                <div className="size-1 bg-primary/40 rounded-full animate-bounce delay-150" />
                <div className="size-1 bg-primary/40 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          </div>
        )}

        {result && !isOptimizing && (
          <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="p-8 bg-black/40 rounded-[2rem] border border-primary/20 relative group overflow-hidden shadow-inner">
              <div className="absolute top-0 right-0 p-4">
                <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[8px] font-black">Optimized Pulse</Badge>
              </div>
              <p className="text-[10px] text-primary font-black uppercase mb-4 tracking-[0.2em] text-right flex items-center justify-end gap-2">
                المخرج المحسن عصبياً
                <Activity className="size-3" />
              </p>
              <p dir="auto" className="text-lg text-indigo-100 italic leading-relaxed text-right font-mono">
                "{result.optimizedPrompt}"
              </p>
            </div>

            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-right space-y-3">
              <div className="flex items-center justify-end gap-2 text-indigo-400">
                <span className="text-[9px] font-black uppercase tracking-widest">تقرير التحليل التقني</span>
                <Info className="size-3" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed italic">
                {result.analysis}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-white/5 text-center relative z-10">
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.4em] font-medium">Nexus Lab Protocol v5.5 • AI Engine Active</p>
      </div>
    </Card>
  );
}
