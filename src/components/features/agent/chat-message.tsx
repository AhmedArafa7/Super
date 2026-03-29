'use client';

import React from "react";
import { Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AgentMessage } from "@/hooks/use-agent-chat";
import { useAgentStore } from "@/lib/agent-store";

interface ChatMessageProps {
  message: AgentMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const { setActiveFile } = useAgentStore();

  const handleIndicatorClick = () => {
    if (message.files && message.files.length > 0) {
      setActiveFile(message.files[0].path);
    }
  };

  return (
    <div 
      className={cn(
        "flex gap-4 max-w-4xl mx-auto w-full group animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )} 
      dir="rtl"
    >
      {/* Avatar */}
      <div className={cn(
        "shrink-0 size-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
        isUser 
          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white" 
          : "bg-gradient-to-br from-primary to-blue-600 text-white"
      )}>
        {isUser ? <User className="size-5" /> : <Bot className="size-5" />}
      </div>

      {/* Content Container */}
      <div className={cn(
        "flex flex-col gap-2 max-w-[85%] items-start text-right",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Main Text Bubble */}
        <div className={cn(
          "relative p-4 rounded-2xl text-base leading-relaxed shadow-sm transition-all",
          isUser 
            ? "bg-indigo-500/10 text-indigo-50 border border-indigo-500/20 rounded-tr-none" 
            : "bg-white/5 text-slate-100 border border-white/10 rounded-tl-none group-hover:bg-white/[0.07]"
        )}>
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {message.content}
          </div>

          {/* User Image Display */}
          {message.image && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 shadow-lg max-w-md animate-in zoom-in-95 duration-300">
              <img src={message.image} alt="User Upload" className="w-full h-auto block" />
            </div>
          )}
          
          {/* Subtle Timestamp or ID (Optional) */}
          <div className="mt-2 text-[8px] opacity-20 font-mono tracking-tighter">
            NEURAL_ID: {message.id.substring(0, 8)}
          </div>
        </div>
        
        {/* Files Updated Indicator */}
        {message.files && message.files.length > 0 && (
          <div 
            className="w-full mt-1 animate-in zoom-in-95 duration-200 cursor-pointer active:scale-95 transition-transform"
            onClick={handleIndicatorClick}
            title="فتح الملف في المحرر"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl text-xs backdrop-blur-md border bg-emerald-500/5 border-emerald-500/20 text-emerald-200 hover:bg-emerald-500/10 transition-colors">
              <div className="shrink-0">
                <div className="bg-emerald-500/20 p-1 rounded-full">
                  <Sparkles className="size-3 text-emerald-400" />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="font-bold opacity-90">تمت المزامنة العصبية</span>
                <span className="opacity-60 text-[10px]">
                  تم تحديث {message.files.length} ملف في بيئة العمل بنجاح.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Engine badge */}
        {message.engine && (
          <span className="text-[8px] opacity-20 font-mono tracking-tighter">{message.engine}</span>
        )}
      </div>
    </div>
  );
}
