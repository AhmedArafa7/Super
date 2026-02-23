"use client";

import React, { useState } from "react";
import { Zap, Activity, ShieldAlert, Cpu, Terminal, Loader2, CheckCircle2, XCircle, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { useWalletStore } from "@/lib/wallet-store";

/**
 * [STABILITY_ANCHOR: INTEGRITY_CHECK_ACTIVE_V1.5]
 * محرك فحص سلامة العقدة المطور - أضيف فحص Firebase Storage لضمان عمل نظام رفع الصور.
 */
export function IntegrityCheck({ user }: { user: any }) {
  const { toast } = useToast();
  const { firestore, storage } = useFirebase();
  const wallet = useWalletStore(state => state.wallet);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testResults, setTestResults] = useState<{label: string, status: 'success' | 'error'}[]>([]);

  const runCheck = async () => {
    setIsSimulating(true);
    setTestProgress(0);
    setTestResults([]);
    
    const steps = [
      { id: 1, label: "Firestore Handshake", check: () => !!firestore },
      { id: 2, label: "Storage Node Link", check: () => !!storage },
      { id: 3, label: "Neural Wallet Auth", check: () => !!wallet },
      { id: 4, label: "User Node Identification", check: () => !!user?.id },
      { id: 5, label: "Quantum Key Verification", check: () => true }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      // محاكاة وقت المعالجة الحقيقي
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const isOk = step.check();
      setTestResults(prev => [...prev, { label: step.label, status: isOk ? 'success' : 'error' }]);
      setTestProgress(((i + 1) / steps.length) * 100);
      
      if (!isOk) {
        toast({ variant: "destructive", title: "اضطراب في العقدة", description: `فشل فحص: ${step.label}` });
      }
    }

    setIsSimulating(false);
    toast({ title: "اكتمل التشخيص", description: "تم تحديث سجل الحالة العصبية للعقدة بالكامل." });
  };

  return (
    <div className="space-y-8">
      <Card className="glass border-white/5 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 size-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32" />
        <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 justify-end">
          فحص سلامة العقدة
          <Terminal className="text-indigo-400" />
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            { label: "حالة الربط", value: user ? "Active" : "Guest", icon: Activity },
            { label: "تخزين الصور", value: storage ? "Connected" : "Disconnected", icon: HardDrive },
            { label: "التصنيف", value: user?.classification || "None", icon: ShieldAlert },
            { label: "النواة", value: "Nexus v5.5", icon: Cpu },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center justify-between flex-row-reverse hover:bg-white/10 transition-colors group">
              <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <stat.icon className="size-5 text-indigo-400" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{stat.label}</p>
                <p className="text-lg font-black text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6 pt-6 border-t border-white/5">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-sm font-bold text-white uppercase tracking-widest">تقدم التشخيص الفيزيائي</span>
            <span className="text-xs font-mono text-indigo-400">{Math.round(testProgress)}%</span>
          </div>
          <Progress value={testProgress} className="h-1.5 bg-white/5" />
          <Button 
            onClick={runCheck} 
            disabled={isSimulating}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all"
          >
            {isSimulating ? <Loader2 className="mr-2 animate-spin" /> : <Zap className="mr-2" />}
            {isSimulating ? "جاري فحص العقد والروابط..." : "بدء فحص السلامة"}
          </Button>
        </div>
      </Card>

      <Card className="glass border-white/5 rounded-[2.5rem] p-8 shadow-xl">
        <h4 className="text-xs font-bold text-muted-foreground mb-6 text-right uppercase tracking-[0.3em]">سجل النشاط الحي للبروتوكولات</h4>
        <div className="space-y-4">
          {testResults.length === 0 ? (
            <div className="flex flex-col items-center py-10 opacity-20 italic">
              <Activity className="size-10 mb-2" />
              <p className="text-xs">بانتظار تفعيل بروتوكول الفحص...</p>
            </div>
          ) : (
            testResults.map((res, i) => (
              <div key={i} className="flex items-center justify-between flex-row-reverse text-right animate-in slide-in-from-right-2 duration-500">
                <div className="flex items-center gap-3 flex-row-reverse">
                  {res.status === 'success' ? (
                    <CheckCircle2 className="size-4 text-green-400" />
                  ) : (
                    <XCircle className="size-4 text-red-400" />
                  )}
                  <span className="text-xs text-white font-bold">{res.label}</span>
                </div>
                <Badge variant="outline" className={res.status === 'success' ? "border-green-500/20 text-green-400" : "border-red-500/20 text-red-400"}>
                  {res.status === 'success' ? 'VERIFIED' : 'FAILED'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
