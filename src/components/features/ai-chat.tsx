
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Paperclip, Mic, MoreHorizontal, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStoredMessages, addWizardMessage, WizardMessage } from "@/lib/chat-store";

export function AIChat() {
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = () => {
      setMessages(getStoredMessages());
    };

    loadMessages();

    // Sync state across components/tabs
    window.addEventListener('storage-update', loadMessages);
    window.addEventListener('storage', loadMessages);
    
    return () => {
      window.removeEventListener('storage-update', loadMessages);
      window.removeEventListener('storage', loadMessages);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    addWizardMessage(input);
    setInput("");
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
              <p className="font-bold text-sm">Nexus Wizard v1.0</p>
              <p className="text-[10px] text-indigo-400 flex items-center gap-1">
                <span className="size-1.5 bg-indigo-400 rounded-full animate-pulse" />
                Wizard of Oz Mode Active
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
                <div className="flex justify-end items-start gap-3">
                  <div className="max-w-[80%] message-bubble-user p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-[10px] opacity-40 mt-2 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
                    <User className="size-4 text-indigo-400" />
                  </div>
                </div>

                {/* AI Response or Loading */}
                {msg.status === 'pending' ? (
                  <div className="flex justify-start items-start gap-3">
                    <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
                      <Bot className="size-4 text-indigo-400" />
                    </div>
                    <div className="message-bubble-ai p-4 flex items-center gap-3 border border-indigo-500/20">
                      <Loader2 className="size-4 text-indigo-400 animate-spin" />
                      <p className="text-xs text-indigo-400/80 font-medium">Processing on secure server...</p>
                    </div>
                  </div>
                ) : msg.status === 'approved' && msg.response ? (
                  <div className="flex justify-start items-start gap-3">
                    <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
                      <Bot className="size-4 text-indigo-400" />
                    </div>
                    <div className="max-w-[80%] message-bubble-ai p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.response}</p>
                      <p className="text-[10px] opacity-40 mt-2 text-right">
                         Replied via Wizard Link
                      </p>
                    </div>
                  </div>
                ) : msg.status === 'rejected' && (
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
          <p className="text-[10px] text-center text-muted-foreground mt-3">Prototype Mode: Messages are routed to the Admin Dashboard for manual response.</p>
        </div>
      </div>
    </div>
  );
}
