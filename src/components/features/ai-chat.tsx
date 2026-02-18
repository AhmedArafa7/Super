
"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { Send, Bot, User, Sparkles, Paperclip, Mic, Loader2, Pencil, Trash2, X, FileText, Download, MoreVertical, Zap, ChevronDown, ChevronUp, Wifi, ImageIcon, Video, Volume2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useChatStore, WizardMessage, Attachment } from "@/lib/chat-store";
import { clearAllUnreadNotifications } from "@/lib/notification-store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { aiChatGenerateResponse } from "@/ai/flows/ai-chat-generate-response";
import { generateNeuralImage } from "@/ai/flows/ai-media-generation";
import { textToNeuralSpeech } from "@/ai/flows/ai-audio-flows";

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
    <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* فقاعة المستخدم */}
      <div className="flex items-start gap-3 justify-end group relative">
        <div className="flex flex-col gap-2 items-end max-w-[85%]">
          <div className={cn("p-4 shadow-lg relative message-bubble-user text-white")}>
            <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap text-right">{msg.originalText || msg.text}</p>
          </div>
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {msg.attachments.map(att => (
                <div key={att.id} className="size-32 rounded-xl overflow-hidden border border-white/10 glass">
                  {att.type === 'image' && <img src={att.url} className="size-full object-cover" />}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="size-8 rounded-full glass flex items-center justify-center mt-1 shrink-0"><User className="size-4 text-indigo-400" /></div>
      </div>

      {/* فقاعة الـ AI */}
      {msg.status === 'replied' && (
        <div className="flex items-start gap-3 justify-start animate-in slide-in-from-left-4 duration-500">
          <div className="size-8 rounded-full glass flex items-center justify-center mt-1 shrink-0"><Bot className="size-4 text-indigo-400" /></div>
          <div className="flex flex-col gap-2 items-start max-w-[80%]">
            <div className="p-4 message-bubble-ai border border-white/5 shadow-lg relative">
              <p dir="auto" className="text-sm leading-relaxed whitespace-pre-wrap text-right text-white">{msg.response}</p>
              
              <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-3">
                <Button variant="ghost" size="sm" onClick={handleSpeak} disabled={isSpeaking} className="h-7 px-2 text-[10px] gap-1 text-muted-foreground hover:text-white">
                  {isSpeaking ? <Loader2 className="size-3 animate-spin" /> : <Volume2 className="size-3" />}
                  {audioUrl ? "إعادة النطق" : "نطق الرد"}
                </Button>
                <div className="flex items-center gap-1 opacity-30 text-[8px]">
                  <Zap className="size-2 text-indigo-400" />
                  <span>{msg.engine}</span>
                </div>
              </div>
              
              {audioUrl && (
                <audio controls className="mt-3 h-8 w-full scale-90 origin-left" src={audioUrl} autoPlay />
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
  const { messages, sendMessage, provideAIResponse, loadMessages } = useChatStore();

  const [input, setInput] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) loadMessages(user.id);
  }, [user?.id]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0 || isAITyping || !user) return;

    const userText = input;
    const currentAttachments = [...attachments];
    setInput("");
    setAttachments([]);
    
    const savedMsg = await sendMessage(userText, user.id, user.name, currentAttachments);
    if (!savedMsg) return;

    setIsAITyping(true);
    try {
      // إذا كانت الرسالة تبدأ بـ "تخيل" أو "ارسم"، نستخدم Imagen
      if (userText.startsWith("تخيل") || userText.startsWith("ارسم") || userText.startsWith("/imagine")) {
        const result = await generateNeuralImage(userText);
        await provideAIResponse(savedMsg.id, user.id, {
          response: `لقد قمت بتوليد الصورة بناءً على طلبك: "${userText}"`,
          engine: "Imagen 4.0",
          optimizedText: userText
        });
        toast({ title: "تم التوليد", description: "الصورة جاهزة في العقدة البصرية." });
      } else {
        // الرد الطبيعي (يدعم الرؤية إذا وجدت صورة)
        const visionData = currentAttachments.find(a => a.type === 'image')?.url;
        const res = await aiChatGenerateResponse({
          message: userText,
          imageDataUri: visionData,
          history: messages.slice(-4).map(m => ({ role: m.status === 'replied' ? 'model' : 'user', content: m.response || m.text }))
        });
        await provideAIResponse(savedMsg.id, user.id, {
          response: res.response,
          engine: res.engine
        });
      }
    } finally {
      setIsAITyping(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > MAX_FILE_SIZE) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachments([{
        id: Math.random().toString(36).substring(7),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: ev.target?.result as string,
        size: '1MB',
        mimeType: file.type
      }]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pt-8 pb-4 px-4">
      <div className="flex-1 overflow-hidden flex flex-col glass rounded-[3rem] relative shadow-2xl">
        <ScrollArea className="flex-1 p-8" ref={scrollRef}>
          <div className="space-y-8">
            {messages.length === 0 && !isAITyping && (
              <EmptyState icon={Sparkles} title="النواة الذكية v5.0" description="أنا الآن أدعم الرؤية، توليد الصور السينمائية، والنطق الصوتي." />
            )}
            {messages.map(m => <MessageItem key={m.id} msg={m} onEdit={() => {}} onDelete={() => {}} />)}
            {isAITyping && <div className="flex justify-start items-center gap-2 text-[10px] text-primary animate-pulse font-bold px-12 uppercase"><Zap className="size-3" /> جاري التفكير عصبياً...</div>}
          </div>
        </ScrollArea>

        {attachments.length > 0 && (
          <div className="px-8 py-2 bg-black/20 flex gap-2">
            {attachments.map(a => (
              <div key={a.id} className="relative size-16 rounded-lg overflow-hidden border border-primary/30">
                <img src={a.url} className="size-full object-cover" />
                <button onClick={() => setAttachments([])} className="absolute top-0 right-0 bg-red-500 p-0.5"><X className="size-2" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="p-6 bg-white/5 border-t border-white/5">
          <div className="relative flex items-center gap-3">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} accept="image/*" />
            <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" className="size-12 rounded-2xl bg-white/5 border border-white/10 hover:text-indigo-400">
              <ImageIcon className="size-5" />
            </Button>
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="ارسم مدينة مستقبلية... أو حلل هذه الصورة..." 
              className="h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-right"
              dir="auto"
            />
            <Button onClick={handleSend} disabled={isAITyping} size="icon" className="size-14 rounded-2xl bg-primary shadow-xl shadow-primary/20">
              {isAITyping ? <Loader2 className="animate-spin" /> : <Wand2 className="size-6" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
