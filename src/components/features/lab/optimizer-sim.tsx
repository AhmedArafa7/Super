
"use client";

import React, { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function OptimizerSim() {
  const { toast } = useToast();
  const [testPrompt, setTestPrompt] = useState("");
  const [optimizedResult, setOptimizedResult] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);

  const simulate = async () => {
    if (!testPrompt.trim()) return;
    setIsOptimizing(true);
    
    // محاكاة منطق المحسن الصامت من المانيفستو v5.5
    setTimeout(() => {
      let optimized = testPrompt;
      if (testPrompt.length < 10) {
        optimized = `[Nexus_Optimize]: ${testPrompt}. Provide high-fidelity technical synchronization steps.`;
      } else {
        optimized = `[Neural_Rewrite]: Architect a decentralized strategy for "${testPrompt}" using Nexus v5.5 protocols.`;
      }
      setOptimizedResult(optimized);
      setIsOptimizing(false);
      toast({ title: "Optimization Stable", description: "Prompt has been neurally aligned." });
    }, 1200);
  };

  return (
    <Card className="glass border-white/5 rounded-[3rem] p-10">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 justify-end">
        محاكي التحسين الصامت
        <Sparkles className="text-primary" />
      </h3>
      
      <div className="space-y-6">
        <div className="grid gap-2">
          <p className="text-[10px] text-muted-foreground text-right uppercase font-bold px-1 tracking-widest">أمر تجريبي (Neural Input)</p>
          <div className="relative">
            <Input 
              value={testPrompt} 
              onChange={e => setTestPrompt(e.target.value)}
              placeholder="اكتب أمراً بسيطاً هنا..."
              className="h-14 bg-white/5 border-white/10 rounded-2xl pr-4 pl-12 text-right text-white"
              dir="auto"
            />
            <Button 
              onClick={simulate}
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
            <p className="text-[9px] text-primary font-black uppercase mb-3 tracking-[0.2em] text-right">المخرج المحسن عصبياً</p>
            <p dir="auto" className="text-sm text-indigo-100 italic leading-relaxed text-right font-mono">
              "{optimizedResult}"
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
