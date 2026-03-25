'use client';

import React from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ChatSettingsProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  preferredAI: 'gemini' | 'groq';
  setPreferredAI: (ai: 'gemini' | 'groq') => void;
  autoFallback: boolean;
  setAutoFallback: (val: boolean) => void;
}

export function ChatSettings({
  showSettings,
  setShowSettings,
  preferredAI,
  setPreferredAI,
  autoFallback,
  setAutoFallback
}: ChatSettingsProps) {
  return (
    <div className="flex flex-col w-full">
      {/* Settings Bar */}
      <div className="px-6 py-2 border-b border-white/5 flex justify-between items-center text-[10px] uppercase tracking-wider font-extrabold text-white/30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "flex items-center gap-2 transition-all p-1 px-2 rounded-md",
              showSettings ? "text-primary bg-primary/10 shadow-[0_0_10px_rgba(var(--primary),0.2)]" : "hover:text-white"
            )}
          >
            <Settings2 className={cn("size-3 animate-pulse-slow", showSettings && "animate-spin-slow")} />
            إعدادات المحرك العصبى
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span>المحرك المعتمد:</span>
          <span className="text-primary font-black drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]">
            {preferredAI === 'gemini' ? 'Gemini 2.5 Pro+' : 'Groq Llama 3.3'}
          </span>
        </div>
      </div>

      {showSettings && (
        <div className="px-8 py-6 bg-slate-900/60 border-b border-white/10 animate-in slide-in-from-top duration-500 backdrop-blur-xl">
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5">
              <div className="flex flex-col gap-1">
                <Label className="text-white font-bold text-sm">التبديل التلقائي (Auto-Fallback)</Label>
                <p className="text-[11px] text-muted-foreground opacity-60">التحويل لـ Groq تلقائياً عند نفاذ حصة Gemini لضمان استمرارية البناء.</p>
              </div>
              <Switch checked={autoFallback} onCheckedChange={setAutoFallback} className="data-[state=checked]:bg-primary" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5">
              <div className="flex flex-col gap-1 text-right">
                <Label className="text-white font-bold text-sm">تخصيص المحرك (AI Provider)</Label>
                <p className="text-[11px] text-muted-foreground opacity-60">اختر المحرك الذي تفضله لمهام المعالجة العصبية.</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={preferredAI === 'gemini' ? 'default' : 'outline'}
                  onClick={() => setPreferredAI('gemini')}
                  className={cn(
                    "h-9 px-6 text-[11px] font-bold rounded-xl transition-all",
                    preferredAI === 'gemini' ? "bg-primary shadow-lg shadow-primary/20" : "border-white/10 hover:bg-white/5"
                  )}
                >Gemini</Button>
                <Button 
                  size="sm"
                  variant={preferredAI === 'groq' ? 'default' : 'outline'}
                  onClick={() => setPreferredAI('groq')}
                  className={cn(
                    "h-9 px-6 text-[11px] font-bold rounded-xl transition-all",
                    preferredAI === 'groq' ? "bg-primary shadow-lg shadow-primary/20" : "border-white/10 hover:bg-white/5"
                  )}
                >Groq</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
