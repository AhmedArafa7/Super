
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Paperclip, Mic, MoreHorizontal, Clock, Check, CheckCheck, Loader2, Edit3, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStoredMessages, addWizardMessage, updateMessageStatus, WizardMessage } from "@/lib/chat-store";
import { clearAllUnreadNotifications, markNotificationByMessageIdAsRead } from "@/lib/notification-store";
import { cn } from "@/lib/utils";

interface AIChatProps {
  highlightId?: string | null;
  onHighlightComplete?: () => void;
}

export function AIChat({ highlightId, onHighlightComplete }: AIChatProps) {
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const loadMessages = () => {
      setMessages(getStoredMessages());
    };

    loadMessages();
    window.addEventListener('storage-update', loadMessages);
    window.addEventListener('storage', loadMessages);
    
    // Clear unread notifications when chat is active
    clearAllUnreadNotifications();

    return () => {
      window.removeEventListener('storage-update', loadMessages);
      window.removeEventListener('storage', loadMessages);
    };
  }, []);

  // Deep Linking & Highlighting Logic
  useEffect(() => {
    if (highlightId && messageRefs.current[highlightId]) {
      const el = messageRefs.current[highlightId];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Mark as read specifically if it was deep linked
      markNotificationByMessageIdAsRead(highlightId);

      // Flash logic is handled by CSS class if ID matches
      const timer = setTimeout(() => {
        onHighlightComplete?.();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [highlightId, messages, onHighlightComplete]);

  // Background Queue Processor
  useEffect(() => {
    const processQueue = async () => {
      const queuedMessages = messages.filter(m => m.status === 'queued');
      if (queuedMessages.length === 0 || isProcessingQueue) return;

      setIsProcessingQueue(true);
      
      const msgToProcess = queuedMessages[0];
      await new Promise(resolve => setTimeout(resolve, 800)); 
      updateMessageStatus(msgToProcess.id, 'sent');
      
      setIsProcessingQueue(false);
    };

    processQueue();
  }, [messages, isProcessingQueue]);

  useEffect(() => {
    if (scrollRef.current && !highlightId) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, highlightId]);

  const handleSend = () => {
    if (!input.trim()) return;
    addWizardMessage(input);
    setInput("");
  };

  const getStatusIcon = (status: WizardMessage['status']) => {
    switch (status) {
      case 'queued': return <Clock className="size-3 opacity-50" />;
      case 'sent': return <Check className="size-3 opacity-50" />;
      case 'processing': return <Check className="size-3 text-indigo-400" />;
      case 'replied': return <CheckCheck className="size-3 text-indigo-400" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pt-8 pb-4 px-4 sm:px-6 lg:px-8">
      <div className="flex-1 overflow-hidden flex flex-col glass rounded-3xl mb-4 relative shadow-2xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
              <Bot className="size-5 text-indigo-400" />
            </div>
            <div>
              <p className="font-bold text-sm">Nexus Neural Queue</p>
              <p className="text-[10px] text-indigo-400 flex items-center gap-1">
                <span className={cn("size-1.5 rounded-full", isProcessingQueue ? "bg-amber-400 animate-pulse" : "bg-green-400")} />
                {isProcessingQueue ? "Syncing Workspace..." : "System Synchronized"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreHorizontal className="size-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                <Sparkles className="size-12 mb-4 text-indigo-500" />
                <p className="text-sm">Initiate a secure session with Nexus Neural.</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <React.Fragment key={msg.id}>
                {/* User Message */}
                <div className="flex justify-end items-start gap-3 group">
                  <div className="max-w-[80%] message-bubble-user p-4 relative">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap pr-4">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-2 opacity-60">
                      <span className="text-[10px]">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {getStatusIcon(msg.status)}
                    </div>
                  </div>
                  <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
                    <User className="size-4 text-indigo-400" />
                  </div>
                </div>

                {/* AI Response or Processing Indicators */}
                {msg.status === 'processing' && (
                  <div className="flex justify-start items-start gap-3">
                    <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
                      <Bot className="size-4 text-indigo-400" />
                    </div>
                    <div className="message-bubble-ai p-4 flex items-center gap-3 border border-indigo-500/20">
                      <Loader2 className="size-4 text-indigo-400 animate-spin" />
                      <p className="text-xs text-indigo-400/80 font-medium">Neural processing initiated...</p>
                    </div>
                  </div>
                )}

                {msg.status === 'replied' && msg.response && (
                  <div 
                    ref={el => { messageRefs.current[msg.id] = el }}
                    className="flex justify-start items-start gap-3 group"
                  >
                    <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
                      <Bot className="size-4 text-indigo-400" />
                    </div>
                    <div className={cn(
                      "max-w-[80%] message-bubble-ai p-4 relative border transition-all duration-500",
                      msg.isEdited ? "border-amber-500/40 bg-amber-500/5" : "border-white/5",
                      highlightId === msg.id && "animate-highlight ring-2 ring-indigo-500"
                    )}>
                      {msg.isEdited && (
                        <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                          <Edit3 className="size-3" />
                          ✍️ Edited Response
                        </div>
                      )}
                      
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.response}</p>
                      
                      {msg.isEdited && msg.editReason && (
                        <div className="mt-4 pt-3 border-t border-white/10">
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-black/20">
                            <MessageCircle className="size-3 text-indigo-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Neural Update Note</p>
                              <p className="text-[11px] text-white/60 italic">{msg.editReason}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-2 text-right">
                         <span className="text-[10px] opacity-40 italic">Verified Nexus Stream</span>
                      </div>
                    </div>
                  </div>
                )}

                {msg.status === 'rejected' && (
                   <div className="flex justify-start items-start gap-3">
                    <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
                      <Bot className="size-4 text-red-400" />
                    </div>
                    <div className="message-bubble-ai p-4 border border-red-500/20 bg-red-500/5">
                      <p className="text-xs text-red-400">Request declined by server protocol.</p>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 bg-white/5 border-t border-white/5">
          <div className="relative group">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Message NexusAI..."
              className="w-full h-14 bg-white/5 border-white/10 focus-visible:ring-indigo-500 rounded-2xl pl-12 pr-24 text-sm"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Sparkles className="size-5 text-indigo-500" />
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-white hover:bg-white/10">
                <Paperclip className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-white hover:bg-white/10">
                <Mic className="size-4" />
              </Button>
              <Button 
                onClick={handleSend}
                disabled={!input.trim()}
                size="icon" 
                className="size-8 bg-primary text-white hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/20"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-bold">Neural Synchrony: Operational</p>
        </div>
      </div>
    </div>
  );
}
