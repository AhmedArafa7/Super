
"use client";

import React, { useState, memo, useEffect, useRef } from "react";
import { 
  Bot, User, MoreVertical, Pencil, Trash2, ChevronDown, 
  ChevronUp, Volume2, Loader2, Zap, Mic2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { WizardMessage } from "@/lib/chat-store";
import { textToNeuralSpeech } from "@/ai/flows/ai-audio-flows";
import { updateUserProfile } from "@/lib/auth-store";

interface ChatMessageProps {
  msg: WizardMessage;
  user: any;
  isInAudioQueue?: boolean;
  isMyTurnToPlay?: boolean;
  onAudioFinished?: () => void;
  onEdit: (m: WizardMessage) => void;
  onDelete: (id: string) => void;
}

/**
 * [STABILITY_ANCHOR: CHAT_MESSAGE_NODE_V2.1]
 * عقدة الرسالة المستقلة - تم تحسين ظهور خيارات التعديل والحذف بوضوح عند التمرير.
 */
export const ChatMessage = memo(({ msg, user, isInAudioQueue, isMyTurnToPlay, onAudioFinished, onEdit, onDelete }: ChatMessageProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [showOptimized, setShowOptimized] = useState(false);
  const [isUsingLocalFallback, setIsUsingLocalFallback] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakLocally = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setHasFailed(true);
      onAudioFinished?.();
      return;
    }

    window.speechSynthesis.cancel();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = /[\u0600-\u06FF]/.test(text) ? 'ar-SA' : 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1;

      utterance.onend = () => {
        setIsSpeaking(false);
        onAudioFinished?.();
      };

      utterance.onerror = () => {
        setHasFailed(true);
        setIsSpeaking(false);
        onAudioFinished?.();
      };

      setIsUsingLocalFallback(true);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setHasFailed(true);
      onAudioFinished?.();
    }
  };

  const handleSpeak = async () => {
    if (!msg.response || audioUrl || hasFailed || isSpeaking) return;
    
    const hasQuota = user?.proTTSRemaining && user.proTTSRemaining > 0;

    if (hasQuota) {
      setIsSpeaking(true);
      try {
        const result = await textToNeuralSpeech(msg.response);
        if (result.success && result.audioUrl) {
          setAudioUrl(result.audioUrl);
          await updateUserProfile(user.id, { proTTSRemaining: user.proTTSRemaining - 1 });
        } else {
          speakLocally(msg.response);
        }
      } catch (e) {
        speakLocally(msg.response);
      } finally {
        setIsSpeaking(false);
      }
    } else {
      setIsSpeaking(true);
      speakLocally(msg.response);
    }
  };

  useEffect(() => {
    if (isInAudioQueue && !audioUrl && !isSpeaking && !hasFailed && !isUsingLocalFallback) {
      handleSpeak();
    }
  }, [isInAudioQueue, audioUrl, hasFailed]);

  useEffect(() => {
    if (isMyTurnToPlay) {
      if (audioUrl && audioRef.current) {
        audioRef.current.play().catch(() => {
          onAudioFinished?.(); 
        });
      } else if (isUsingLocalFallback) {
        // Local engine already running
      } else if (hasFailed) {
        onAudioFinished?.();
      } else {
        handleSpeak();
      }
    }
  }, [isMyTurnToPlay, audioUrl, hasFailed, isUsingLocalFallback]);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-start gap-3 justify-end group relative">
        {/* خيارات الرسالة (تظهر عند التمرير) */}
        <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center self-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-xl hover:bg-white/10 text-muted-foreground">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white rounded-xl shadow-2xl">
              <DropdownMenuItem onClick={() => onEdit(msg)} className="gap-2 flex-row-reverse text-right text-xs py-2.5">
                <Pencil className="size-3.5 text-indigo-400" /> تعديل الطلب
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(msg.id)} className="gap-2 flex-row-reverse text-right text-xs text-red-400 focus:text-red-400 py-2.5">
                <Trash2 className="size-3.5" /> حذف السجل
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-2 items-end max-w-[85%]">
          <div className={cn("p-4 shadow-xl relative message-bubble-user text-white border border-white/5")}>
            <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap text-right">
              {msg.originalText || msg.text}
            </p>
          </div>
          
          {msg.optimizedText && (
            <div className="w-full mt-1 flex flex-col items-end gap-2">
              <button 
                onClick={() => setShowOptimized(!showOptimized)} 
                className="flex items-center gap-1 text-[10px] text-indigo-300 bg-indigo-500/5 px-2 py-1 rounded-full border border-indigo-500/10"
              >
                {showOptimized ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                <span>{showOptimized ? "إخفاء التحسين" : "عرض التحسين عصبيًا"}</span>
              </button>
              {showOptimized && (
                <div className="w-full animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="h-px bg-white/10 w-full mb-2" /> 
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-right backdrop-blur-sm">
                    <p className="text-[9px] text-indigo-400 font-black uppercase mb-1 tracking-[0.2em]">النص المحسن عصبيًا</p>
                    <p dir="auto" className="text-xs text-indigo-100/70 italic leading-relaxed">{msg.optimizedText}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="size-10 rounded-2xl glass flex items-center justify-center mt-1 shrink-0 border border-indigo-500/20 shadow-inner">
          <User className="size-5 text-indigo-400" />
        </div>
      </div>

      {msg.status === 'replied' && (
        <div className="flex items-start gap-3 justify-start animate-in slide-in-from-left-4 duration-500">
          <div className="size-10 rounded-2xl glass flex items-center justify-center mt-1 shrink-0 border border-primary/20 shadow-inner">
            <Bot className="size-5 text-primary" />
          </div>
          <div className="flex flex-col gap-2 items-start max-w-[85%]">
            <div className="p-5 message-bubble-ai border border-white/5 shadow-2xl relative">
              <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap text-right text-white/90">
                {msg.response}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4 flex-row-reverse">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSpeak} 
                  disabled={isSpeaking || (isMyTurnToPlay && !isUsingLocalFallback) || hasFailed} 
                  className="h-8 px-3 text-[10px] gap-2 text-muted-foreground hover:text-white bg-white/5 rounded-lg border border-white/5"
                >
                  {isSpeaking ? <Loader2 className="size-3 animate-spin" /> : <Volume2 className="size-3" />} 
                  {hasFailed ? "النطق غير متاح" : (isUsingLocalFallback ? "نطق محلي (احتياطي)" : (audioUrl ? (isMyTurnToPlay ? "جاري النطق..." : "إعادة النطق") : "نطق الرد"))}
                </Button>
                <div className="flex items-center gap-2 opacity-40 text-[9px] font-mono tracking-tighter">
                  {audioUrl && !isUsingLocalFallback && <Mic2 className="size-3 text-emerald-400" />}
                  <Zap className={cn("size-3", isUsingLocalFallback ? "text-amber-400" : "text-indigo-400")} />
                  <span>{isUsingLocalFallback ? "Local Engine" : msg.engine}</span>
                </div>
              </div>
              
              {audioUrl && (
                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  onEnded={() => onAudioFinished?.()} 
                  className="hidden" 
                />
              )}

              {((audioUrl && (isMyTurnToPlay || isSpeaking)) || (isUsingLocalFallback && isSpeaking)) && (
                <div className="mt-4 p-2 bg-black/40 rounded-xl border border-white/5 animate-pulse">
                  <div className="flex items-center gap-2 justify-center py-1">
                    <div className="size-1.5 bg-primary rounded-full animate-bounce delay-75" />
                    <div className="size-1.5 bg-primary rounded-full animate-bounce delay-150" />
                    <div className="size-1.5 bg-primary rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ChatMessage.displayName = "ChatMessage";
