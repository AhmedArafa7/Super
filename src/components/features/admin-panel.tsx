
"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, ShieldAlert, Badge, Send, ArrowRight, User as UserIcon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { getStoredMessages, approveMessage, rejectMessage, WizardMessage } from "@/lib/chat-store";
import { getStoredUsers, User } from "@/lib/auth-store";
import { useToast } from "@/hooks/use-toast";

export function AdminPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [optimizedEdits, setOptimizedEdits] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [msgs, allUsers] = await Promise.all([
        getStoredMessages(undefined, true),
        getStoredUsers()
      ]);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setUsers(Array.isArray(allUsers) ? allUsers : []);
    } catch (err) {
      console.error("Admin Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-8 flex justify-between items-center">
        <div className="text-right">
          <h2 className="text-3xl font-headline font-bold text-white flex items-center gap-3 justify-end">
            Neural Admin Console
            <ShieldAlert className="text-indigo-400" />
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={loadData} disabled={isLoading} className="rounded-xl border border-white/5">
          <RefreshCcw className={cn("size-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="stream" className="flex-1 flex flex-col">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 w-fit flex-row-reverse">
          <TabsTrigger value="stream" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">Chat Flow</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">Registry</TabsTrigger>
        </TabsList>

        <TabsContent value="stream" className="flex-1 outline-none">
          <div className="grid grid-cols-1 gap-8 h-full">
            <Card className="glass border-white/10 rounded-[2.5rem] p-8 flex flex-col text-right">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 justify-end">
                Neural Message Pipeline
                <MessageSquare className="size-5 text-indigo-400" />
              </h3>
              <ScrollArea className="flex-1">
                <div className="space-y-6 pr-4">
                  {messages.map((m) => (
                    <div key={m.id} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] space-y-6 group">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <div className="flex items-center gap-3 flex-row-reverse">
                          <div className="size-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                            {m.userName.charAt(0)}
                          </div>
                          <p className="font-bold text-sm text-white">@{m.userName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                            {m.isAutoMode ? 'AUTO ROUTING' : 'MANUAL MODE'}
                          </Badge>
                          <Badge variant="outline" className={cn(
                            "text-[10px]",
                            m.status === 'replied' ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
                          )}>
                            {m.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Original Input</p>
                          <p className="text-sm italic">"{m.originalText}"</p>
                        </div>
                        <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 relative">
                          <p className="text-[10px] text-indigo-400 uppercase font-bold mb-2">AI Optimized Prompt</p>
                          <Textarea 
                            dir="auto"
                            value={optimizedEdits[m.id] !== undefined ? optimizedEdits[m.id] : (m.optimizedText || "")} 
                            onChange={(e) => setOptimizedEdits({...optimizedEdits, [m.id]: e.target.value})}
                            className="bg-transparent border-none text-xs min-h-[60px] p-0 text-right focus-visible:ring-0"
                          />
                        </div>
                        <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/20">
                          <p className="text-[10px] text-green-400 uppercase font-bold mb-2">Routed Engine</p>
                          <p className="text-[10px] font-mono text-green-400 uppercase truncate">
                            {m.selectedModel || m.engine || 'System'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <Label className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block">Response Quality Check</Label>
                        <Textarea 
                          dir="auto"
                          placeholder="Refine response before transmission..." 
                          className="bg-white/5 border-white/10 rounded-xl text-sm min-h-[100px] text-right"
                          value={responses[m.id] !== undefined ? responses[m.id] : (m.response || "")}
                          onChange={(e) => setResponses({...responses, [m.id]: e.target.value})}
                        />
                        <div className="flex gap-2 flex-row-reverse">
                          <Button 
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl h-11 font-bold"
                            onClick={async () => {
                              await approveMessage(
                                m.id, 
                                m.userId, 
                                responses[m.id] !== undefined ? responses[m.id] : (m.response || ""),
                                optimizedEdits[m.id] !== undefined ? optimizedEdits[m.id] : m.optimizedText
                              );
                              toast({ title: "Quality Verified", description: "Node memory updated." });
                              loadData();
                            }}
                          >
                            <Send className="size-4 mr-2" /> Approve & Transmit
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="text-red-400 hover:bg-red-500/10 rounded-xl h-11"
                            onClick={async () => {
                              await rejectMessage(m.id, m.userId);
                              loadData();
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="flex-1 outline-none">
          <Card className="glass border-white/10 rounded-[2.5rem] p-8 h-full flex flex-col text-right">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 justify-end">
              Nexus User Registry
              <UserIcon className="size-5 text-indigo-400" />
            </h3>
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                {users.map((u) => (
                  <div key={u.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between flex-row-reverse">
                    <div className="flex items-center gap-4 flex-row-reverse">
                      <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-xl font-bold text-indigo-400">
                        {u.name.charAt(0)}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize border-indigo-500/20 text-indigo-400">{u.role}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
