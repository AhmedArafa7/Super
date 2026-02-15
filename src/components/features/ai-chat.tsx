"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Paperclip, Mic, Loader2, Pencil, Trash2, X, FileText, Download, Square, Music, Globe, Wifi, WifiOff, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getStoredMessages, addWizardMessage, updateMessageText, deleteMessage, WizardMessage, Attachment } from "@/lib/chat-store";
import { clearAllUnreadNotifications, markNotificationByMessageIdAsRead } from "@/lib/notification-store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

interface AIChatProps {
  highlightId?: string | null;
  onHighlightComplete?: () => void;
}

const MAX_FILE_SIZE = 1.5 * 1024 * 1024;

export function AIChat({ highlightId, onHighlightComplete }: AIChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadMessages = async () => {
    if (!user?.id) return;
    try {
      const initialMessages = await getStoredMessages(user.id, user.role === 'admin');
      setMessages(initialMessages ?? []);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Sync Error', description: 'History could not be retrieved.' });
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    loadMessages();

    // REALTIME SUBSCRIPTION WITH CLEANUP
    const channel = supabase
      .channel('chat-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadMessages();
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });
    
    clearAllUnreadNotifications(user.id);

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && highlightId && messageRefs.current[highlightId]) {
      const el = messageRefs.current[highlightId];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      markNotificationByMessageIdAsRead(highlightId, user.id);
      const timer = setTimeout(() => { onHighlightComplete?.(); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightId, messages, user?.id]);

  useEffect(() => {
    if (scrollRef.current && !highlightId) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, highlightId]);

  const handleSend = async () => {
    const hasContent = input?.trim() || pendingAttachments?.length > 0;
    if (!hasContent || !user?.id || isSending || isUploading) return;

    setIsSending(true);
    try {
      const res = await addWizardMessage(input, user.id, user.name, pendingAttachments);
      if (res) {
        setInput("");
        setPendingAttachments([]);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Transmission Failed", description: err.message });
      // Input is preserved for retry
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          toast({ variant: "destructive", title: "File too large", description: `${file.name} exceeds 1.5MB.` });
          continue;
        }

        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file',
          url: base64,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          mimeType: file.type
        });
      }
      setPendingAttachments(prev => [...prev, ...newAttachments]);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPendingAttachments(prev => [...prev, {
            id: Math.random().toString(36).substring(2, 9),
            name: `Voice Transmission ${new Date().toLocaleTimeString()}.webm`,
            type: 'audio',
            url: reader.result as string,
            size: (blob.size / 1024 / 1024).toFixed(2) + ' MB',
            mimeType: blob.type
          }]);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({ variant: "destructive", title: "Mic Access Denied", description: "Microphone permission required." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const AttachmentPreview = ({ attachments }: { attachments: Attachment[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
      {attachments.map((att) => (
        <div key={att.id} className="glass border border-white/5 rounded-xl p-2 flex items-center gap-3 overflow-hidden">
          {att.type === 'image' ? (
            <div className="size-10 rounded-lg overflow-hidden bg-white/5 shrink-0 relative">
              <img src={att.url} alt={att.name} className="size-full object-cover" />
            </div>
          ) : att.type === 'audio' ? (
            <div className="size-10 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Music className="size-5 text-indigo-400" />
            </div>
          ) : (
            <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <FileText className="size-5 text-indigo-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-white truncate">{att.name}</p>
            <p className="text-[9px] text-muted-foreground">{att.size}</p>
          </div>
          <a href={att.url} download={att.name} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
            <Download className="size-3 text-muted-foreground" />
          </a>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pt-8 pb-4 px-4 sm:px-6 lg:px-8">
      <div className="flex-1 overflow-hidden flex flex-col glass rounded-3xl mb-4 relative shadow-2xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
              <Bot className="size-5 text-indigo-400" />
            </div>
            <div>
              <p className="font-bold text-sm">Nexus Realtime Stream</p>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <p className="text-[10px] text-green-400 flex items-center gap-1">
                    <Wifi className="size-2.5" /> Neural Sync Active
                  </p>
                ) : (
                  <p className="text-[10px] text-red-400 flex items-center gap-1">
                    <WifiOff className="size-2.5" /> Synchronizing...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                <Sparkles className="size-12 mb-4 text-indigo-500" />
                <p className="text-sm">Initiate a secure neural session.</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <React.Fragment key={msg.id}>
                <div className="flex justify-end items-start gap-3 group relative">
                  <div className="flex items-start gap-2 max-w-[85%]">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreVertical className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                          {msg.status !== 'replied' && (
                            <DropdownMenuItem onClick={() => { setEditingId(msg.id); setEditingText(msg.text); }} className="gap-2">
                              <Pencil className="size-4" /> Edit Request
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => deleteMessage(msg.id)} className="gap-2 text-red-400">
                            <Trash2 className="size-4" /> Retract Request
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className={cn("flex-1 p-4 transition-all duration-300", editingId === msg.id ? "bg-indigo-500/10 border border-indigo-500/30 rounded-2xl" : "message-bubble-user")}>
                      {editingId === msg.id ? (
                        <div className="space-y-3">
                          <Textarea autoFocus value={editingText} onChange={(e) => setEditingText(e.target.value)} className="bg-white/5 border-white/10" />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                            <Button size="sm" onClick={async () => { await updateMessageText(msg.id, editingText); setEditingId(null); }} className="bg-indigo-500">Save</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          {msg.attachments && msg.attachments.length > 0 && <AttachmentPreview attachments={msg.attachments} />}
                          <div className="flex items-center justify-end gap-1 mt-2 opacity-60">
                            {msg.isUserEdited && <span className="text-[9px] italic mr-1">(edited)</span>}
                            <span className="text-[10px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0"><User className="size-4 text-indigo-400" /></div>
                </div>

                {msg.status === 'replied' && msg.response && (
                  <div ref={el => { messageRefs.current[msg.id] = el; }} className="flex justify-start items-start gap-3">
                    <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0"><Bot className="size-4 text-indigo-400" /></div>
                    <div className={cn("max-w-[80%] message-bubble-ai p-4 border transition-all duration-500", highlightId === msg.id && "animate-highlight ring-2 ring-indigo-500")}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.response}</p>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 bg-white/5 border-t border-white/5">
          {isRecording ? (
            <div className="h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between px-6">
              <div className="flex items-center gap-3"><div className="size-2 rounded-full bg-red-500 animate-pulse" /><span className="text-sm font-bold text-red-400">Recording Audio...</span></div>
              <Button onClick={stopRecording} size="icon" className="bg-red-500"><Square className="size-4" /></Button>
            </div>
          ) : (
            <div className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isUploading ? "Uploading payload..." : "Message NexusAI..."}
                disabled={isUploading || isSending}
                className="w-full h-14 bg-white/5 border-white/10 focus-visible:ring-indigo-500 rounded-2xl pl-12 pr-28 text-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
                <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" disabled={isUploading || isSending}><Paperclip className="size-4" /></Button>
                <Button onClick={startRecording} variant="ghost" size="icon" disabled={isUploading || isSending}><Mic className="size-4" /></Button>
                <Button onClick={handleSend} disabled={(!input.trim() && pendingAttachments.length === 0) || isUploading || isSending} size="icon" className="bg-primary shadow-lg shadow-primary/20">
                  {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
