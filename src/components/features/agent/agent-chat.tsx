'use client';

import React, { useEffect, useRef, useState } from "react";
import { Bot, Sparkles, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
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

// New Modular Components & Hooks
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatSettings } from "./chat-settings";
import { useAgentChat } from "@/hooks/use-agent-chat";

export function AgentChat() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // UI State
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Neural Orchestration Hook
  const {
    messages,
    isLoading,
    handleSend: sendToNeuralEngine,
    reload,
    stop: stopGeneration,
    preferredAI,
    setPreferredAI,
    autoFallback,
    setAutoFallback
  } = useAgentChat(() => setShowQuotaDialog(true));

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const currentInput = inputValue;
    setInputValue('');
    
    try {
      await sendToNeuralEngine(currentInput);
    } catch (err: any) {
      setInputValue(currentInput); // Restore on failure
    }
  };

  const handleSwitchToGroq = () => {
    setPreferredAI('groq');
    setShowQuotaDialog(false);
    toast({ title: "تم التبديل إلى Groq", description: "جاري إعادة توجيه الطلب عصبياً..." });
    setTimeout(() => reload(), 100);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[600px] bg-slate-900/40 border-t border-white/5 rounded-b-[3rem] overflow-hidden shadow-2xl backdrop-blur-md">
      
      {/* Engine Settings Component */}
      <ChatSettings 
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        preferredAI={preferredAI}
        setPreferredAI={setPreferredAI}
        autoFallback={autoFallback}
        setAutoFallback={setAutoFallback}
      />

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40 animate-pulse-slow">
            <Bot className="size-16 mb-6 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            <h2 className="text-2xl font-headline tracking-widest text-white mb-2">NEURAL ARCHITECT</h2>
            <p className="text-sm font-medium text-slate-400 max-w-xs leading-relaxed">المهندس العصبي جاهز تماماً لمعالجة وبناء طلباتك البرمجية.</p>
          </div>
        )}
        
        {messages.map((m: any) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        
        {isLoading && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex gap-4 max-w-4xl mx-auto" dir="rtl">
            <div className="size-10 rounded-2xl bg-white/5 animate-pulse" />
            <div className="flex flex-col gap-2">
              <div className="h-10 w-48 bg-white/5 rounded-2xl animate-pulse" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Modern Chat Input Component */}
      <ChatInput 
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        isLoading={isLoading}
        onStop={stopGeneration}
      />

      {/* Advanced Quota Consent Dialog */}
      <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <DialogContent className="glass border-white/10 text-white rounded-[2.5rem] p-8 max-w-md">
          <div dir="rtl">
            <DialogHeader className="mb-6">
              <ShieldAlert className="size-16 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(252,211,77,0.5)]" />
              <DialogTitle className="text-3xl font-bold text-center text-white">تجاوزت الحد الأقصى</DialogTitle>
              <DialogDescription className="text-center text-white/70 mt-2 text-base leading-relaxed">
                لقد تجاوزت الحد الأقصى لعدد الطلبات المجانية. يمكنك التبديل إلى Groq للاستمرار في استخدام المهندس العصبي.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-3 mt-8">
              <Button onClick={handleSwitchToGroq} className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-bold h-14 rounded-2xl text-lg shadow-xl shadow-primary/20">
                تشغيل Groq الآن
              </Button>
              <Button variant="ghost" onClick={() => setShowQuotaDialog(false)} className="w-full h-14 rounded-2xl text-white/40 hover:text-white hover:bg-white/5">
                إلغاء والانتظار
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
