
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePeerChatStore } from '@/lib/peer-chat-store';
import { cn } from '@/lib/utils';

export function ChatWindow({ currentUser, targetUser }: { currentUser: any, targetUser: any }) {
  const [input, setInput] = useState("");
  const { messages, isLoading, loadMessages, sendMessage } = usePeerChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser?.id && targetUser?.id) {
      const unsubscribe = loadMessages(currentUser.id, targetUser.id);
      return () => unsubscribe();
    }
  }, [currentUser?.id, targetUser?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    await sendMessage(currentUser.id, targetUser.id, text);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
      <header className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between flex-row-reverse">
        <div className="flex items-center gap-4 flex-row-reverse text-right">
          <div className="size-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center overflow-hidden">
            <img src={targetUser.avatar_url || `https://picsum.photos/seed/${targetUser.username}/100/100`} className="size-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2 justify-end">
              {targetUser.name}
              <ShieldCheck className="size-3 text-emerald-400" />
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">@{targetUser.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] text-emerald-400 font-black uppercase tracking-tighter">Secure P2P Node</span>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] p-4 rounded-2xl shadow-lg text-sm leading-relaxed",
                    isMine 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none"
                  )}>
                    <p dir="auto" className="text-right">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-6 bg-white/5 border-t border-white/5">
        <div className="flex gap-3 items-center">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="اكتب رسالتك الاجتماعية..." 
            className="flex-1 h-12 bg-white/5 border-white/10 rounded-xl text-right"
            dir="auto"
          />
          <Button onClick={handleSend} className="size-12 rounded-xl bg-primary shadow-lg shadow-primary/20 shrink-0">
            <Send className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
