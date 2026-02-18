
"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { Send, Bot, User, Sparkles, Paperclip, Mic, Loader2, Pencil, Trash2, X, FileText, Download, MoreVertical, Zap, ChevronDown, ChevronUp, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [showOptimized, setShowOptimized] = useState(false);
  const hasOptimization = !!msg.optimizedText && msg.optimizedText !== msg.originalText;
  const isReplied = msg.status === 'replied' && !!msg.response;

  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* 1. فقاعة المستخدم (دائماً جهة اليمين) */}
      <div className="flex items-start gap-3 justify-end group relative">
        <div className="flex flex-col gap-2 items-end max-w-[85%]">
          <div className="flex items-start gap-2">
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

            <div className={cn(
              "p-4 transition-all duration-300 shadow-lg relative message-bubble-user min-w-[120px]",
              highlightId === msg.id && "animate-highlight ring-2 ring-indigo-500"
            )}>
              {/* النص الأصلي للمستخدم */}
              <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap text-right text-white">
                {msg.originalText || msg.text}
              </p>
              
              {/* سهم التحسين العصبي (يظهر فقط إذا كان هناك تحسين) */}
              {hasOptimization && (
                <div className="mt-2 pt-2 border-t border-white/10 flex flex-col items-end">
                  <button 
                    onClick={() => setShowOptimized(!showOptimized)}
                    className="flex items-center gap-1 text-[10px] text-white/70 hover:text-white transition-colors"
                  >
                    {showOptimized ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    عرض التحسين العصبي
                  </button>
                  {showOptimized && (
                    <div className="mt-2 w-full animate-in slide-in-from-top-1 duration-300">
                      <div className="h-px bg-white/20 w-full mb-2" />
                      <p dir="auto" className="text-[11px] text-indigo-100 italic leading-relaxed text-right opacity-90">
                        {msg.optimizedText}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-1 mt-2 opacity-40">
                <span className="text-[9px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
          {msg.attachments && msg.attachments.length > 0 && <AttachmentPreview attachments={msg.attachments} />}
        </div>
        <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
          <User className="size-4 text-indigo-400" />
        </div>
      </div>

      {/* 2. فقاعة الـ AI (تظهر فقط بعد الرد جهة اليسار) */}
      {isReplied ? (
        <div className="flex items-start gap-3 justify-start animate-in slide-in-from-left-4 duration-500">
          <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0">
            <Bot className="size-4 text-indigo-400" />
          </div>
          <div className="flex flex-col gap-2 items-start max-w-[80%]">
            <div className="p-4 message-bubble-ai border border-white/5 shadow-lg relative">
              <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap text-right text-white">
                {msg.response}
              </p>
              <div className="mt-2 flex items-center gap-2 opacity-30 text-[8px]">
                <Zap className="size-2 text-indigo-400" />
                <span>{msg.engine || msg.selectedModel}</span>
              </div>
            </div>
          </div>
        </div>
      ) : msg.status === 'sent' && (
        <div className="flex justify-start pl-11">
          <div className="flex gap-1.5 p-2 bg-white/5 rounded-full border border-white/5 px-4 items-center">
            <span className="size-1.5 bg-indigo-400/40 rounded-full animate-pulse" />
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">بانتظار مراجعة نكسوس...</span>
          </div>
        </div>
      )}
    </div>
  );
});

MessageItem.displayName = "MessageItem";

const AttachmentPreview = memo(({ attachments }: { attachments: Attachment[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 w-full">
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
  const isSending = useChatStore(state => state.isSending);
  const autoMode = useChatStore(state => state.autoMode);
  const setAutoMode = useChatStore(state => state.setAutoMode);
  const selectedManualModel = useChatStore(state => state.selectedManualModel);
  const setSelectedManualModel = useChatStore(state => state.setSelectedManualModel);
  
  const loadMessages = useChatStore(state => state.loadMessages);
  const sendMessage = useChatStore(state => state.sendMessage);
  const deleteMessage = useChatStore(state => state.deleteMessage);
  const provideAIResponse = useChatStore(state => state.provideAIResponse);

  const [input, setInput] = useState("");
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
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: "smooth" });
      }
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
          if (m.status === 'replied' && m.response) {
            history.push({ role: 'user', content: m.originalText || m.text });
            history.push({ role: 'model', content: m.response });
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
      console.error(err);
      toast({ variant: "destructive", title: "فشل الاتصال", description: "تعذر الوصول للمحرك العصبي حالياً." });
    } finally {
      setIsAITyping(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
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
          <div className="flex items-center gap-3 flex-row-reverse">
            <div className="size-10 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
              <Bot className={cn("size-5 text-indigo-400", isAITyping && "animate-pulse")} />
            </div>
            <div className="text-right">
              <p className="font-bold text-sm">Nexus Neural Link</p>
              <p className={cn("text-[10px] flex items-center gap-1 justify-end", isAITyping ? "text-indigo-400" : "text-green-400")}>
                {isAITyping ? "جاري المعالجة..." : "متصل بالشبكة"} <Wifi className="size-2.5" />
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5 flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">تلقائي</Label>
              <Switch checked={autoMode} onCheckedChange={setAutoMode} />
            </div>
            {!autoMode && (
              <Select value={selectedManualModel} onValueChange={setSelectedManualModel}>
                <SelectTrigger className="h-8 bg-white/5 border-white/10 text-[10px] w-32 flex-row-reverse">
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
          <div className="space-y-8">
            {messages.length === 0 && !isAITyping ? (
              <EmptyState 
                icon={Zap}
                title="نظام نكسوس بانتظارك"
                description="ابدأ جلسة آمنة الآن مع المحرك العصبي العالمي."
                className="mt-12"
              />
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageItem 
                    key={msg.id} 
                    msg={msg} 
                    highlightId={highlightId} 
                    onEdit={(m) => { setInput(m.originalText || m.text); deleteMessage(m.id, user?.id || ''); }}
                    onDelete={(id) => deleteMessage(id, user?.id || '')}
                  />
                ))}
                {isAITyping && (
                  <div className="flex justify-start items-start gap-3 animate-pulse">
                    <div className="size-8 rounded-full glass border border-white/10 flex items-center justify-center mt-1 shrink-0"><Bot className="size-4 text-indigo-400" /></div>
                    <div className="message-bubble-ai p-4 border flex gap-1 border-white/5">
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

        {pendingAttachments.length > 0 && (
          <div className="px-4 py-2 border-t border-white/5 bg-black/40">
            <div className="flex flex-wrap gap-2">
              {pendingAttachments.map(att => (
                <div key={att.id} className="relative group">
                  <div className="size-12 rounded-lg border border-white/10 overflow-hidden bg-white/5">
                    {att.type === 'image' ? <img src={att.url} className="size-full object-cover" /> : <FileText className="size-full p-3 text-indigo-400" />}
                  </div>
                  <button 
                    onClick={() => setPendingAttachments(prev => prev.filter(a => a.id !== att.id))}
                    className="absolute -top-1 -right-1 bg-red-500 rounded-full size-4 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-2" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-white/5 border-t border-white/5">
          <div className="relative flex items-center gap-3">
            {/* أزرار الوسائط جهة اليسار */}
            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
              <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" className="text-muted-foreground hover:text-indigo-400 size-12 rounded-2xl bg-white/5 border border-white/5 transition-all">
                <Paperclip className="size-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-indigo-400 size-12 rounded-2xl bg-white/5 border border-white/5 transition-all">
                <Mic className="size-5" />
              </Button>
            </div>
            
            {/* مربع النص في المنتصف */}
            <div className="relative flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="اكتب رسالتك هنا..."
                disabled={isAITyping}
                dir="auto"
                className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-sm text-white text-right focus-visible:ring-primary focus-visible:bg-white/10 transition-all"
              />
            </div>

            {/* زر الإرسال جهة اليمين */}
            <Button 
              onClick={handleSend} 
              disabled={isAITyping || (!input.trim() && pendingAttachments.length === 0)} 
              size="icon" 
              className="size-14 bg-primary hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/20 shrink-0 transition-transform active:scale-95"
            >
              {isSending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
