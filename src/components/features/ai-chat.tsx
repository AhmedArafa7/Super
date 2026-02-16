"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { Send, Bot, User, Sparkles, Paperclip, Mic, Loader2, Pencil, Trash2, X, FileText, Download, Square, Music, Globe, Wifi, WifiOff, MoreVertical, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useChatStore, WizardMessage, Attachment } from "@/lib/chat-store";
import { clearAllUnreadNotifications } from "@/lib/notification-store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { EmptyState } from "@/components/ui/empty-state";
import { aiChatGenerateResponse } from "@/ai/flows/ai-chat-generate-response";
import { getWelcomeMessage } from "@/ai/flows/ai-chat-welcome-message";

interface AIChatProps {
  highlightId?: string | null;
  onHighlightComplete?: () => void;
}

const MAX_FILE_SIZE = 1.5 * 1024 * 1024;

const MessageItem = memo(({ 
  msg, 
  highlightId, 
  onEdit, 
  onDelete 
}: { 
  msg: WizardMessage; 
  highlightId: string | null; 
  onEdit: (m: WizardMessage) => void; 
  onDelete: (id: string) => void;
}) => {
  return (
    <React.Fragment>
      <div className="flex justify-end items-start gap-3 group relative">
        <div className="flex items-start gap-2 max-w-[85%]">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreVertical className="size-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                {msg.status !== 'replied' && (
                  <DropdownMenuItem onClick={() => onEdit(msg)} className="gap-2">
                    <Pencil className="size-4" /> Edit Request
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(msg.id)} className="gap-2 text-red-400">
                  <Trash2 className="size-4" /> Retract Request
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className={cn("flex-1 p-4 transition-all duration-300 message-bubble-user", msg.status === 'queued' && "opacity-70 italic")}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            {msg.attachments && msg.attachments.length > 0 && <AttachmentPreview attachments={msg.attachments} />}
            <div className="flex items-center justify-end gap-1 mt-2 opacity-60">
              {msg.status === 'sent' && <Loader2 className="size-2 animate-spin text-white/50" />}
              <span className="text-[10px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
        <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0"><User className="size-4 text-indigo-400" /></div>
      </div>

      {msg.status === 'replied' && msg.response && (
        <div className="flex justify-start items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
          <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0"><Bot className="size-4 text-indigo-400" /></div>
          <div className={cn("max-w-[80%] message-bubble-ai p-4 border transition-all duration-500", highlightId === msg.id && "animate-highlight ring-2 ring-indigo-500")}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.response}</p>
          </div>
        </div>
      )}
    </React.Fragment>
  );
});

MessageItem.displayName = "MessageItem";

const AttachmentPreview = memo(({ attachments }: { attachments: Attachment[] }) => (
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
));
AttachmentPreview.displayName = "AttachmentPreview";

export function AIChat({ highlightId, onHighlightComplete }: AIChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const messages = useChatStore(state => state.messages);
  const isConnected = useChatStore(state => state.isConnected);
  const isSending = useChatStore(state => state.isSending);
  const loadMessages = useChatStore(state => state.loadMessages);
  const sendMessage = useChatStore(state => state.sendMessage);
  const deleteMessage = useChatStore(state => state.deleteMessage);
  const updateMessageText = useChatStore(state => state.updateMessageText);
  const setConnected = useChatStore(state => state.setConnected);
  const approveMessage = useChatStore(state => state.approveMessage);

  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAITyping, setIsAITyping] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadMessages(user.id, user.role === 'admin');

    const channel = supabase
      .channel('chat-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadMessages(user.id, user.role === 'admin');
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });
    
    clearAllUnreadNotifications(user.id);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadMessages, setConnected]);

  // Welcome Message Logic using Groq
  useEffect(() => {
    const triggerWelcome = async () => {
      if (messages.length === 0 && user && isConnected && !isAITyping) {
        setIsAITyping(true);
        try {
          const { message } = await getWelcomeMessage();
          toast({ title: "Nexus Node Synchronized", description: message });
        } catch (err) {
          console.warn("AI Node not ready.");
        } finally {
          setIsAITyping(false);
        }
      }
    };
    triggerWelcome();
  }, [messages.length, user, isConnected]);

  useEffect(() => {
    if (scrollRef.current && !highlightId) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, highlightId, isAITyping]);

  const handleSend = async () => {
    const hasContent = input?.trim() || pendingAttachments?.length > 0;
    if (!hasContent || !user?.id || isSending || isUploading) return;

    const userText = input;
    setInput(""); 
    const currentAttachments = [...pendingAttachments];
    setPendingAttachments([]);

    try {
      const savedMsg = await sendMessage(userText, user.id, user.name, currentAttachments);
      
      if (savedMsg) {
        setIsAITyping(true);
        
        // Contextual History for Groq (Using Genkit Roles: user, model)
        const history = [];
        messages.slice(-5).forEach(m => {
          history.push({ role: 'user' as const, content: m.text });
          if (m.response) {
            history.push({ role: 'model' as const, content: m.response });
          }
        });

        // Get Response from Groq Llama 3.3
        const responseData = await aiChatGenerateResponse({
          message: userText,
          history: history
        });

        if (responseData && responseData.response) {
          await approveMessage(savedMsg.id, responseData.response);
        }
      }
    } catch (err: any) {
      console.error('Neural Link Error:', err);
      toast({ 
        variant: "destructive", 
        title: "Neural Link Error", 
        description: "Failed to reach Groq node. Ensure GROQ_API_KEY is active." 
      });
    } finally {
      setIsAITyping(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const newAttachments: Attachment[] = [];
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          toast({ variant: "destructive", title: "File too large", description: `${file.name} exceeds 1.5MB.` });
          continue;
        }

        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            setUploadProgress(prev => Math.min(prev + (100 / files.length), 95));
            resolve(reader.result as string);
          };
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
      setUploadProgress(100);
      setTimeout(() => {
        setPendingAttachments(prev => [...prev, ...newAttachments]);
        setIsUploading(false);
        setUploadProgress(0);
      }, 400);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
      setIsUploading(false);
      setUploadProgress(0);
    } finally {
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
        setIsUploading(true);
        setUploadProgress(20);
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadProgress(100);
          setTimeout(() => {
            setPendingAttachments(prev => [...prev, {
              id: Math.random().toString(36).substring(2, 9),
              name: `Voice Packet ${new Date().toLocaleTimeString()}.webm`,
              type: 'audio',
              url: reader.result as string,
              size: (blob.size / 1024 / 1024).toFixed(2) + ' MB',
              mimeType: blob.type
            }]);
            setIsUploading(false);
            setUploadProgress(0);
          }, 400);
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

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pt-8 pb-4 px-4 sm:px-6 lg:px-8">
      {!isConnected && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="size-5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-200/80">
            <strong>Neural Sync Lost:</strong> Connection to cloud node interrupted.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col glass rounded-3xl mb-4 relative shadow-2xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
              <Bot className={cn("size-5 text-indigo-400", isAITyping && "animate-pulse")} />
            </div>
            <div>
              <p className="font-bold text-sm">Nexus AI (Groq Llama 3.3)</p>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <p className="text-[10px] text-green-400 flex items-center gap-1">
                    <Wifi className="size-2.5" /> {isAITyping ? "Processing..." : "Active"}
                  </p>
                ) : (
                  <p className="text-[10px] text-red-400 flex items-center gap-1">
                    <WifiOff className="size-2.5" /> Offline
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.length === 0 && !isAITyping ? (
              <EmptyState 
                icon={Sparkles}
                title="Neural Stream Empty"
                description="Initiate a secure session with the Llama 3.3 engine."
                className="mt-12"
              />
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageItem 
                    key={msg.id} 
                    msg={msg} 
                    highlightId={highlightId} 
                    onEdit={(m) => { setEditingId(m.id); setEditingText(m.text); }}
                    onDelete={deleteMessage}
                  />
                ))}
                {isAITyping && (
                  <div className="flex justify-start items-start gap-3 animate-pulse">
                    <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0"><Bot className="size-4 text-indigo-400" /></div>
                    <div className="max-w-[100px] message-bubble-ai p-4 border flex gap-1">
                      <span className="size-1 bg-indigo-400 rounded-full animate-bounce" />
                      <span className="size-1 bg-indigo-400 rounded-full animate-bounce delay-75" />
                      <span className="size-1 bg-indigo-400 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {editingId && (
          <div className="absolute inset-x-0 bottom-0 z-30 p-4 bg-slate-900/95 border-t border-indigo-500/30 backdrop-blur-xl animate-in slide-in-from-bottom duration-300">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Adjusting Neural Request</p>
                <Button variant="ghost" size="icon" onClick={() => setEditingId(null)} className="size-6"><X className="size-4" /></Button>
              </div>
              <Textarea 
                autoFocus 
                value={editingText} 
                onChange={(e) => setEditingText(e.target.value)} 
                className="bg-white/5 border-white/10 min-h-[100px] rounded-2xl" 
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" className="rounded-xl" onClick={() => setEditingId(null)}>Cancel</Button>
                <Button onClick={async () => { await updateMessageText(editingId, editingText); setEditingId(null); }} className="bg-indigo-500 rounded-xl px-8">Save Transmission</Button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-white/5 border-t border-white/5">
          {isRecording ? (
            <div className="h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between px-6">
              <div className="flex items-center gap-3"><div className="size-2 rounded-full bg-red-500 animate-pulse" /><span className="text-sm font-bold text-red-400">Capturing Audio...</span></div>
              <Button onClick={stopRecording} size="icon" className="bg-red-500"><Square className="size-4" /></Button>
            </div>
          ) : (
            <div className="relative">
              {isUploading && (
                <div className="absolute -top-12 left-0 right-0 p-2 glass border-t border-indigo-500/30 rounded-t-xl space-y-1">
                  <div className="flex justify-between text-[8px] uppercase font-bold tracking-widest text-indigo-400">
                    <span>Uploading Data</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1 bg-white/5" />
                </div>
              )}
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isUploading ? "Processing..." : isAITyping ? "Nexus is thinking..." : "Message AI node..."}
                disabled={isUploading || isSending || isAITyping}
                className="w-full h-14 bg-white/5 border-white/10 focus-visible:ring-indigo-500 rounded-2xl pl-12 pr-28 text-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
                <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" disabled={isUploading || isSending || isAITyping}><Paperclip className="size-4" /></Button>
                <Button onClick={startRecording} variant="ghost" size="icon" disabled={isUploading || isSending || isAITyping}><Mic className="size-4" /></Button>
                <Button onClick={handleSend} disabled={(!input.trim() && pendingAttachments.length === 0) || isUploading || isSending || isAITyping} size="icon" className="bg-primary shadow-lg shadow-primary/20">
                  {isSending || isAITyping ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
            </div>
          )}
          
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
              {pendingAttachments.map((att) => (
                <div key={att.id} className="glass border border-indigo-500/20 rounded-lg px-2 py-1 flex items-center gap-2">
                  <span className="text-[10px] text-white/80 max-w-[100px] truncate">{att.name}</span>
                  <span className="text-[8px] text-muted-foreground">({att.size})</span>
                  <button onClick={() => setPendingAttachments(p => p.filter(a => a.id !== att.id))} className="text-red-400 hover:text-red-300">
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}