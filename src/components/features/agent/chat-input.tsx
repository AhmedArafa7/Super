'use client';

import React from "react";
import { Wand2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export function ChatInput({ value, onChange, onSend, isLoading }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-6 border-t border-white/5 bg-slate-900/20 backdrop-blur-sm">
      <div className="flex gap-4 items-center max-w-4xl mx-auto flex-row-reverse">
        <Button 
          onClick={onSend}
          disabled={isLoading || !value.trim()} 
          className="size-14 rounded-2xl bg-gradient-to-r from-primary to-blue-600 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 group"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Send className="size-6 rotate-180 group-hover:translate-x-1 transition-transform" />
          )}
        </Button>
        <div className="relative flex-1">
          <Input 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="أمر البرمجة... (مثلاً: ابدأ بناء مشروع جديد)"
            className="h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-right text-white focus:bg-white/10 transition-all border-none ring-1 ring-white/5 focus:ring-primary/40 placeholder:text-white/20"
            dir="rtl"
            disabled={isLoading}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
             <Wand2 className="size-4" />
          </div>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-[9px] uppercase tracking-widest font-black text-white/10">Neural Interface v2.5.0</p>
      </div>
    </div>
  );
}
