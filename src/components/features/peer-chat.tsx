
'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/auth-provider';
import { getStoredUsers } from '@/lib/auth-store';
import { ChatList } from './peer-chat/chat-list';
import { ChatWindow } from './peer-chat/chat-window';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * [STABILITY_ANCHOR: PEER_CHAT_ORCHESTRATOR_V1.0]
 * المنسق الرئيسي لقسم التواصل البشري المباشر (Direct Link).
 */
export function PeerChat({ initialTargetId }: { initialTargetId?: string }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialTargetId || null);

  useEffect(() => {
    const load = async () => {
      const all = await getStoredUsers();
      // استبعاد المستخدم الحالي من القائمة
      setContacts(all.filter(u => u.id !== user?.id));
    };
    load();
  }, [user?.id]);

  const activeContact = contacts.find(c => c.id === selectedId);

  return (
    <div className="h-full flex flex-col md:flex-row p-4 md:p-8 gap-6 animate-in fade-in duration-700">
      <ChatList 
        contacts={contacts} 
        activeContactId={selectedId || undefined} 
        onSelect={setSelectedId} 
      />

      <main className="flex-1 h-full min-h-[500px]">
        {activeContact ? (
          <ChatWindow currentUser={user} targetUser={activeContact} />
        ) : (
          <div className="h-full flex items-center justify-center glass rounded-[3rem] border-white/5">
            <EmptyState 
              icon={MessageCircle} 
              title="Direct Link Console" 
              description="اختر عقدة بشرية من القائمة الجانبية لبدء تشفير رابط مراسلة مباشر." 
            />
          </div>
        )}
      </main>
    </div>
  );
}
