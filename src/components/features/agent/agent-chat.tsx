
'use client';

import React, { useState } from "react";
import { Wand2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAgentStore } from "@/lib/agent-store";
import { processAgentTask } from "@/ai/flows/agent-ai-flows";
import { useToast } from "@/hooks/use-toast";

export function AgentChat() {
  const [input, setInput] = useState("");
  const { files, setFiles, addLog, isProcessing, setIsProcessing } = useAgentStore();
  const { toast } = useToast();

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const task = input;
    setInput("");
    setIsProcessing(true);
    addLog(`جاري تحليل الطلب البرمجي: ${task}`, 'info');

    try {
      addLog("جاري استدعاء المهندس العصبي...", 'neural');
      const result = await processAgentTask({
        instruction: task,
        currentFiles: files.map(f => ({ path: f.path, content: f.content }))
      });

      if (result.files && result.files.length > 0) {
        setFiles(result.files);
        addLog(`اكتمل البناء. تم تحديث ${result.files.length} ملفات.`, 'success');
        result.steps.forEach(step => addLog(step, 'info'));
      }
      
      toast({ title: "تم التحديث عصبياً", description: result.explanation });
    } catch (err) {
      addLog("فشل الوكيل في المزامنة البرمجية.", 'error');
      toast({ variant: "destructive", title: "خطأ في المعالجة" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900/40 border-t border-white/5 rounded-b-[2.5rem]">
      <div className="flex gap-4 items-center max-w-4xl mx-auto">
        <div className="relative flex-1">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="أمر المهندس: 'اصنع لي صفحة تسجيل دخول' أو 'عدل ملف index.js'..."
            className="h-14 bg-white/5 border-white/10 rounded-2xl pr-6 pl-14 text-right text-white shadow-inner focus-visible:ring-primary"
            dir="auto"
            disabled={isProcessing}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Sparkles className="size-5 text-indigo-400 opacity-50" />
          </div>
        </div>
        <Button 
          onClick={handleSend} 
          disabled={isProcessing || !input.trim()}
          className="size-14 rounded-2xl bg-primary shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          {isProcessing ? <Loader2 className="animate-spin" /> : <Wand2 className="size-6" />}
        </Button>
      </div>
    </div>
  );
}
