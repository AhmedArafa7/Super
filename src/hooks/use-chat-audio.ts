
'use client';

import { useState, useEffect } from 'react';
import { WizardMessage } from '@/lib/chat-store';

/**
 * [STABILITY_ANCHOR: CHAT_AUDIO_HOOK_V1.0]
 * خطاف برمجي مستقل لإدارة طابور القراءة التلقائية ومنع تداخل الأصوات.
 */
export function useChatAudio(messages: WizardMessage[], autoRead: boolean) {
  const [autoReadActiveAt, setAutoReadActiveAt] = useState<number | null>(null);
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (autoRead) {
      setAutoReadActiveAt(Date.now());
    } else {
      setAutoReadActiveAt(null);
      setAudioQueue([]);
      setCurrentlyPlayingId(null);
    }
  }, [autoRead]);

  useEffect(() => {
    if (!autoRead || !autoReadActiveAt) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.status === 'replied' && !audioQueue.includes(lastMsg.id)) {
      const msgTime = new Date(lastMsg.timestamp).getTime();
      if (msgTime >= autoReadActiveAt) {
        setAudioQueue(prev => [...prev, lastMsg.id]);
      }
    }
  }, [messages, autoRead, autoReadActiveAt, audioQueue]);

  useEffect(() => {
    if (!currentlyPlayingId && audioQueue.length > 0) {
      setCurrentlyPlayingId(audioQueue[0]);
    }
  }, [audioQueue, currentlyPlayingId]);

  const handleAudioFinished = () => {
    setTimeout(() => {
      setAudioQueue(prev => prev.slice(1));
      setCurrentlyPlayingId(null);
    }, 800);
  };

  return {
    audioQueue,
    currentlyPlayingId,
    handleAudioFinished
  };
}
