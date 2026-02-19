
"use client";

import React, { useState } from "react";
import { Zap, Activity, ShieldAlert, Cpu, Terminal, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export function IntegrityCheck({ user }: { user: any }) {
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testResults, setTestResults] = useState<any[]>([]);

  const runCheck = () => {
    setIsSimulating(true);
    setTestProgress(0);
    setTestResults([]);
    
    const steps = [
      { id: 1, label: "Firestore Handshake", status: "success" },
      { id: 2, label: "Neural Wallet Auth", status: "success" },
      { id: 3, label: "Vault Protocol Sync", status: "success" },
      { id: 4, label: "Quantum Key Verification", status: "success" }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setTestProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          toast({ title: "System Stable", description: "All neural links verified." });
          return 100;
        }
        if (prev % 25 === 0 && currentStep < steps.length) {
          setTestResults(prevR => [...prevR, steps[currentStep]]);
          currentStep++;
        }
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="space-y-8">
      <Card className="glass border-white/5 rounded-[3rem] p-10 relative overflow-hidden">
        <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 justify-end">
          فحص سلامة العقدة
          <Terminal className="text-indigo-400" />
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            { label: "حالة الربط", value: user ? "Active" : "Guest", icon: Activity },
            { label: "التصنيف", value: user?.classification || "None", icon: ShieldAlert },
            { label: "النواة", value: "Nexus v5.5", icon: Cpu },
            { label: "الأمان", value: "Quantum-Safe", icon: ShieldAlert },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center justify-between flex-row-reverse">
              <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <stat.icon className="size-5 text-indigo-400" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">{stat.label}</p>
                <p className="text-lg font-black text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6 pt-6 border-t border-white/5">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-sm font-bold text-white">تقدم التشخيص</span>
            <span className="text-xs font-mono text-indigo-400">{testProgress}%</span>
          </div>
          <Progress value={testProgress} className="h-2 bg-white/5" />
          <Button 
            onClick={runCheck} 
            disabled={isSimulating}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg"
          >
            {isSimulating ? <Loader2 className="mr-2 animate-spin" /> : <Zap className="mr-2" />}
            {isSimulating ? "جاري التشخيص..." : "بدء فحص العقدة"}
          </Button>
        </div>
      </Card>

      <Card className="glass border-white/5 rounded-[2.5rem] p-8">
        <h4 className="text-sm font-bold text-muted-foreground mb-4 text-right uppercase tracking-widest">سجل النشاط الحي</h4>
        <div className="space-y-3">
          {testResults.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10 opacity-30 italic">بانتظار تفعيل بروتوكول الفحص...</p>
          ) : (
            testResults.map((res, i) => (
              <div key={i} className="flex items-center gap-3 flex-row-reverse text-right animate-in fade-in slide-in-from-right-2">
                <CheckCircle2 className="size-4 text-green-400" />
                <span className="text-xs text-white font-medium">{res.label} Verified</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
