
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Sparkles, Zap, Copy, ShieldAlert, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore, Attachment } from "@/lib/chat-store";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { generateNeuralImage } from "@/ai/flows/ai-media-generation";
import { updateUserProfile } from "@/lib/auth-store";
import { ToastAction } from "@/components/ui/toast";
import { useChatAudio } from "@/hooks/use-chat-audio";
import { Button } from "@/components/ui/button";

import { ChatMessage } from "./chat/chat-message";
import { ChatInput } from "./chat/chat-input";
import { ChatSettings } from "./chat/chat-settings";

/**
 * [STABILITY_ANCHOR: CHAT_ORCHESTRATOR_V7.0]
 * المنسق الرئيسي للدردشة الذكية - تم دمج بروتوكول حماية البيانات (Privacy Guard).
 */
export function AIChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    messages, sendMessage, provideAIResponse, loadMessages,
    updateMessageRequest, deleteMessage, selectedManualModel, setSelectedManualModel
  } = useChatStore();

  const [input, setInput] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingMsg, setEditingMsg] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { audioQueue, currentlyPlayingId, handleAudioFinished } = useChatAudio(messages, autoRead);

  const availableModels = useMemo(() => {
    const models: any[] = [
      { id: 'googleai/gemini-1.5-flash', label: 'NexusAI (Flash)', desc: 'المحرك العصبي الأساسي' },
      { id: 'groq/llama-3.3-70b-versatile', label: 'Groq Llama 3.3', desc: 'محرك فائق السرعة' }
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
  }, [user?.id, loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isAITyping]);

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isAITyping || !user) return;

    // بروتوكول حماية الخصوصية: إذا رفض المستخدم، يتم حظر المعالجة
    if (user.dataConsent === 'declined') {
      toast({
        variant: "destructive",
        title: "وضع الخصوصية المطلقة نشط",
        description: "لقد اخترت عدم مشاركة بياناتك، لذا تم تعطيل محرك الذكاء الاصطناعي والمزامنة مع الأدمن."
      });
      return;
    }

    if (selectedManualModel.includes('pro') && (user.proResponsesRemaining || 0) <= 0) {
      toast({ variant: "destructive", title: "رصيد غير كافٍ", description: "لقد استهلكت كافة ردود Pro المتاحة." });
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
      if (!savedMsg || !savedMsg.id) return;
      savedMsgId = savedMsg.id;
    }

    setIsAITyping(true);
    try {
      if (userText.startsWith("/imagine")) {
        await generateNeuralImage(userText.replace("/imagine", ""));
        await provideAIResponse(savedMsgId, user.id, { response: `لقد ولدت الصورة المطلوبة بنجاح.`, engine: "Imagen 4.0" });
      } else {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            isAutoMode: false,
            manualModel: selectedManualModel,
            history: messages.slice(-6).map(m => ({ role: m.status === 'replied' ? 'model' : 'user', content: m.response || m.text }))
          })
        });

        const res = await response.json();
        
        if (!response.ok || res.error) {
          throw res; // Throw the error object to be caught by the catch block
        }

        await provideAIResponse(savedMsgId, user.id, {
          response: res.response,
          engine: res.engine,
          optimizedText: res.optimizedText,
          selectedModel: res.selectedModel
        });

        if (selectedManualModel.includes('pro') && user.proResponsesRemaining !== undefined) {
          await updateUserProfile(user.id, { proResponsesRemaining: Math.max(0, user.proResponsesRemaining - 1) });
        }
      }
    } catch (err: any) {
      const diag = err.diagnostics ? `\n\nDiagnostics: ${JSON.stringify(err.diagnostics, null, 2)}` : "";
      const errorMsg = (err.message || "تعذر الاتصال بالنخاع العصبي.") + (err.diagnostics ? " (انقر لنسخ بيانات التشخيص)" : "");
      
      toast({
        variant: "destructive",
        title: "Neural Link Error",
        description: errorMsg,
        action: (
          <ToastAction altText="Copy" onClick={() => {
            navigator.clipboard.writeText(errorMsg + diag);
            toast({ title: "تم نسخ بيانات التشخيص كاملة" });
          }}>
            <Copy className="size-3 mr-1" /> نسخ التفاصيل
          </ToastAction>
        )
      });
    } finally {
      setIsAITyping(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => setAttachments([{
      id: Math.random().toString(36).substring(7),
      name: file.name,
      type: 'image',
      url: ev.target?.result as string,
      size: `${(file.size / 1024).toFixed(0)}KB`,
      mimeType: file.type
    }]);
    reader.readAsDataURL(file);
  };

  if (user?.dataConsent === 'declined') {
    return (
      <div className="flex flex-col h-full max-w-5xl mx-auto pt-8 pb-6 px-4 font-sans items-center justify-center">
        <div className="glass rounded-[3.5rem] p-16 text-center space-y-8 border-red-500/20 shadow-2xl relative overflow-hidden max-w-lg">
          <div className="absolute top-0 right-0 size-32 bg-red-500/10 blur-3xl -mr-16 -mt-16" />
          <div className="size-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-xl">
            <Lock className="size-12 text-red-400" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white">الخصوصية المطلقة نشطة</h2>
            <p className="text-muted-foreground leading-relaxed">
              لقد اخترت عدم مشاركة بياناتك مع النظام. حفاظاً على هذا القرار، تم تعطيل كافة وظائف الدردشة الذكية والمزامنة لضمان عدم خروج أي معلومة من جهازك.
            </p>
          </div>
          <Button
            onClick={() => updateUserProfile(user.id, { dataConsent: 'none' })}
            className="bg-primary hover:bg-primary/90 h-12 rounded-xl font-bold px-10"
          >
            تعديل خيار الخصوصية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pt-8 pb-6 px-4 font-sans">
      <div className="flex-1 overflow-hidden flex flex-col glass rounded-[3.5rem] relative shadow-2xl border-white/5">
        <ScrollArea className="flex-1 p-8" ref={scrollRef}>
          <div className="space-y-10">
            {messages.length === 0 && !isAITyping && (
              <EmptyState icon={Sparkles} title="نظام NexusAI v5.5" description="أنا محركك العصبي المتكامل. كيف يمكنني مساعدتك اليوم؟" />
            )}
            {messages.map(m => (
              <ChatMessage
                key={m.id}
                msg={m}
                user={user}
                isInAudioQueue={audioQueue.includes(m.id)}
                isMyTurnToPlay={currentlyPlayingId === m.id}
                onAudioFinished={handleAudioFinished}
                onEdit={(msg) => { setEditingMsg(msg); setInput(msg.originalText || msg.text); }}
                onDelete={(id) => deleteMessage(id, user?.id || "")}
              />
            ))}
            {isAITyping && (
              <div className="flex justify-start items-center gap-3 text-[10px] text-primary animate-pulse font-black px-14 uppercase tracking-[0.2em]">
                <Zap className="size-4" /> جاري المعالجة العصبية...
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-8 flex items-center justify-between flex-row-reverse mb-4">
          <ChatSettings
            availableModels={availableModels}
            selectedModel={selectedManualModel}
            autoRead={autoRead}
            onModelChange={setSelectedManualModel}
            onAutoReadChange={setAutoRead}
          />
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          isAITyping={isAITyping}
          isEditing={!!editingMsg}
          onSend={handleSend}
          onFileSelect={handleFileSelect}
        />
      </div>
    </div>
  );
}
