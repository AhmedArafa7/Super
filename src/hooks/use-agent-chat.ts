'use client';

import { useChat } from '@ai-sdk/react';
import { useAgentStore } from '@/lib/agent-store';
import { useToast } from '@/hooks/use-toast';
import { useCallback, useEffect } from 'react';

/**
 * [STABILITY_ANCHOR: USE_AGENT_CHAT_V2.0]
 * Custom hook to manage the Agent Chat logic, tools, and workspace sync.
 * Decouples the UI orchestration from the AI SDK implementation.
 */
export function useAgentChat(onQuotaExceeded?: () => void) {
  const { 
    setFiles, addLog, preferredAI, setPreferredAI, autoFallback, setAutoFallback 
  } = useAgentStore();
  const { toast } = useToast();

  const chatHelpers = useChat({
    api: '/api/chat',
    body: { preferredAI, autoFallback },
    onResponse: (response: any) => {
      if (response.status === 429 && onQuotaExceeded) {
        onQuotaExceeded();
      }
    },
    onError: (error: any) => {
      addLog(`اضطراب في الاتصال: ${error.message}`, 'error');
      toast({ 
        variant: "destructive", 
        title: "خطأ في النخاع العصبي", 
        description: "تعذر الاتصال بالمحرك حالياً." 
      });
    }
  } as any);

  const { messages, append, isLoading, reload, stop } = chatHelpers as any;

  // Resilient Tool Processing ( useEffect pattern for reliability )
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.toolInvocations) {
      lastMessage.toolInvocations.forEach((toolCall: any) => {
        if (toolCall.toolName === 'update_workspace_files' && toolCall.state === 'result') {
          const payload = toolCall.args;
          const callId = `processed-${toolCall.toolCallId}`;
          
          if (!(window as any)[callId]) {
            if (payload.files && payload.files.length > 0) {
              setFiles(payload.files);
              addLog(`تمت المزامنة العصبية: ${payload.explanation}`, 'success');
              toast({ 
                title: "تم تحديث الملفات", 
                description: `قام المهندس بتحديث ${payload.files.length} ملفات في بيئة العمل.`,
                className: "bg-primary text-white border-none shadow-xl"
              });
            }
            (window as any)[callId] = true;
          }
        }
      });
    }
  }, [messages, setFiles, addLog, toast]);

  const handleSend = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    try {
      await append({
        role: 'user',
        content,
      });
    } catch (err: any) {
      console.error('Neural Submission failed:', err);
      toast({ 
        variant: "destructive", 
        title: "فشل الإرسال", 
        description: "يرجى التحقق من اتصالك بالإنترنت." 
      });
      throw err; // Allow UI to handle restoration if needed
    }
  }, [append, isLoading, toast]);

  return {
    messages,
    isLoading,
    handleSend,
    reload,
    stop,
    preferredAI,
    setPreferredAI,
    autoFallback,
    setAutoFallback
  };
}
