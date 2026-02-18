
"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { 
  Send, Bot, User, Sparkles, Paperclip, Mic, Loader2, Pencil, 
  Trash2, X, FileText, Download, MoreVertical, Zap, ChevronDown, 
  ChevronUp, ImageIcon, Volume2, Wand2, Settings2, Check, Cpu,
  BrainCircuit, ZapOff, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useChatStore, WizardMessage, Attachment } from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { aiChatGenerateResponse } from "@/ai/flows/ai-chat-generate-response";
import { generateNeuralImage } from "@/ai/flows/ai-media-generation";
import { textToNeuralSpeech } from "@/ai/flows/ai-audio-flows";

const MAX_FILE_SIZE = 1.5 * 1024 * 1024;

const AVAILABLE_MODELS = [
  { group: 'Nexus Core', items: [
    { id: 'googleai/gemini-1.5-flash', label: 'Gemini Flash', desc: 'سرعة فائقة للمهام اليومية' },
    { id: 'googleai/gemini-2.0-flash-exp', label: 'Gemini Thinking', desc: 'تفكير منطقي واستجابة ذكية' },
    { id: 'googleai/gemini-1.5-pro', label: 'Gemini Pro', desc: 'احترافية في التحليل المعقد' },
  ]},
  { group: 'Groq Engine (Instant)', items: [
    { id: 'groq/llama-3.3-70b-versatile', label: 'Llama 3.3 70B', desc: 'أقوى موديل مفتوح' },
    { id: 'groq/llama-3.1-8b-instant', label: 'Llama 3.1 8B', desc: 'استجابة لحظية' },
    { id: 'groq/mixtral-8x7b-32768', label: 'Mixtral 8x7B', desc: 'منطق برمجي متفوق' },
    { id: 'groq/llama-3.2-11b-vision-preview', label: 'Llama 3.2 Vision', desc: 'رؤية حاسوبية فائقة' },
  ]}
];

const MessageItem = memo(({ 
  msg, 
  onEdit, 
  onDelete
}: { 
  msg: WizardMessage; 
  onEdit: (m: WizardMessage) => void; 
  onDelete: (id: string) => void;
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showOptimized, setShowOptimized] = useState(false);

  const handleSpeak = async () => {
    if (!msg.response) return;
    setIsSpeaking(true);
    try {
      const result = await textToNeuralSpeech(msg.response);
      setAudioUrl(result.audioUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* رسالة المستخدم */}
      <div className="flex items-start gap-3 justify-end group relative">
        <div className="absolute right-full top-0 mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-xl hover:bg-white/10 text-muted-foreground">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white rounded-xl">
              <DropdownMenuItem onClick={() => onEdit(msg)} className="gap-2 flex-row-reverse text-right text-xs">
                <Pencil className="size-3.5" /> تعديل الطلب
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(msg.id)} className="gap-2 flex-row-reverse text-right text-xs text-red-400 focus:text-red-400">
                <Trash2 className="size-3.5" /> حذف السجل
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-2 items-end max-w-[85%]">
          <div className={cn("p-4 shadow-xl relative message-bubble-user text-white")}>
            <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap text-right">{msg.originalText || msg.text}</p>
          </div>
          
          {/* [UI_TRANSPARENCY]: بروتوكول الشفافية السيادي - عرض التحسين العصبي */}
          {msg.optimizedText && msg.optimizedText.trim() !== msg.originalText?.trim() && (
            <div className="w-full mt-1 flex flex-col items-end gap-2">
              <button 
                onClick={() => setShowOptimized(!showOptimized)}
                className="flex items-center gap-1 text-[10px] text-indigo-300 hover:text-indigo-100 transition-colors bg-indigo-500/5 px-2 py-1 rounded-full border border-indigo-500/10"
              >
                {showOptimized ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                <span>{showOptimized ? "إخفاء التحسين" : "عرض التحسين العصبي"}</span>
              </button>
              
              {showOptimized && (
                <div className="w-full animate-in fade-in slide-in-from-top-1 duration-300">
                  {/* الخط الأبيض الفاصل السيادي */}
                  <div className="h-px bg-white/40 w-full mb-2" /> 
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-right backdrop-blur-sm">
                    <p className="text-[9px] text-indigo-400 font-black uppercase mb-1 tracking-[0.2em]">النص المحسن عصبيًا</p>
                    <p dir="auto" className="text-xs text-indigo-100/70 italic leading-relaxed">{msg.optimizedText}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {msg.attachments && msg.attachments.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {msg.attachments.map(att => (
                <div key={att.id} className="size-32 rounded-2xl overflow-hidden border border-white/10 glass shadow-2xl group/img">
                  {att.type === 'image' && <img src={att.url} className="size-full object-cover group-hover/img:scale-110 transition-transform duration-500" alt={att.name} />}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="size-10 rounded-2xl glass flex items-center justify-center mt-1 shrink-0 border border-indigo-500/20 shadow-inner">
          <User className="size-5 text-indigo-400" />
        </div>
      </div>

      {/* رد الـ AI */}
      {msg.status === 'replied' && (
        <div className="flex items-start gap-3 justify-start animate-in slide-in-from-left-4 duration-500">
          <div className="size-10 rounded-2xl glass flex items-center justify-center mt-1 shrink-0 border border-primary/20 shadow-inner">
            <Bot className="size-5 text-primary" />
          </div>
          <div className="flex flex-col gap-2 items-start max-w-[85%]">
            <div className="p-5 message-bubble-ai border border-white/5 shadow-2xl relative">
              <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap text-right text-white/90">{msg.response}</p>
              
              <div className="mt-5 flex items-center gap-4 border-t border-white/5 pt-4">
                <Button variant="ghost" size="sm" onClick={handleSpeak} disabled={isSpeaking} className="h-8 px-3 text-[10px] gap-2 text-muted-foreground hover:text-white bg-white/5 rounded-lg border border-white/5">
                  {isSpeaking ? <Loader2 className="size-3 animate-spin" /> : <Volume2 className="size-3" />}
                  {audioUrl ? "إعادة النطق" : "نطق الرد"}
                </Button>
                {/* [SIMPLIFIED_NAMING]: عرض الأسماء المبسطة فقط (Flash, Thinking, Pro) */}
                <div className="flex items-center gap-2 opacity-40 text-[9px] font-mono tracking-tighter">
                  <Zap className="size-3 text-indigo-400" />
                  <span>{msg.engine}</span>
                </div>
              </div>
              
              {audioUrl && (
                <div className="mt-4 p-2 bg-black/40 rounded-xl border border-white/5 animate-in slide-in-from-top-2">
                  <audio controls className="h-8 w-full scale-90" src={audioUrl} autoPlay />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export function AIChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    messages, sendMessage, provideAIResponse, loadMessages, 
    updateMessageRequest, deleteMessage, autoMode, setAutoMode,
    selectedManualModel, setSelectedManualModel 
  } = useChatStore();

  const [input, setInput] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingMsg, setEditingMsg] = useState<WizardMessage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) loadMessages(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isAITyping]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0 || isAITyping || !user) return;

    const userText = input;
    const currentAttachments = [...attachments];
    
    setInput("");
    setAttachments([]);
    
    let savedMsgId: string;

    if (editingMsg) {
      const success = await updateMessageRequest(editingMsg.id, user.id, userText);
      if (!success) return;
      savedMsgId = editingMsg.id;
      setEditingMsg(null);
    } else {
      const savedMsg = await sendMessage(userText, user.id, user.name, currentAttachments);
      if (!savedMsg) return;
      savedMsgId = savedMsg.id;
    }

    setIsAITyping(true);
    try {
      if (userText.startsWith("تخيل") || userText.startsWith("ارسم") || userText.startsWith("/imagine")) {
        const result = await generateNeuralImage(userText);
        await provideAIResponse(savedMsgId, user.id, {
          response: `لقد قمت بتوليد الصورة بناءً على طلبك: "${userText}"`,
          engine: "Imagen 4.0",
          optimizedText: userText
        });
        toast({ title: "تم التوليد", description: "الصورة جاهزة في العقدة البصرية." });
      } else {
        const visionData = currentAttachments.find(a => a.type === 'image')?.url;
        const res = await aiChatGenerateResponse({
          message: userText,
          imageDataUri: visionData,
          isAutoMode: autoMode,
          manualModel: selectedManualModel,
          history: messages.slice(-6).map(m => ({ 
            role: m.status === 'replied' ? 'model' : 'user', 
            content: m.response || m.text 
          }))
        });
        
        await provideAIResponse(savedMsgId, user.id, {
          response: res.response,
          engine: res.engine,
          optimizedText: res.optimizedText,
          selectedModel: res.selectedModel
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Neural Link Error", description: "تعذر الاتصال بالنخاع حالياً. " + (err as Error).message });
    } finally {
      setIsAITyping(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "الملف كبير جداً", description: "الحد الأقصى هو 1.5MB للصور." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachments([{
        id: Math.random().toString(36).substring(7),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: ev.target?.result as string,
        size: `${(file.size / 1024).toFixed(0)}KB`,
        mimeType: file.type
      }]);
    };
    reader.readAsDataURL(file);
  };

  const handleEditInit = (msg: WizardMessage) => {
    setEditingMsg(msg);
    setInput(msg.originalText || msg.text);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pt-8 pb-6 px-4">
      <div className="flex-1 overflow-hidden flex flex-col glass rounded-[3.5rem] relative shadow-[0_0_80px_rgba(0,0,0,0.4)] border-white/5">
        <ScrollArea className="flex-1 p-8 md:p-12" ref={scrollRef}>
          <div className="space-y-10">
            {messages.length === 0 && !isAITyping && (
              <EmptyState 
                icon={Sparkles} 
                title="نظام NexusAI v5.5" 
                description="أنا الآن أدعم الرؤية الحاسوبية، التحسين الصامت للأوامر، وتكامل Nexus Vault لتخزين الملفات الضخمة. كيف يمكنني خدمتك تقنياً اليوم؟" 
              />
            )}
            {messages.map(m => (
              <MessageItem 
                key={m.id} 
                msg={m} 
                onEdit={handleEditInit} 
                onDelete={(id) => deleteMessage(id, user?.id || "")} 
              />
            ))}
            {isAITyping && (
              <div className="flex justify-start items-center gap-3 text-[10px] text-primary animate-pulse font-black px-14 uppercase tracking-[0.2em]">
                <Zap className="size-4" /> 
                جاري المعالجة العصبية...
              </div>
            )}
          </div>
        </ScrollArea>

        {editingMsg && (
          <div className="px-10 py-2 bg-indigo-500/10 border-y border-indigo-500/20 flex justify-between items-center animate-in slide-in-from-bottom-2">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <Pencil className="size-3" /> جاري تعديل الطلب القديم...
            </p>
            <Button variant="ghost" size="icon" className="size-6 text-red-400" onClick={() => { setEditingMsg(null); setInput(""); }}>
              <X className="size-4" />
            </Button>
          </div>
        )}

        <div className="p-8 bg-white/5 border-t border-white/5">
          <div className="relative flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} accept="image/*" />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="ghost" 
                size="icon" 
                className="size-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-indigo-400 transition-all shadow-inner"
              >
                <ImageIcon className="size-6" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-indigo-400 transition-all shadow-inner"
                  >
                    <Settings2 className="size-6" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] bg-slate-950 border-white/10 p-6 rounded-[2.5rem] shadow-2xl overflow-hidden">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <h4 className="font-bold text-sm text-white">إعدادات النخاع العصبى</h4>
                      <Cpu className="size-4 text-indigo-400" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between flex-row-reverse p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-right">
                          <Label className="text-xs font-bold text-white">الوضع التلقائي الذكي</Label>
                          <p className="text-[9px] text-muted-foreground">تحسين الأوامر واختيار أفضل موديل تلقائياً</p>
                        </div>
                        <Switch checked={autoMode} onCheckedChange={setAutoMode} />
                      </div>

                      {!autoMode && (
                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block text-right">اختيار المحرك اليدوي</Label>
                          <ScrollArea className="h-[300px] pr-2">
                            <div className="space-y-6">
                              {AVAILABLE_MODELS.map((group) => (
                                <div key={group.group} className="space-y-2">
                                  <p className="text-[9px] text-indigo-400 uppercase font-black px-2">{group.group}</p>
                                  <div className="grid gap-1.5">
                                    {group.items.map(m => (
                                      <Button 
                                        key={m.id}
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setSelectedManualModel(m.id)}
                                        className={cn(
                                          "w-full justify-between h-auto py-3 px-4 rounded-xl text-xs flex-row-reverse text-right items-center transition-all",
                                          selectedManualModel === m.id ? "bg-primary/20 text-white ring-1 ring-primary/50" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                        )}
                                      >
                                        <div className="flex flex-col gap-0.5">
                                          <span className="font-bold">{m.label}</span>
                                          <span className="text-[8px] opacity-60">{m.desc}</span>
                                        </div>
                                        {selectedManualModel === m.id && <Check className="size-3 text-primary" />}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={editingMsg ? "أدخل التعديلات الجديدة..." : "تخيل مدينة مستقبلية... أو حلل هذه الصورة..."} 
              className="h-14 bg-white/5 border-white/10 rounded-2xl px-8 text-right text-lg focus-visible:ring-primary shadow-inner flex-1"
              dir="auto"
            />

            <Button 
              onClick={handleSend} 
              disabled={isAITyping || (!input.trim() && attachments.length === 0)} 
              size="icon" 
              className={cn(
                "size-14 rounded-2xl shadow-2xl transition-all duration-500",
                editingMsg ? "bg-indigo-600 shadow-indigo-600/20" : "bg-primary shadow-primary/20"
              )}
            >
              {isAITyping ? <Loader2 className="animate-spin" /> : editingMsg ? <RefreshCcwIcon className="size-6" /> : <Wand2 className="size-6" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const RefreshCcwIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
);
