'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useAgentStore } from '@/lib/agent-store';
import { useToast } from '@/hooks/use-toast';
import { getRepoTree, getFileContent } from '@/lib/github-sync-service';
import { saveAgentMessage, createAgentConversation, getAgentMessagesSnapshot } from '@/lib/agent-history-service';
import { useAuth } from '@/components/auth/auth-provider';

/**
 * [STABILITY_ANCHOR: USE_AGENT_CHAT_V4.0]
 * Custom hook for the Neural Architect Agent Chat.
 * Supports Multimodal interaction (Text + Images).
 */

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: { path: string; content: string; language: string }[];
  engine?: string;
  image?: string | null;
}

export function useAgentChat(onQuotaExceeded?: () => void) {
  const { user } = useAuth();
  const { 
    setFiles, addLog, preferredAI, setPreferredAI, 
    autoFallback, setAutoFallback, linkedRepo, 
    githubToken, repoTree, setRepoTree,
    activeConversationId, setActiveConversationId
  } = useAgentStore();
  const { toast } = useToast();

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // مزامنة المحادثة مع Firestore
  useEffect(() => {
    if (user?.id && activeConversationId) {
      const unsub = getAgentMessagesSnapshot(user.id, activeConversationId, (firestoreMessages) => {
        setMessages(firestoreMessages as any);
      });
      return () => unsub();
    } else if (!activeConversationId) {
      setMessages([]); // Reset if no active conversation
    }
  }, [user?.id, activeConversationId]);

  const handleSend = useCallback(async (content: string, imageDataUri?: string | null) => {
    if ((!content.trim() && !imageDataUri) || isLoading || !user) return;

    let convId = activeConversationId;

    // إنشاء محادثة جديدة إذا لم تكن موجودة
    if (!convId) {
      try {
        const newTitle = content.slice(0, 30) || "محادثة برمجية جديدة";
        const newConv = await createAgentConversation(user.id, newTitle, linkedRepo);
        convId = newConv.id;
        setActiveConversationId(convId);
      } catch (e) {
        toast({ variant: 'destructive', title: 'فشل بدء المحادثة', description: 'تعذر إنشاء سجل في Firestore.' });
        return;
      }
    }

    // بناء رسالة المستخدم وحفظها محلياً مؤقتاً (للسرعة) وحفظها في Firestore
    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      image: imageDataUri,
    };

    // لا نحتاج لتحديث setMessages يدوياً لأن Snapshot سيتكفل بذلك
    await saveAgentMessage(user.id, convId, userMessage);
    
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // جلب شجرة المستودع إذا لم تكن موجودة
      let currentTree = repoTree;
      if (linkedRepo && githubToken && !currentTree) {
        try {
          const treeData = await getRepoTree(githubToken, linkedRepo.full_name.split('/')[0], linkedRepo.name, linkedRepo.default_branch);
          currentTree = treeData.tree;
          setRepoTree(currentTree);
        } catch (e) {
          console.error("Failed to fetch repo tree", e);
        }
      }

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
          imageDataUri,
          linkedRepo,
          repoTree: currentTree?.slice(0, 100).map((f: any) => f.path), // إرسال أول 100 ملف كفهرس
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

      await saveAgentMessage(user.id, convId, assistantMessage);

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
      if (err.name === 'AbortError') return;
      
      if (err.message !== 'quota_exceeded') {
        toast({
          variant: 'destructive',
          title: 'فشل الإرسال عصبياً',
          description: err.message || 'يرجى التحقق من اتصالك بالإنترنت.',
        });
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, preferredAI, autoFallback, setFiles, addLog, toast, onQuotaExceeded, user, activeConversationId, linkedRepo, githubToken, repoTree, setRepoTree, setActiveConversationId]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const reload = useCallback(async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => prev.filter(m => m.id !== messages[messages.length - 1].id));
      await handleSend(lastUserMsg.content, lastUserMsg.image);
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
