'use client';

import React, { useEffect, useRef, useState } from "react";
import { 
  Bot,
  Sparkles, 
  Trash2, 
  History,
  Zap,
  RotateCcw,
  ShieldAlert,
  Terminal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// New Modular Components & Hooks
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatSettings } from "./chat-settings";
import { GitHubExplorer } from "./github-explorer";
import { useAgentChat, type AgentMessage } from "@/hooks/use-agent-chat";

export function AgentChat() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // UI State
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);

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
    const currentImage = imageDataUri;
    
    setInputValue('');
    setImageDataUri(null);
    
    try {
      await sendToNeuralEngine(currentInput, currentImage);
    } catch (err: any) {
      setInputValue(currentInput); // Restore on failure
      setImageDataUri(currentImage);
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
    <div className="flex h-[650px] bg-slate-900/40 border-t border-white/5 rounded-b-[3rem] overflow-hidden shadow-2xl backdrop-blur-md relative mx-auto max-w-[1600px]">
      
      {/* GitHub Side Panel (Left) */}
      <div className={cn(
        "h-full border-l border-white/5 transition-all duration-500 overflow-hidden bg-slate-950/20",
        showGitHub ? "w-[320px] opacity-100" : "w-0 opacity-0"
      )}>
        <GitHubExplorer />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Engine Settings & GitHub Toggle */}
        <div className="flex flex-col w-full">
          <div className="px-6 py-2 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <ChatSettings 
                showSettings={showSettings}
                setShowSettings={setShowSettings}
                preferredAI={preferredAI}
                setPreferredAI={setPreferredAI}
                autoFallback={autoFallback}
                setAutoFallback={setAutoFallback}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGitHub(!showGitHub)}
                className={cn(
                  "h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  showGitHub ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" : "text-white/40 hover:bg-white/5"
                )}
              >
                <Sparkles className={cn("size-3 mr-2", showGitHub && "animate-pulse")} />
                GitHub Engine
              </Button>
            </div>
            {/* Engine usage info could go here */}
          </div>
        </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-hide bg-slate-950/10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-1000">
            <div className="size-16 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 border border-primary/20 shadow-2xl shadow-primary/20">
              <Bot className="size-8 text-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">NEURAL ARCHITECT</h2>
            <p className="text-white/40 max-w-sm text-sm leading-relaxed">
              المهندس العصبي جاهز تماماً لمعالجة طلباتك البرمجية وبناء مشاريعك بضغطة زر.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        
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
        imageDataUri={imageDataUri}
        onImageChange={setImageDataUri}
      />

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
    </div>
  );
}
