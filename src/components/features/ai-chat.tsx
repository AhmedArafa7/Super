
"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { Send, Bot, User, Sparkles, Paperclip, Mic, Loader2, Pencil, Trash2, X, FileText, Download, Square, Music, Globe, Wifi, WifiOff, MoreVertical, Zap, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Cpu, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useChatStore, WizardMessage, Attachment } from "@/lib/chat-store";
import { clearAllUnreadNotifications } from "@/lib/notification-store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { aiChatGenerateResponse } from "@/ai/flows/ai-chat-generate-response";
import { Badge } from "@/components/ui/badge";

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
  const isAI = msg.userId === 'nexus-ai' || !!msg.response;
  const [showOptimized, setShowOptimized] = useState(false);

  return (
    <React.Fragment>
      <div className={cn("flex items-start gap-3 group relative", !msg.response ? "justify-end" : "justify-start animate-in fade-in slide-in-from-left-2 duration-500")}>
        {msg.response && (
          <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
            <Bot className="size-4 text-indigo-400" />
          </div>
        )}
        
        <div className={cn("flex flex-col items-start gap-2", !msg.response ? "max-w-[85%]" : "max-w-[80%]")}>
          <div className="flex items-start gap-2 w-full">
            {!msg.response && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreVertical className="size-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                    <DropdownMenuItem onClick={() => onEdit(msg)} className="gap-2 text-white">
                      <Pencil className="size-4" /> تعديل الطلب
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(msg.id)} className="gap-2 text-red-400">
                      <Trash2 className="size-4" /> سحب الطلب
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <div className={cn(
              "flex-1 p-4 transition-all duration-300 shadow-lg relative",
              !msg.response ? "message-bubble-user" : "message-bubble-ai border border-white/5",
              highlightId === msg.id && "animate-highlight ring-2 ring-indigo-500"
            )}>
              <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap text-right">
                {msg.response || msg.originalText || msg.text}
              </p>
              
              {!msg.response && msg.optimizedText && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <button 
                    onClick={() => setShowOptimized(!showOptimized)}
                    className="flex items-center gap-1 text-[9px] text-white/60 hover:text-white transition-colors"
                  >
                    {showOptimized ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    عرض التحسين العصبي
                  </button>
                  {showOptimized && (
                    <div className="mt-2 animate-in slide-in-from-top-1 duration-300">
                      <p dir="auto" className="text-[11px] text-indigo-200 italic leading-relaxed text-right">
                        {msg.optimizedText}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {msg.attachments && msg.attachments.length > 0 && <AttachmentPreview attachments={msg.attachments} />}
              <div className="flex items-center justify-end gap-1 mt-2 opacity-60">
                <span className="text-[10px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>

        {!msg.response && (
          <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
            <User className="size-4 text-indigo-400" />
          </div>
        )}
      </div>
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
        ) : (
          <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <FileText className="size-5 text-indigo-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-white truncate">{att.name}</p>
        </div>
        <a href={att.url} download={att.name} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
          <Download className="size-3 text-muted-foreground" />
        </a>
      </div>
    ))}
  </div>
));

export function AIChat({ highlightId }: AIChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const messages = useChatStore(state => state.messages);
  const isConnected = useChatStore(state => state.isConnected);
  const isSending = useChatStore(state => state.isSending);
  const autoMode = useChatStore(state => state.autoMode);
  const setAutoMode = useChatStore(state => state.setAutoMode);
  const selectedManualModel = useChatStore(state => state.selectedManualModel);
  const setSelectedManualModel = useChatStore(state => state.setSelectedManualModel);
  
  const loadMessages = useChatStore(state => state.loadMessages);
  const sendMessage = useChatStore(state => state.sendMessage);
  const deleteMessage = useChatStore(state => state.deleteMessage);
  const updateMessageText = useChatStore(state => state.updateMessageText);
  const provideAIResponse = useChatStore(state => state.provideAIResponse);

  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isAITyping, setIsAITyping] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadMessages(user.id);
    clearAllUnreadNotifications(user.id);
  }, [user?.id, loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, isAITyping]);

  const handleSend = async () => {
    if ((!input.trim() && pendingAttachments.length === 0) || !user?.id || isSending) return;

    const userText = input;
    setInput(""); 
    const currentAttachments = [...pendingAttachments];
    setPendingAttachments([]);

    try {
      const savedMsg = await sendMessage(userText, user.id, user.name, currentAttachments);
      
      if (savedMsg) {
        setIsAITyping(true);
        
        const history: { role: 'user' | 'model', content: string }[] = [];
        messages.slice(-5).forEach(m => {
          if (m.userId !== 'nexus-ai') {
            history.push({ role: 'user', content: m.originalText || m.text });
            if (m.response && m.status === 'replied') {
              history.push({ role: 'model', content: m.response });
            }
          }
        });

        const responseData = await aiChatGenerateResponse({
          message: userText,
          isAutoMode: autoMode,
          manualModel: autoMode ? undefined : selectedManualModel,
          history: history
        });

        if (responseData && responseData.response) {
          await provideAIResponse(savedMsg.id, user.id, {
            response: responseData.response,
            engine: responseData.engine,
            optimizedText: responseData.optimizedText,
            selectedModel: responseData.selectedModel
          });
        }
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Neural Link Error", description: "Fell reach AI engine." });
    } finally {
      setIsAITyping(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) continue;
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setPendingAttachments(prev => [...prev, {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: base64,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        mimeType: file.type
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pt-8 pb-4 px-4">
      <div className="flex-1 overflow-hidden flex flex-col glass rounded-3xl mb-4 relative shadow-2xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
              <Bot className={cn("size-5 text-indigo-400", isAITyping && "animate-pulse")} />
            </div>
            <div>
              <p className="font-bold text-sm">Nexus Neural Link</p>
              <p className="text-[10px] text-green-400 flex items-center gap-1">
                <Wifi className="size-2.5" /> {isAITyping ? "Processing..." : "Ready"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Auto</Label>
              <Switch checked={autoMode} onCheckedChange={setAutoMode} />
            </div>
            {!autoMode && (
              <Select value={selectedManualModel} onValueChange={setSelectedManualModel}>
                <SelectTrigger className="h-8 bg-white/5 border-white/10 text-[10px] w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="googleai/gemini-1.5-flash">Gemini Flash</SelectItem>
                  <SelectItem value="groq/llama-3.3-70b-versatile">Groq Llama</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.length === 0 && !isAITyping ? (
              <EmptyState 
                icon={Zap}
                title="Neural Link Idle"
                description="Start a secure session with the NexusAI core."
                className="mt-12"
              />
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageItem 
                    key={msg.id} 
                    msg={msg} 
                    highlightId={highlightId} 
                    onEdit={(m) => { setEditingId(m.id); setEditingText(m.originalText || m.text); }}
                    onDelete={(id) => deleteMessage(id, user?.id || '')}
                  />
                ))}
                {isAITyping && (
                  <div className="flex justify-start items-start gap-3 animate-pulse">
                    <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0"><Bot className="size-4 text-indigo-400" /></div>
                    <div className="max-w-[100px] message-bubble-ai p-4 border flex gap-1 border-white/5">
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

        <div className="p-4 bg-white/5 border-t border-white/5">
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Transmit to core..."
              disabled={isAITyping}
              className="w-full h-14 bg-white/5 border-white/10 rounded-2xl pl-12 pr-28 text-sm text-white"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
              <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon"><Paperclip className="size-4" /></Button>
              <Button onClick={handleSend} disabled={isAITyping} size="icon" className="bg-primary">
                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
