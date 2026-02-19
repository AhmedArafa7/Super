
'use client';

import React from 'react';
import { MessageSquare, Search, Circle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function ChatList({ contacts, activeContactId, onSelect }: { contacts: any[], activeContactId?: string, onSelect: (id: string) => void }) {
  return (
    <aside className="w-full md:w-80 flex flex-col h-full border-l border-white/5 bg-slate-900/20">
      <div className="p-6 border-b border-white/5">
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="بحث في جهات الاتصال..." className="h-10 pr-9 bg-white/5 border-white/10 rounded-xl text-right text-xs" />
        </div>
        <div className="flex items-center justify-between flex-row-reverse">
          <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] text-right">المحادثات النشطة</h2>
          <Badge variant="outline" className="border-white/10 text-[8px] opacity-50 px-2">{contacts.length}</Badge>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {contacts.length === 0 ? (
            <div className="py-20 text-center opacity-20">
              <MessageSquare className="size-12 mx-auto mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest">لا توجد اتصالات حالية</p>
            </div>
          ) : (
            contacts.map(c => (
              <button 
                key={c.id} 
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full p-4 rounded-[1.5rem] flex items-center gap-4 transition-all flex-row-reverse text-right group relative",
                  activeContactId === c.id ? "bg-primary/10 border border-primary/20 shadow-inner" : "hover:bg-white/5 border border-transparent"
                )}
              >
                <div className="relative shrink-0">
                  <div className="size-12 rounded-2xl overflow-hidden border border-white/10 group-hover:scale-105 transition-transform">
                    <img src={c.avatar_url || `https://picsum.photos/seed/${c.username}/40/40`} className="size-full object-cover" />
                  </div>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 size-3 border-2 border-slate-950 rounded-full transition-colors",
                    c.status === 'online' ? "bg-green-500" : "bg-slate-600"
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 flex-row-reverse">
                    <p className={cn("text-sm font-bold truncate", activeContactId === c.id ? "text-primary" : "text-white")}>{c.name}</p>
                    <span className="text-[8px] text-muted-foreground uppercase opacity-50">{c.status === 'online' ? 'Active' : 'Offline'}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate uppercase font-mono tracking-tighter">@{c.username}</p>
                </div>

                {activeContactId !== c.id && Math.random() > 0.8 && (
                  <div className="absolute top-4 left-4">
                    <div className="size-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
