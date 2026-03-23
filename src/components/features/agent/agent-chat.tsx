'use client';

import React, { useEffect, useRef, useState } from "react";
import { Wand2, Loader2, Sparkles, Bot, User, Settings2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAgentStore } from "@/lib/agent-store";
import { useToast } from "@/hooks/use-toast";
import { useChat } from '@ai-sdk/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AgentMessage {
  id: string;
  role: string;
  content: string;
  toolInvocations?: any[];
}

interface AgentChatResult {
  messages: AgentMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setInput: (value: string) => void;
  append: (message: any) => Promise<any>;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  reload: () => void;
}

export function AgentChat() {
  const { 
    setFiles, addLog, preferredAI, setPreferredAI, autoFallback, setAutoFallback 
  } = useAgentStore();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, setInput, append, isLoading, reload } = useChat({
    api: '/api/agent',
    body: { preferredAI, autoFallback },
    onResponse: (response: any) => {
      if (response.status === 429) {
        setShowQuotaDialog(true);
      }
    },
    onFinish: ({ message }: any) => {
      const msg = message as AgentMessage;
      if (msg.toolInvocations) {
        msg.toolInvocations.forEach((toolCall: any) => {
          if (toolCall.toolName === 'update_workspace_files' && 'args' in toolCall) {
            const payload = toolCall.args as any;
            if (payload.files && payload.files.length > 0) {
              setFiles(payload.files);
              addLog(`قام المهندس بتحديث ${payload.files.length} ملفات: ${payload.explanation}`, 'success');
            }
          }
        });
      }
    },
    onError: (err: any) => {
      if (!showQuotaDialog) {
        addLog("فشل في الاتصال بمحرك الذكاء الاصطناعي.", 'error');
        toast({ variant: "destructive", title: "خطأ في المعالجة" });
      }
    }
  } as any) as unknown as AgentChatResult;

  const handleSwitchToGroq = () => {
    setPreferredAI('groq');
    setShowQuotaDialog(false);
    toast({ title: "تم التبديل إلى Groq", description: "جاري إعادة معالجة طلبك..." });
    setTimeout(() => reload(), 100);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[500px] bg-slate-900/40 border-t border-white/5 rounded-b-[2.5rem]">
      {/* Settings Bar */}
      <div className="px-6 py-2 border-b border-white/5 flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-white/40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1 transition-colors ${showSettings ? 'text-primary' : 'hover:text-white'}`}
          >
            <Settings2 className="size-3" />
            إعدادات المحرك
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span>المحرك الحالي:</span>
          <span className="text-primary">{preferredAI === 'gemini' ? 'Gemini 1.5' : 'Groq (Llama)'}</span>
        </div>
      </div>

      {showSettings && (
        <div className="px-8 py-4 bg-white/5 border-b border-white/5 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label className="text-white">التبديل التلقائي (Auto-Fallback)</Label>
                <p className="text-[11px] text-muted-foreground">التحويل لـ Groq تلقائياً عند نفاذ حصة Gemini دون سؤالك.</p>
              </div>
              <Switch checked={autoFallback} onCheckedChange={setAutoFallback} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white">المحرك المفضل</Label>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={preferredAI === 'gemini' ? 'default' : 'outline'}
                  onClick={() => setPreferredAI('gemini')}
                  className="h-8 text-[10px]"
                >Gemini</Button>
                <Button 
                  size="sm"
                  variant={preferredAI === 'groq' ? 'default' : 'outline'}
                  onClick={() => setPreferredAI('groq')}
                  className="h-8 text-[10px]"
                >Groq</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
            <Bot className="size-12 mb-4 text-primary" />
            <p className="text-xl font-headline">المهندس العصبي جاهز بالكامل لطلباتك البرمجية.</p>
          </div>
        )}
        
        {messages.map((m: AgentMessage) => (
          <div key={m.id} className={`flex gap-4 max-w-4xl mx-auto ${m.role === 'user' ? 'flex-row-reverse' : ''}`} dir="rtl">
            <div className={`shrink-0 size-10 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-primary/20 text-primary'}`}>
              {m.role === 'user' ? <User className="size-5" /> : <Bot className="size-5" />}
            </div>
            <div className="flex flex-col gap-1 max-w-[85%] items-start text-right">
              <div dangerouslySetInnerHTML={{ __html: (m.content || '').replace(/\n/g, '<br/>') }} className="text-white text-base leading-relaxed p-4 bg-white/5 rounded-2xl" />
            </div>
          </div>
        ))}
        {isLoading && <div className="animate-pulse flex gap-4 max-w-4xl mx-auto" dir="rtl">
          <div className="size-10 rounded-full bg-white/5" />
          <div className="h-12 w-32 bg-white/5 rounded-2xl" />
        </div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/5">
        <form 
          onSubmit={handleSubmit}
          className="flex gap-4 items-center max-w-4xl mx-auto flex-row-reverse"
        >
          <Button type="submit" disabled={isLoading || !input?.trim()} className="size-14 rounded-2xl bg-primary shadow-xl">
            {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
          </Button>
          <Input 
            value={input} 
            onChange={handleInputChange}
            placeholder="أمر البرمجة..."
            className="h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-right text-white"
            dir="rtl"
            disabled={isLoading}
          />
        </form>
      </div>

      {/* Quota Consent Dialog */}
      <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <DialogContent className="glass border-white/10 text-white rounded-[2rem]">
          <div dir="rtl">
          <DialogHeader>
            <div className="flex items-center gap-3 text-amber-400 mb-2">
              <ShieldAlert className="size-6" />
              <DialogTitle className="text-2xl font-headline">نفاد الحصة المجانية</DialogTitle>
            </div>
            <DialogDescription className="text-white/70 text-right leading-relaxed text-lg">
              نأسف، لقد استهلكت الحصة المجانية المتاحة لـ **Gemini** حالياً. 
              <br/>هل تود التبديل إلى محرك **Groq (Llama 3)** فوراً لإكمال المهمة؟ 
              <br/><span className="text-[12px] opacity-60">أو يمكنك الانتظار حتى تتجدد الحصة لاحقاً.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-6">
            <Button onClick={handleSwitchToGroq} className="flex-1 bg-primary text-lg h-12">
              استخدام Groq فوراً
            </Button>
            <Button variant="outline" onClick={() => setShowQuotaDialog(false)} className="flex-1 h-12">
              إلغاء والانتظار
            </Button>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
