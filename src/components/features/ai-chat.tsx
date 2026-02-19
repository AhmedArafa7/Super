
"use client";

import React, { useState, useRef, useEffect, memo, useMemo } from "react";
import { 
  Send, Bot, User, Sparkles, ImageIcon, Settings2, Loader2, Pencil, 
  Trash2, MoreVertical, Zap, ChevronDown, ChevronUp, Volume2, Wand2, 
  Check, Cpu, BrainCircuit
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
import { Badge } from "@/components/ui/badge";
import { useChatStore, WizardMessage, Attachment } from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { aiChatGenerateResponse } from "@/ai/flows/ai-chat-generate-response";
import { generateNeuralImage } from "@/ai/flows/ai-media-generation";
import { textToNeuralSpeech } from "@/ai/flows/ai-audio-flows";
import { updateUserProfile } from "@/lib/auth-store";

const MAX_FILE_SIZE = 1.5 * 1024 * 1024;

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
      <div className="flex items-start gap-3 justify-end group relative">
        <div className="absolute right-full top-0 mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-xl hover:bg-white/10 text-muted-foreground"><MoreVertical className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white rounded-xl">
              <DropdownMenuItem onClick={() => onEdit(msg)} className="gap-2 flex-row-reverse text-right text-xs"><Pencil className="size-3.5" /> تعديل الطلب</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(msg.id)} className="gap-2 flex-row-reverse text-right text-xs text-red-400 focus:text-red-400"><Trash2 className="size-3.5" /> حذف السجل</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-2 items-end max-w-[85%]">
          <div className={cn("p-4 shadow-xl relative message-bubble-user text-white")}>
            <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap text-right">{msg.originalText || msg.text}</p>
          </div>
          
          {msg.optimizedText && (
            <div className="w-full mt-1 flex flex-col items-end gap-2">
              <button onClick={() => setShowOptimized(!showOptimized)} className="flex items-center gap-1 text-[10px] text-indigo-300 bg-indigo-500/5 px-2 py-1 rounded-full border border-indigo-500/10">
                {showOptimized ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                <span>{showOptimized ? "إخفاء التحسين" : "عرض التحسين العصبي"}</span>
              </button>
              {showOptimized && (
                <div className="w-full animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="h-px bg-white/40 w-full mb-2" /> 
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-right backdrop-blur-sm">
                    <p className="text-[9px] text-indigo-400 font-black uppercase mb-1 tracking-[0.2em]">النص المحسن عصبيًا</p>
                    <p dir="auto" className="text-xs text-indigo-100/70 italic leading-relaxed">{msg.optimizedText}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="size-10 rounded-2xl glass flex items-center justify-center mt-1 shrink-0 border border-indigo-500/20 shadow-inner"><User className="size-5 text-indigo-400" /></div>
      </div>

      {msg.status === 'replied' && (
        <div className="flex items-start gap-3 justify-start animate-in slide-in-from-left-4 duration-500">
          <div className="size-10 rounded-2xl glass flex items-center justify-center mt-1 shrink-0 border border-primary/20 shadow-inner"><Bot className="size-5 text-primary" /></div>
          <div className="flex flex-col gap-2 items-start max-w-[85%]">
            <div className="p-5 message-bubble-ai border border-white/5 shadow-2xl relative">
              <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap text-right text-white/90">{msg.response}</p>
              <div className="mt-5 flex items-center gap-4 border-t border-white/5 pt-4">
                <Button variant="ghost" size="sm" onClick={handleSpeak} disabled={isSpeaking} className="h-8 px-3 text-[10px] gap-2 text-muted-foreground hover:text-white bg-white/5 rounded-lg border border-white/5">
                  {isSpeaking ? <Loader2 className="size-3 animate-spin" /> : <Volume2 className="size-3" />} {audioUrl ? "إعادة النطق" : "نطق الرد"}
                </Button>
                <div className="flex items-center gap-2 opacity-40 text-[9px] font-mono tracking-tighter"><Zap className="size-3 text-indigo-400" /><span>{msg.engine}</span></div>
              </div>
              {audioUrl && <div className="mt-4 p-2 bg-black/40 rounded-xl border border-white/5"><audio controls className="h-8 w-full scale-90" src={audioUrl} autoPlay /></div>}
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
    updateMessageRequest, deleteMessage, selectedManualModel, setSelectedManualModel 
  } = useChatStore();

  const [input, setInput] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingMsg, setEditingMsg] = useState<WizardMessage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // [STABILITY_ANCHOR: TIERED_ACCESS_LOGIC]
  const availableModels = useMemo(() => {
    const models = [
      { id: 'googleai/gemini-1.5-flash', label: 'NexusAI', desc: 'المحرك العصبي الأساسي' }
    ];
    
    if (user?.classification === 'investor' || user?.classification === 'manager') {
      models.push({ 
        id: 'googleai/gemini-1.5-pro', 
        label: 'Gemini Pro', 
        desc: 'تحليل فائق الدقة',
        count: user.proResponsesRemaining || 0
      });
    }
    return models;
  }, [user?.classification, user?.proResponsesRemaining]);

  useEffect(() => {
    if (user?.id) loadMessages(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isAITyping]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0 || isAITyping || !user) return;

    // Check if Pro limit is reached
    if (selectedManualModel === 'googleai/gemini-1.5-pro' && (user.proResponsesRemaining || 0) <= 0) {
      toast({ variant: "destructive", title: "رصيد غير كافٍ", description: "لقد استهلكت كافة ردود Pro المتاحة لك حالياً." });
      return;
    }

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
      if (userText.startsWith("/imagine")) {
        const result = await generateNeuralImage(userText);
        await provideAIResponse(savedMsgId, user.id, { response: `لقد ولدت الصورة: "${userText}"`, engine: "Imagen 4.0" });
      } else {
        const res = await aiChatGenerateResponse({
          message: userText,
          isAutoMode: false,
          manualModel: selectedManualModel,
          history: messages.slice(-6).map(m => ({ role: m.status === 'replied' ? 'model' : 'user', content: m.response || m.text }))
        });
        
        await provideAIResponse(savedMsgId, user.id, {
          response: res.response,
          engine: res.engine,
          optimizedText: res.optimizedText,
          selectedModel: res.selectedModel
        });

        // Decrement counter if Pro was used
        if (selectedManualModel === 'googleai/gemini-1.5-pro' && user.proResponsesRemaining !== undefined) {
          await updateUserProfile(user.id, { proResponsesRemaining: Math.max(0, user.proResponsesRemaining - 1) });
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Neural Link Error", description: "تعذر الاتصال بالنخاع." });
    } finally {
      setIsAITyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pt-8 pb-6 px-4 font-sans">
      <div className="flex-1 overflow-hidden flex flex-col glass rounded-[3.5rem] relative shadow-2xl border-white/5">
        <ScrollArea className="flex-1 p-8" ref={scrollRef}>
          <div className="space-y-10">
            {messages.length === 0 && !isAITyping && (
              <EmptyState icon={Sparkles} title="نظام NexusAI v5.5" description="أنا محركك العصبي المتكامل. كيف يمكنني مساعدتك اليوم؟" />
            )}
            {messages.map(m => (
              <MessageItem key={m.id} msg={m} onEdit={(msg) => { setEditingMsg(msg); setInput(msg.originalText || msg.text); }} onDelete={(id) => deleteMessage(id, user?.id || "")} />
            ))}
            {isAITyping && (
              <div className="flex justify-start items-center gap-3 text-[10px] text-primary animate-pulse font-black px-14 uppercase tracking-[0.2em]"><Zap className="size-4" /> جاري المعالجة العصبية...</div>
            )}
          </div>
        </ScrollArea>

        <div className="p-8 bg-white/5 border-t border-white/5">
          <div className="relative flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10">
                    <Settings2 className="size-6 text-indigo-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-slate-950 border-white/10 p-6 rounded-[2.5rem]">
                  <div className="space-y-6 text-right">
                    <div className="flex items-center justify-between flex-row-reverse"><h4 className="font-bold text-sm text-white">إعدادات النخاع</h4><Cpu className="size-4 text-indigo-400" /></div>
                    <div className="grid gap-2">
                      {availableModels.map(m => (
                        <Button 
                          key={m.id} 
                          variant="ghost" 
                          onClick={() => setSelectedManualModel(m.id)}
                          className={cn("justify-between flex-row-reverse h-14 rounded-xl px-4", selectedManualModel === m.id && "bg-primary/20 border border-primary/30")}
                          disabled={m.id === 'googleai/gemini-1.5-pro' && (m.count || 0) <= 0}
                        >
                          <div className="flex items-center gap-3 flex-row-reverse">
                            <span className="font-bold">{m.label}</span>
                            {m.count !== undefined && (
                              <div className="size-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white shadow-inner">{m.count}</div>
                            )}
                          </div>
                          {selectedManualModel === m.id && <Check className="size-4 text-primary" />}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" className="size-14 rounded-2xl bg-white/5 border border-white/10"><ImageIcon className="size-6 text-indigo-400" /></Button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setAttachments([{ id: Math.random().toString(36).substring(7), name: file.name, type: 'image', url: ev.target?.result as string, size: `${(file.size/1024).toFixed(0)}KB`, mimeType: file.type }]);
                  reader.readAsDataURL(file);
                }
              }} />
            </div>

            <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={editingMsg ? "تعديل الطلب..." : "تحدث إلى NexusAI..."} className="h-14 bg-white/5 border-white/10 rounded-2xl px-8 text-right flex-1" dir="auto" />
            <Button onClick={handleSend} disabled={isAITyping} size="icon" className="size-14 rounded-2xl bg-primary shadow-xl shadow-primary/20">{isAITyping ? <Loader2 className="animate-spin" /> : <Wand2 className="size-6" />}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
