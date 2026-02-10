"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Paperclip, Mic, MoreHorizontal, Clock, Check, CheckCheck, Loader2, Edit3, MessageCircle, MoreVertical, Pencil, Trash2, X, CheckCircle2, FileText, File, Download, Square, Play, Pause, Image as ImageIcon, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getStoredMessages, addWizardMessage, updateMessageStatus, updateMessageText, deleteMessage, WizardMessage, Attachment } from "@/lib/chat-store";
import { clearAllUnreadNotifications, markNotificationByMessageIdAsRead } from "@/lib/notification-store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface AIChatProps {
  highlightId?: string | null;
  onHighlightComplete?: () => void;
}

const MAX_FILE_SIZE = 1.5 * 1024 * 1024; // 1.5MB limit for localStorage

export function AIChat({ highlightId, onHighlightComplete }: AIChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const loadMessages = () => {
      setMessages(getStoredMessages(user.id, user.role === 'admin'));
    };

    loadMessages();
    window.addEventListener('storage-update', loadMessages);
    window.addEventListener('storage', loadMessages);
    
    if (user.id) {
      clearAllUnreadNotifications(user.id);
    }

    return () => {
      window.removeEventListener('storage-update', loadMessages);
      window.removeEventListener('storage', loadMessages);
    };
  }, [user]);

  useEffect(() => {
    if (user && highlightId && messageRefs.current[highlightId]) {
      const el = messageRefs.current[highlightId];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      markNotificationByMessageIdAsRead(highlightId, user.id);

      const timer = setTimeout(() => {
        onHighlightComplete?.();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [highlightId, messages, onHighlightComplete, user]);

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
    if ((!input.trim() && pendingAttachments.length === 0) || !user || isUploading) return;
    addWizardMessage(input, user.id, user.name, pendingAttachments);
    setInput("");
    setPendingAttachments([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const newAttachments: Attachment[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `${file.name} exceeds the 1.5MB neural link limit.`,
        });
        continue;
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;
      let type: Attachment['type'] = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      if (file.type.startsWith('audio/')) type = 'audio';

      newAttachments.push({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        type,
        url: base64,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        mimeType: file.type
      });
    }

    setPendingAttachments([...pendingAttachments, ...newAttachments]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          const base64 = reader.result as string;
          setPendingAttachments(prev => [...prev, {
            id: Math.random().toString(36).substring(2, 9),
            name: `Voice Transmission ${new Date().toLocaleTimeString()}.webm`,
            type: 'audio',
            url: base64,
            size: (blob.size / 1024 / 1024).toFixed(2) + ' MB',
            mimeType: blob.type
          }]);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Mic Access Denied",
        description: "Please enable microphone permissions to send voice messages.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleStartEdit = (msg: WizardMessage) => {
    setEditingId(msg.id);
    setEditingText(msg.text);
  };

  const handleSaveEdit = () => {
    if (editingId && editingText.trim()) {
      updateMessageText(editingId, editingText);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    deleteMessage(id);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                <div className="flex justify-end items-start gap-3 group relative">
                  <div className="flex items-start gap-2 max-w-[85%]">
                    {/* Actions Dropdown */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground rounded-lg">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 rounded-xl">
                          {msg.status !== 'replied' && (
                            <DropdownMenuItem 
                              onClick={() => handleStartEdit(msg)}
                              className="gap-2 text-indigo-100 focus:bg-indigo-500/20 rounded-lg cursor-pointer"
                            >
                              <Pencil className="size-4" />
                              Edit Request
                            </DropdownMenuItem>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="gap-2 text-red-400 focus:bg-red-500/10 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="size-4" />
                                Delete Request
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-white/10 rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl">Retract Neural Request?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  Are you sure you want to retract this request? This will remove all associated transmission data from the neural stack.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl border-white/10 bg-white/5">Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(msg.id)}
                                  className="bg-red-600 hover:bg-red-500 text-white rounded-xl"
                                >
                                  Retract Request
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className={cn(
                      "flex-1 p-4 relative transition-all duration-300",
                      editingId === msg.id ? "bg-indigo-500/10 border border-indigo-500/30 rounded-2xl" : "message-bubble-user"
                    )}>
                      {user?.role === 'admin' && (
                        <p className="text-[10px] font-bold text-white/50 uppercase mb-1">From: {msg.userName}</p>
                      )}
                      
                      {editingId === msg.id ? (
                        <div className="space-y-3">
                          <Textarea
                            autoFocus
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="bg-white/5 border-white/10 focus-visible:ring-white/20 resize-none min-h-[60px] text-sm"
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 rounded-lg text-white/60">
                              <X className="size-3 mr-1" />
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleSaveEdit} className="h-8 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white">
                              <CheckCircle2 className="size-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap pr-4">{msg.text}</p>}
                          
                          {msg.attachments && msg.attachments.length > 0 && (
                            <AttachmentPreview attachments={msg.attachments} />
                          )}

                          <div className="flex items-center justify-end gap-1 mt-2 opacity-60">
                            {msg.isUserEdited && <span className="text-[9px] font-bold text-white/40 italic mr-1">(edited)</span>}
                            <span className="text-[10px]">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {getStatusIcon(msg.status)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
                    <User className="size-4 text-indigo-400" />
                  </div>
                </div>

                {/* AI Response Indicators */}
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
          {/* Pending Attachments Preview */}
          <AnimatePresence>
            {pendingAttachments.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide"
              >
                {pendingAttachments.map((att) => (
                  <div key={att.id} className="relative group shrink-0">
                    <div className="size-16 rounded-xl glass border border-white/10 flex flex-col items-center justify-center p-2 text-center">
                      {att.type === 'image' ? (
                        <img src={att.url} className="size-full object-cover rounded-lg" />
                      ) : att.type === 'audio' ? (
                        <Music className="size-6 text-indigo-400" />
                      ) : (
                        <FileText className="size-6 text-indigo-400" />
                      )}
                      <p className="text-[8px] truncate w-full mt-1 opacity-60">{att.name}</p>
                    </div>
                    <button 
                      onClick={() => setPendingAttachments(prev => prev.filter(a => a.id !== att.id))}
                      className="absolute -top-1.5 -right-1.5 size-5 bg-red-500 text-white rounded-full flex items-center justify-center border border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {isRecording ? (
            <div className="h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold text-red-400 tabular-nums">Recording Transmission... {formatTime(recordingTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setIsRecording(false); if(timerRef.current) clearInterval(timerRef.current); }} className="text-red-400 hover:bg-red-500/10">
                  <X className="size-5" />
                </Button>
                <Button onClick={stopRecording} size="icon" className="bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20">
                  <Square className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isUploading ? "Uploading payload..." : "Message NexusAI..."}
                disabled={isUploading}
                className="w-full h-14 bg-white/5 border-white/10 focus-visible:ring-indigo-500 rounded-2xl pl-12 pr-28 text-sm"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Sparkles className="size-5 text-indigo-500" />
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost" 
                  size="icon" 
                  disabled={isUploading}
                  className="size-8 text-muted-foreground hover:text-white hover:bg-white/10"
                >
                  {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
                </Button>
                <Button 
                  onClick={startRecording}
                  variant="ghost" 
                  size="icon" 
                  disabled={isUploading}
                  className="size-8 text-muted-foreground hover:text-white hover:bg-white/10"
                >
                  <Mic className="size-4" />
                </Button>
                <Button 
                  onClick={handleSend}
                  disabled={(!input.trim() && pendingAttachments.length === 0) || isUploading}
                  size="icon" 
                  className="size-8 bg-primary text-white hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/20"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          )}
          <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-bold">Neural Synchrony: Operational</p>
        </div>
      </div>
    </div>
  );
}
