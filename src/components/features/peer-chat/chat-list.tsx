
'use client';

import React from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function ChatList({ contacts, activeContactId, onSelect }: { contacts: any[], activeContactId?: string, onSelect: (id: string) => void }) {
  return (
    <aside className="w-80 flex flex-col h-full border-l border-white/5 bg-slate-900/20 hidden md:flex">
      <div className="p-6 border-b border-white/5">
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="بحث في جهات الاتصال..." className="h-10 pr-9 bg-white/5 border-white/10 rounded-xl text-right text-xs" />
        </div>
        <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] text-right">المحادثات النشطة</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {contacts.length === 0 ? (
            <div className="py-10 text-center opacity-20"><MessageSquare className="size-8 mx-auto mb-2" /><p className="text-xs">لا توجد محادثات</p></div>
          ) : (
            contacts.map(c => (
              <button 
                key={c.id} 
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full p-4 rounded-2xl flex items-center gap-4 transition-all flex-row-reverse text-right group",
                  activeContactId === c.id ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5 border border-transparent"
                )}
              >
                <div className="size-10 rounded-xl overflow-hidden shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                  <img src={c.avatar_url || `https://picsum.photos/seed/${c.username}/40/40`} className="size-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-bold truncate", activeContactId === c.id ? "text-primary" : "text-white")}>{c.name}</p>
                  <p className="text-[9px] text-muted-foreground truncate uppercase font-mono">@{c.username}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
