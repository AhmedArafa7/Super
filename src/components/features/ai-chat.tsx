
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Sparkles, Zap, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore, Attachment, WizardMessage } from "@/lib/chat-store";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { generateNeuralImage } from "@/ai/flows/ai-media-generation";
import { updateUserProfile } from "@/lib/auth-store";
import { useChatAudio } from "@/hooks/use-chat-audio";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { ChatMessage } from "./chat/chat-message";
import { ChatInput } from "./chat/chat-input";
import { ChatSettings } from "./chat/chat-settings";

// Helper: extract plain text from a UIMessage's parts array (V6 SDK format)
function extractTextFromParts(parts: any[]): string {
  if (!parts || !Array.isArray(parts)) return "";
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

// Helper: build a minimal UIMessage-compatible object for manual setMessages calls
function makeUIMessage(id: string, role: "user" | "assistant", text: string): any {
  return {
    id,
    role,
    parts: [{ type: "text", text }],
  };
}

/**
 * [STABILITY_ANCHOR: CHAT_ORCHESTRATOR_V9.0_VERCEL_SDK_V6]
 * المنسق الرئيسي للدردشة الذكية - تم الترقية لمعمارية Vercel AI SDK V6 المستقرة.
 * API التي يوفرها useChat:
 *   - messages, setMessages, sendMessage, status, stop, error
 */
export function AIChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    messages: storeMessages,
    sendMessage: storeSendMessage,
    provideAIResponse: storeProvideAIResponse,
    loadMessages,
    updateMessageRequest,
    deleteMessage,
    selectedManualModel,
    setSelectedManualModel,
  } = useChatStore();

  // Local input state — SDK V6 no longer manages input/handleSubmit
  const [input, setInput] = useState("");
  const [autoRead, setAutoRead] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingMsg, setEditingMsg] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const currentMsgIdRef = useRef<string | null>(null);
  // Tracks which Firebase message IDs have already been injected into Vercel SDK
  // so we never duplicate on real-time updates from Firestore
  const syncedIdsRef = useRef<Set<string>>(new Set());

  // ─── VERCEL AI SDK V6 ────────────────────────────────────────────────────
  const {
    messages: vercelMessages,
    sendMessage: vercelSendMessage,
    status,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        preferredAI: selectedManualModel.includes("groq") ? "groq" : "googleai",
        autoFallback: true,
      },
    }),
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Neural Engine Error",
        description: err.message || "تعذر الاستجابة من الشبكة العصبية.",
      });
    },
    // V6: onFinish receives { message, messages, isAbort, isDisconnect, isError }
    onFinish: async ({ message }) => {
      if (currentMsgIdRef.current && user) {
        const responseText = extractTextFromParts(message.parts);
        await storeProvideAIResponse(currentMsgIdRef.current, user.id, {
          response: responseText,
          engine: selectedManualModel,
        });
        currentMsgIdRef.current = null;
      }
    },
  });

  // Derived loading boolean from SDK status
  const isLoading = status === "streaming" || status === "submitted";

  // ─── HISTORY SYNC (Incremental) ──────────────────────────────────────────
  // Each time Firebase delivers messages (initial load OR real-time update),
  // only inject the ones we haven't seen yet — safe against duplicates.
  useEffect(() => {
    const newMsgs: any[] = [];
    storeMessages.forEach((m) => {
      if (!syncedIdsRef.current.has(m.id)) {
        syncedIdsRef.current.add(m.id);
        newMsgs.push(makeUIMessage(m.id + "-u", "user", m.originalText || m.text));
        if (m.response) {
          newMsgs.push(makeUIMessage(m.id + "-a", "assistant", m.response));
        }
      }
    });
    if (newMsgs.length > 0) {
      setMessages((prev: any[]) => [...prev, ...newMsgs]);
    }
  }, [storeMessages, setMessages]);

  // ─── ADAPTER: UIMessage (V6) → WizardMessage (UI) ────────────────────────
  const displayMessages = useMemo<WizardMessage[]>(() => {
    const result: WizardMessage[] = [];
    let pending: Partial<WizardMessage> | null = null;

    vercelMessages.forEach((m) => {
      const text = extractTextFromParts(m.parts);

      if (m.role === "user") {
        if (pending) result.push(pending as WizardMessage);
        const originalId = m.id.replace(/-u$/, "");
        pending = {
          id: originalId,
          text,
          status: "sent",
          userId: user?.id || "",
        };
      } else if (m.role === "assistant") {
        if (!pending) {
          pending = { id: m.id, text: "", status: "sent", userId: user?.id || "" };
        }
        pending.response = text;
        pending.status = "replied";
        pending.engine = selectedManualModel;
        result.push(pending as WizardMessage);
        pending = null;
      }
    });

    if (pending) result.push(pending as WizardMessage);
    return result;
  }, [vercelMessages, selectedManualModel, user]);

  const { audioQueue, currentlyPlayingId, handleAudioFinished } =
    useChatAudio(displayMessages, autoRead);

  // ─── MODEL LIST ──────────────────────────────────────────────────────────
  const availableModels = useMemo(() => {
    const models: any[] = [
      { id: "googleai/gemini-2.5-flash", label: "NexusAI (Flash)", desc: "المحرك العصبي الأساسي" },
      { id: "groq/llama-3.3-70b-versatile", label: "Groq Llama 3.3", desc: "محرك فائق السرعة" },
    ];
    if (user?.classification === "investor" || user?.classification === "manager") {
      models.push({
        id: "googleai/gemini-1.5-pro",
        label: "Gemini Pro",
        desc: "تحليل فائق الدقة",
        count: user.proResponsesRemaining || 0,
      });
    }
    return models;
  }, [user?.classification, user?.proResponsesRemaining]);

  // ─── EFFECTS ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.id) loadMessages(user.id);
  }, [user?.id, loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [displayMessages, isLoading]);

  // ─── SEND HANDLER ────────────────────────────────────────────────────────
  const handleSendWrapper = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input?.trim() && attachments.length === 0) || isLoading || !user) return;

    if (user.dataConsent === "declined") {
      toast({
        variant: "destructive",
        title: "وضع الخصوصية المطلقة نشط",
        description:
          "لقد اخترت عدم مشاركة بياناتك، لذا تم تعطيل محرك الذكاء الاصطناعي.",
      });
      return;
    }

    if (selectedManualModel.includes("pro") && (user.proResponsesRemaining || 0) <= 0) {
      toast({
        variant: "destructive",
        title: "رصيد غير كافٍ",
        description: "لقد استهلكت كافة ردود Pro المتاحة.",
      });
      return;
    }

    const userText = input;
    const currentAttachments = [...attachments];
    setInput("");
    setAttachments([]);

    // ── Pre-flight: /imagine command ────────────────────────────────────────
    if (userText.startsWith("/imagine")) {
      const imgTarget = userText.replace("/imagine", "").trim();
      const savedMsg = await storeSendMessage(userText, user.id, user.name, currentAttachments);
      if (savedMsg) {
        setMessages((prev: any[]) => [
          ...prev,
          makeUIMessage(savedMsg.id + "-u", "user", userText),
        ]);
        await generateNeuralImage(imgTarget);
        const aiRespText = `لقد ولدت الصورة المطلوبة بنجاح بناءً على الخيال التصوري لـ (${imgTarget}).`;
        await storeProvideAIResponse(savedMsg.id, user.id, {
          response: aiRespText,
          engine: "Imagen 4.0",
        });
        setMessages((prev: any[]) => [
          ...prev,
          makeUIMessage(savedMsg.id + "-a", "assistant", aiRespText),
        ]);
      }
      return;
    }

    // ── Normal stream flight ────────────────────────────────────────────────
    let savedMsgId: string | null = null;
    if (editingMsg) {
      const success = await updateMessageRequest(editingMsg.id, user.id, userText);
      if (success) savedMsgId = editingMsg.id;
      setEditingMsg(null);
    } else {
      const savedMsg = await storeSendMessage(userText, user.id, user.name, currentAttachments);
      if (savedMsg) savedMsgId = savedMsg.id;
    }

    currentMsgIdRef.current = savedMsgId;

    if (selectedManualModel.includes("pro") && user.proResponsesRemaining !== undefined) {
      updateUserProfile(user.id, {
        proResponsesRemaining: Math.max(0, user.proResponsesRemaining - 1),
      });
    }

    // Vercel AI SDK V6 takes over streaming from here
    vercelSendMessage({ text: userText });
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) =>
      setAttachments([
        {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type: "image",
          url: ev.target?.result as string,
          size: `${(file.size / 1024).toFixed(0)}KB`,
          mimeType: file.type,
        },
      ]);
    reader.readAsDataURL(file);
  };

  // ─── PRIVACY WALL ────────────────────────────────────────────────────────
  if (user?.dataConsent === "declined") {
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
              لقد اخترت عدم مشاركة بياناتك مع النظام. حفاظاً على هذا القرار، تم تعطيل
              كافة وظائف الدردشة الذكية والمزامنة لضمان عدم خروج أي معلومة من جهازك.
            </p>
          </div>
          <Button
            onClick={() => updateUserProfile(user.id, { dataConsent: "none" })}
            className="bg-primary hover:bg-primary/90 h-12 rounded-xl font-bold px-10"
          >
            تعديل خيار الخصوصية
          </Button>
        </div>
      </div>
    );
  }

  // ─── MAIN RENDER ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pt-8 pb-6 px-4 font-sans">
      <div className="flex-1 overflow-hidden flex flex-col glass rounded-[3.5rem] relative shadow-2xl border-white/5">
        <ScrollArea className="flex-1 p-8" ref={scrollRef}>
          <div className="space-y-10">
            {displayMessages.length === 0 && !isLoading && (
              <EmptyState
                icon={Sparkles}
                title="نظام NexusAI v5.5"
                description="أنا محركك العصبي المتكامل. كيف يمكنني مساعدتك اليوم؟"
              />
            )}
            {displayMessages.map((m) => (
              <ChatMessage
                key={m.id}
                msg={m}
                user={user}
                isInAudioQueue={audioQueue.includes(m.id)}
                isMyTurnToPlay={currentlyPlayingId === m.id}
                onAudioFinished={handleAudioFinished}
                onEdit={(msg) => {
                  setEditingMsg(msg);
                  setInput(msg.originalText || msg.text);
                }}
                onDelete={(id) => deleteMessage(id, user?.id || "")}
              />
            ))}
            {isLoading && (
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
          isAITyping={isLoading}
          isEditing={!!editingMsg}
          onSend={handleSendWrapper}
          onFileSelect={handleFileSelect}
        />
      </div>
    </div>
  );
}
