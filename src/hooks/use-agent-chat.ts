'use client';

import { useCallback, useRef, useState } from 'react';
import { useAgentStore } from '@/lib/agent-store';
import { useToast } from '@/hooks/use-toast';

/**
 * [STABILITY_ANCHOR: USE_AGENT_CHAT_V3.0]
 * Custom hook for the Neural Architect Agent Chat.
 * Uses direct fetch (not useChat SDK) for maximum stability, matching
 * the proven pattern of /api/ai/generate used by ai-chat.tsx.
 */

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: { path: string; content: string; language: string }[];
  engine?: string;
}

export function useAgentChat(onQuotaExceeded?: () => void) {
  const { setFiles, addLog, preferredAI, setPreferredAI, autoFallback, setAutoFallback } = useAgentStore();
  const { toast } = useToast();

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSend = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // بناء سجل المحادثة لإرساله مع الطلب
    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // إنشاء AbortController للسماح بالإلغاء
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const history = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history,
          preferredAI,
          autoFallback,
        }),
      });

      if (response.status === 429) {
        onQuotaExceeded?.();
        throw new Error('quota_exceeded');
      }

      const res = await response.json();

      if (!response.ok || !res.success) {
        throw new Error(res.error || 'Neural connection failed');
      }

      const assistantMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.explanation || 'تمت المعالجة.',
        files: res.files,
        engine: res.engine,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // مزامنة الملفات مع بيئة العمل إذا وُجدت
      if (res.files && res.files.length > 0) {
        setFiles(res.files);
        addLog(`تمت المزامنة العصبية: ${res.explanation}`, 'success');
        toast({
          title: '✅ تم تحديث الملفات',
          description: `قام المهندس بتحديث ${res.files.length} ملف في بيئة العمل.`,
          className: 'bg-primary text-white border-none shadow-xl',
        });
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        addLog('تم إلغاء العملية من قبل المستخدم.', 'info');
        return;
      }
      if (err.message !== 'quota_exceeded') {
        addLog(`خطأ في الاتصال: ${err.message}`, 'error');
        toast({
          variant: 'destructive',
          title: 'فشل الإرسال',
          description: 'يرجى التحقق من اتصالك بالإنترنت.',
        });
        // إزالة رسالة المستخدم عند الفشل لإتاحة إعادة المحاولة
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, preferredAI, autoFallback, setFiles, addLog, toast, onQuotaExceeded]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    addLog('تم إيقاف التوليد.', 'info');
  }, [addLog]);

  const reload = useCallback(async () => {
    // إعادة إرسال آخر رسالة من المستخدم
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => prev.filter(m => m.id !== messages[messages.length - 1].id));
      await handleSend(lastUserMsg.content);
    }
  }, [messages, handleSend]);

  return {
    messages,
    isLoading,
    handleSend,
    stop: stopGeneration,
    reload,
    preferredAI,
    setPreferredAI,
    autoFallback,
    setAutoFallback,
  };
}
