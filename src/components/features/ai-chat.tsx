
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Paperclip, Mic, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getWelcomeMessage } from "@/ai/flows/ai-chat-welcome-message";
import { aiChatGenerateResponse } from "@/ai/flows/ai-chat-generate-response";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const welcome = await getWelcomeMessage();
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: welcome.message,
          timestamp: new Date(),
        },
      ]);
    }
    init();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await aiChatGenerateResponse({
        message: input,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });
      
      // Simulate backend latency
      await new Promise(r => setTimeout(r, 1500));

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsTyping(false);
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
              <p className="font-bold text-sm">Nexus Neural v2.5</p>
              <p className="text-[10px] text-green-400 flex items-center gap-1">
                <span className="size-1.5 bg-green-400 rounded-full animate-pulse" />
                Online & Ready
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreHorizontal className="size-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-start gap-3`}>
                {msg.role === "assistant" && (
                  <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
                    <Bot className="size-4 text-indigo-400" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === "user" ? "message-bubble-user" : "message-bubble-ai"} p-4`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] opacity-40 mt-2 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
                    <User className="size-4 text-indigo-400" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-start gap-3">
                <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
                  <Bot className="size-4 text-indigo-400" />
                </div>
                <div className="message-bubble-ai p-4 flex gap-1 items-center h-10">
                  <span className="size-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="size-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="size-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
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
                disabled={!input.trim() || isTyping}
                size="icon" 
                className="size-8 bg-primary text-white hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/20"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-3">NexusAI can make mistakes. Verify important info.</p>
        </div>
      </div>
    </div>
  );
}
