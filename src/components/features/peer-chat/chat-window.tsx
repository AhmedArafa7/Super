
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Loader2, ShieldCheck, ImageIcon, Paperclip, MoreHorizontal, Check, CheckCheck, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePeerChatStore } from '@/lib/peer-chat-store';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { uploadMarketImage } from '@/lib/market-store';
import { uploadLearningFile } from '@/lib/learning-store';
import { Progress } from '@/components/ui/progress';

export function ChatWindow({ currentUser, targetUser }: { currentUser: any, targetUser: any }) {
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { messages, isLoading, loadMessages, sendMessage, activeChatId, markAsRead } = usePeerChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    if (activeChatId) {
      messages.forEach(msg => {
        if (msg.senderId !== currentUser.id && !msg.isRead) {
          markAsRead(activeChatId, msg.id);
        }
      });
    }
  }, [messages, activeChatId, currentUser.id]);

  const handleSend = async () => {
    if (!input?.trim()) return;
    const text = input;
    setInput("");
    await sendMessage(currentUser.id, targetUser.id, { text, type: 'text' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      const url = await uploadMarketImage(file, (pct) => setUploadProgress(pct));
      await sendMessage(currentUser.id, targetUser.id, { imageUrl: url, type: 'image', text: `Sent an image: ${file.name}` });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleGenericFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      const url = await uploadLearningFile(file, (pct) => setUploadProgress(pct));
      await sendMessage(currentUser.id, targetUser.id, { 
        text: file.name, 
        imageUrl: url, // نستخدم نفس الحقل لتخزين الرابط
        type: 'file' 
      });
    } catch (err) {
      console.error("File upload failed", err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'hh:mm a');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
      <header className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between flex-row-reverse">
        <div className="flex items-center gap-4 flex-row-reverse text-right">
          <div className="size-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center overflow-hidden">
            <img src={targetUser.avatar_url || `https://picsum.photos/seed/${targetUser.username}/100/100`} className="size-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2 justify-end">
              {targetUser.name}
              <ShieldCheck className={cn("size-3", targetUser.status === 'online' ? "text-emerald-400" : "text-slate-500")} />
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">@{targetUser.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn(
            "hidden sm:flex items-center gap-2 px-3 py-1 border rounded-full transition-colors",
            targetUser.status === 'online' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-500/10 border-slate-500/20"
          )}>
            <div className={cn("size-1.5 rounded-full", targetUser.status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-slate-500")} />
            <span className={cn("text-[8px] font-black uppercase tracking-tighter", targetUser.status === 'online' ? "text-emerald-400" : "text-slate-500")}>
              {targetUser.status === 'online' ? 'Secure P2P Node' : 'Node Offline'}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white"><MoreHorizontal className="size-5" /></Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={cn("flex w-full flex-col", isMine ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[75%] p-4 rounded-2xl shadow-lg relative group transition-all",
                    isMine 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none"
                  )}>
                    {msg.type === 'image' && msg.imageUrl ? (
                      <div className="mb-2 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                        <img src={msg.imageUrl} className="max-w-full h-auto object-cover cursor-pointer hover:opacity-90" onClick={() => window.open(msg.imageUrl, '_blank')} />
                      </div>
                    ) : msg.type === 'file' ? (
                      <div className="mb-3 p-4 bg-black/30 rounded-xl border border-white/10 flex items-center gap-4 flex-row-reverse">
                        <div className="size-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                          <FileText className="size-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 text-right overflow-hidden">
                          <p className="text-xs font-bold truncate text-white">{msg.text}</p>
                          <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-1">Institutional Asset</p>
                        </div>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-white/10 text-indigo-400" onClick={() => window.open(msg.imageUrl, '_blank')}>
                          <Download className="size-4" />
                        </Button>
                      </div>
                    ) : null}
                    
                    {msg.type !== 'file' && <p dir="auto" className="text-right text-sm leading-relaxed">{msg.text}</p>}
                    
                    <div className={cn(
                      "flex items-center gap-2 mt-2 opacity-40 text-[9px] font-mono",
                      isMine ? "justify-end" : "justify-start"
                    )}>
                      <span>{formatMessageTime(msg.timestamp)}</span>
                      {isMine && (
                        msg.isRead ? <CheckCheck className="size-3 text-emerald-400" /> : <Check className="size-3" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {isUploading && (
        <div className="px-8 py-2 bg-indigo-500/10 border-t border-white/5 animate-in fade-in">
          <div className="flex justify-between items-center mb-1 flex-row-reverse">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">جاري مزامنة الوسائط مع النخاع...</span>
            <span className="text-[10px] font-mono text-indigo-400">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1 bg-white/5" />
        </div>
      )}

      <div className="p-6 bg-white/5 border-t border-white/5">
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => imageInputRef.current?.click()}
              className="size-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-indigo-400"
            >
              <ImageIcon className="size-5" />
            </Button>
            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fileInputRef.current?.click()}
              className="size-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground flex"
            >
              <Paperclip className="size-5" />
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleGenericFileUpload} />
          </div>

          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="اكتب رسالتك الاجتماعية..." 
            className="flex-1 h-12 bg-white/5 border-white/10 rounded-xl text-right focus-visible:ring-indigo-500"
            dir="auto"
          />
          
          <Button onClick={handleSend} disabled={(!input?.trim() && !isUploading) || isUploading} className="size-12 rounded-xl bg-primary shadow-lg shadow-primary/20 shrink-0">
            <Send className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
