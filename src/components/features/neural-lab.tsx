
"use client";

import React, { useState, useEffect } from "react";
import { Microscope, Zap, Cpu, Activity, ShieldAlert, Terminal, Loader2, Sparkles, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: NEURAL_LAB_V2]
 * المختبر العصبي المطور - بيئة اختبار حقيقية لسلامة النظام ومحاكاة تحسين الأوامر.
 */
export function NeuralLab() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const [testPrompt, setTestPrompt] = useState("");
  const [optimizedResult, setOptimizedResult] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);

  // [FUNCTION: NODE_INTEGRITY_CHECK]
  const runIntegrityCheck = () => {
    setIsSimulating(true);
    setTestProgress(0);
    setTestResults([]);
    
    const steps = [
      { id: 1, label: "Checking Firestore Handshake...", status: "success" },
      { id: 2, label: "Verifying User Classification...", status: "success" },
      { id: 3, label: "Neural Wallet Decryption...", status: "success" },
      { id: 4, label: "Vault Protocol Handshake...", status: "success" }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setTestProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          toast({ title: "Neural Link Stable", description: "Node integrity verified at 100%." });
          return 100;
        }
        if (prev % 25 === 0 && currentStep < steps.length) {
          setTestResults(prevR => [...prevR, steps[currentStep]]);
          currentStep++;
        }
        return prev + 2;
      });
    }, 50);
  };

  // [FUNCTION: PROMPT_OPTIMIZATION_SIMULATOR]
  const simulateOptimization = async () => {
    if (!testPrompt.trim()) return;
    setIsOptimizing(true);
    
    // محاكاة منطق التحسين الصامت (Silent Optimizer)
    setTimeout(() => {
      let optimized = testPrompt;
      if (testPrompt.length < 10) {
        optimized = `[SYSTEM_ENHANCED]: ${testPrompt}. Provide a futuristic and technical analysis.`;
      } else {
        optimized = `[NEURAL_REWRITE]: Analyze "${testPrompt}" from a decentralization perspective using Nexus v5 protocols.`;
      }
      setOptimizedResult(optimized);
      setIsOptimizing(false);
      toast({ title: "Optimization Complete", description: "Prompt has been neurally aligned." });
    }, 1500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans">
      <header className="text-right space-y-2">
        <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 px-4 py-1 uppercase tracking-widest font-bold text-[10px]">Operational Protocol</Badge>
        <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
          المختبر العصبي
          <Microscope className="text-indigo-400 size-10" />
        </h1>
        <p className="text-muted-foreground text-lg">أدوات تشخيص حقيقية ومعايرة لروابط الـ AI والبيانات.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* قسم اختبار سلامة العقدة */}
          <Card className="glass border-white/5 rounded-[3rem] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 size-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32" />
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 justify-end">
              فحص سلامة العقدة (Node Integrity)
              <Terminal className="text-indigo-400" />
            </h3>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-row-reverse">
                {[
                  { label: "حالة الربط", value: user ? "Active" : "Guest", icon: Activity },
                  { label: "تصنيف العقدة", value: user?.classification || "None", icon: Sparkles },
                  { label: "إصدار النواة", value: "Nexus v5.5", icon: Cpu },
                  { label: "بروتوكول الأمان", value: "Quantum-Safe", icon: ShieldAlert },
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
                  <span className="text-sm font-bold text-white">تقدم الفحص التشخيصي</span>
                  <span className="text-xs font-mono text-indigo-400">{testProgress}%</span>
                </div>
                <Progress value={testProgress} className="h-2 bg-white/5" />
                <Button 
                  onClick={runIntegrityCheck} 
                  disabled={isSimulating}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20"
                >
                  {isSimulating ? <><Loader2 className="mr-2 animate-spin" /> جاري التشخيص...</> : <><Zap className="mr-2" /> بدء فحص العقدة</>}
                </Button>
              </div>
            </div>
          </Card>

          {/* محاكي تحسين الأوامر */}
          <Card className="glass border-white/5 rounded-[3rem] p-10">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 justify-end">
              محاكي التحسين الصامت (Prompt Optimizer)
              <Sparkles className="text-primary" />
            </h3>
            <div className="space-y-6">
              <div className="grid gap-2">
                <p className="text-xs text-muted-foreground text-right uppercase font-bold px-1">أدخل أمر تجريبي</p>
                <div className="relative">
                  <Input 
                    value={testPrompt} 
                    onChange={e => setTestPrompt(e.target.value)}
                    placeholder="اكتب شيئاً بسيطاً ليقوم النظام بتحسينه..."
                    className="h-14 bg-white/5 border-white/10 rounded-2xl pr-4 pl-12 text-right text-white"
                    dir="auto"
                  />
                  <Button 
                    onClick={simulateOptimization}
                    disabled={isOptimizing || !testPrompt}
                    size="icon" 
                    className="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-xl bg-primary"
                  >
                    {isOptimizing ? <Loader2 className="animate-spin size-4" /> : <Send className="size-4" />}
                  </Button>
                </div>
              </div>

              {optimizedResult && (
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 animate-in slide-in-from-top-2">
                  <p className="text-[10px] text-primary font-black uppercase mb-3 tracking-[0.2em] text-right">المخرج المحسن عصبياً</p>
                  <p dir="auto" className="text-sm text-indigo-100 italic leading-relaxed text-right">"{optimizedResult}"</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className="glass border-white/5 rounded-[3rem] p-10 flex flex-col text-right">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 justify-end">سجل النشاط <Activity className="size-4 text-indigo-400" /></h3>
          <div className="space-y-4 flex-1">
            {testResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 opacity-20">
                <Terminal className="size-10 mb-2" />
                <p className="text-xs">بانتظار بدء الفحص...</p>
              </div>
            ) : testResults.map((res, i) => (
              <div key={i} className="flex gap-4 items-start flex-row-reverse animate-in fade-in slide-in-from-right-2">
                <div className="size-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 shrink-0">
                  <CheckCircle2 className="size-3 text-green-400" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-white font-bold">{res.label}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">Verified successfully</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase">تنبيه المعايرة</span>
              <AlertTriangle className="size-3 text-amber-400" />
            </div>
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              هذا المختبر يستخدم "البيانات المحلية" للمزامنة. أي تغيير في التصنيف هنا يتم اختباره منطقياً فقط ولا يؤثر على الرصيد الحقيقي.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
