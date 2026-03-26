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
    activeConversationId, setActiveConversationId,
    coreFileContents, addCoreFileContent
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

  // [PROACTIVE_CONTEXT]: جلب الملفات الأساسية فور تحميل شجرة المجلدات
  useEffect(() => {
    if (!githubToken || !linkedRepo || !repoTree || repoTree.length === 0) return;

    const [owner, name] = linkedRepo.full_name.split('/');
    
    // قائمة الملفات عالية الأهمية التي يحتاجها المهندس لفهم المشروع فوراً (Capacitor/Android/Firebase)
    const PRIORITY_PATTERNS = [
      'package.json',
      'capacitor.config.json',
      'capacitor.config.ts',
      'capacitor.config.js',
      'AndroidManifest.xml',
      'MainActivity.java',
      'MainActivity.kt',
      'build.gradle',
      'google-services.json',
      '.firebaserc',
      'firebase.json',
      'index.html',
      'page.tsx',
      'page.jsx',
      'App.tsx',
      'src/main.ts',
      'main.js'
    ];

    const filesToFetch = repoTree
      .filter(item => 
        item.type === 'blob' && 
        PRIORITY_PATTERNS.some(p => item.path.endsWith(p)) &&
        !coreFileContents[item.path]
      )
      .slice(0, 20); // زيادة القدرة الاستيعابية لملفات الكود الأساسية

    if (filesToFetch.length > 0) {
      addLog(`جاري تحليل هيكلة المشروع وجلب ملفات التكوين (${filesToFetch.length})...`, "info");
      
      filesToFetch.forEach(async (file) => {
        try {
          const content = await getFileContent(githubToken, owner, name, file.path);
          addCoreFileContent(file.path, content);
        } catch (e) {
          console.error(`Failed to fetch proactive file: ${file.path}`, e);
        }
      });
    }
  }, [repoTree, githubToken, linkedRepo, coreFileContents, addCoreFileContent, addLog]);

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
          repoTree: repoTree?.map(f => f.path),
          coreFileContents, // إرسال محتويات الملفات الأساسية المحملة مسبقاً
        }),
      });

      if (response.status === 429) {
        onQuotaExceeded?.();
        throw new Error('quota_exceeded');
      }

      const res = await response.json();
      console.log('--- Agent Raw Response ---', res);

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

      // --- [NEW]: Fetch requested files and auto-retry ---
      if (res.requestedFiles && res.requestedFiles.length > 0 && githubToken && linkedRepo) {
        // Safety net: filter paths to only those verified in the repoTree
        const repoTreePaths = new Set((repoTree || []).map((f: any) => f.path));
        const validPaths = res.requestedFiles.filter((p: string) => repoTreePaths.has(p));
        const invalidPaths = res.requestedFiles.filter((p: string) => !repoTreePaths.has(p));
        
        if (invalidPaths.length > 0) {
          addLog(`⚠️ مسارات غير صحيحة تجاهلها النظام: ${invalidPaths.join(', ')}`, 'info');
          console.warn('[Agent Guard] Ignored invalid file paths not in repoTree:', invalidPaths);
        }

        if (validPaths.length > 0) {
          addLog(`يطلب المهندس ${validPaths.length} ملف، جاري الجلب التلقائي...`, 'info');
          const [owner, repoName] = linkedRepo.full_name.split('/');
          
          const newlyFetched: Record<string, string> = {};
          for (const filePath of validPaths) {
            if (!coreFileContents[filePath]) {
              try {
                const fileContent = await getFileContent(githubToken, owner, repoName, filePath);
                addCoreFileContent(filePath, fileContent);
                newlyFetched[filePath] = fileContent;
              } catch (e) {
                console.error(`Failed to fetch requested file: ${filePath}`, e);
              }
            }
          }
          
          if (Object.keys(newlyFetched).length > 0) {
            addLog(`تم جلب ${Object.keys(newlyFetched).length} ملف. جاري إعادة الإرسال تلقائياً...`, 'success');
            // --- AUTO-RETRY: Re-send the same user message now that files are available ---
            const enrichedCoreFiles = { ...coreFileContents, ...newlyFetched };
            const retryResponse = await fetch('/api/agent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: history,
                preferredAI,
                autoFallback,
                imageDataUri,
                linkedRepo,
                repoTree: repoTree?.map(f => f.path),
                coreFileContents: enrichedCoreFiles,
              }),
            });

            if (retryResponse.ok) {
              const retryRes = await retryResponse.json();
              console.log('--- Agent Retry Response ---', retryRes);
              if (retryRes.success) {
                const retryMsg: AgentMessage = {
                  id: (Date.now() + 2).toString(),
                  role: 'assistant',
                  content: retryRes.explanation || 'تمت المعالجة.',
                  files: retryRes.files,
                  engine: retryRes.engine,
                };
                await saveAgentMessage(user.id, convId!, retryMsg);
                if (retryRes.files?.length > 0) {
                  setFiles(retryRes.files);
                }
                addLog('✅ أجاب المهندس بعد قراءة الملفات المطلوبة.', 'success');
              }
            }
          }
        }
      }

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
  }, [messages, isLoading, preferredAI, autoFallback, setFiles, addLog, toast, onQuotaExceeded, user, activeConversationId, linkedRepo, githubToken, repoTree, setRepoTree, setActiveConversationId, coreFileContents, addCoreFileContent]);

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
