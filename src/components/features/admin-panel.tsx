
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Check, X, Send, User, MessageSquare, History, ShieldAlert, Cpu, Activity, Edit3, Save, Radio, BellRing, Info, AlertTriangle, Users, Key, Trash2, Plus, Download, FileText, Music, ImageIcon, Video as VideoIcon, CheckCircle2, XCircle, AlertCircle, Clock, GraduationCap, BookOpen, Lock, Globe, Wallet, PlusCircle, MinusCircle, ShieldCheck, Tag, Zap, Server, Sparkles, Loader2, ExternalLink, Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStoredMessages, approveMessage, rejectMessage, editMessage, WizardMessage, Attachment } from "@/lib/chat-store";
import { addNotification, Priority } from "@/lib/notification-store";
import { getStoredUsers, addUser, deleteUser, User as AuthUser } from "@/lib/auth-store";
import { getStoredVideos, updateVideoStatus, deleteVideo, Video } from "@/lib/video-store";
import { getSubjects, addSubject, deleteSubject, Subject } from "@/lib/learning-store";
import { adjustFunds, Wallet as UserWallet } from "@/lib/wallet-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export function AdminPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [optimizedEdits, setOptimizedEdits] = useState<Record<string, string>>({});
  const [walletAmounts, setWalletAmounts] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [broadcast, setBroadcast] = useState({ title: "", body: "", priority: "info" as Priority });
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "user" as 'user'|'admin', custom_tag: "" });

  const loadData = async () => {
    try {
      const msgs = await getStoredMessages(undefined, true);
      setMessages(Array.isArray(msgs) ? msgs : []);
      
      const allUsers = await getStoredUsers();
      setUsers(Array.isArray(allUsers) ? allUsers : []);
      
      const allVideos = await getStoredVideos();
      setVideos(Array.isArray(allVideos) ? allVideos : []);
      
      const subs = await getSubjects();
      setSubjects(Array.isArray(subs) ? subs : []);
    } catch (err) {
      console.error("Admin Load Error:", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSendBroadcast = () => {
    if (!broadcast.title.trim() || !broadcast.body.trim()) return;
    addNotification({
      type: 'system_broadcast',
      title: broadcast.title,
      message: broadcast.body,
      priority: broadcast.priority
    });
    setBroadcast({ title: "", body: "", priority: "info" });
    toast({ title: "Broadcast Transmitted" });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-8 flex justify-between items-center">
        <div className="text-right">
          <h2 className="text-3xl font-headline font-bold text-white flex items-center gap-3 justify-end">
            Neural Admin Console
            <ShieldAlert className="text-indigo-400" />
          </h2>
        </div>
      </div>

      <Tabs defaultValue="stream" className="flex-1 flex flex-col">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 w-fit flex-row-reverse">
          <TabsTrigger value="stream" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">Chat Flow</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">Registry</TabsTrigger>
          <TabsTrigger value="infra" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">Infrastructure</TabsTrigger>
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
                  {messages.filter(m => m.status === 'sent').map((m) => (
                    <div key={m.id} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] space-y-6 group">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <div className="flex items-center gap-3 flex-row-reverse">
                          <div className="size-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                            {m.userName.charAt(0)}
                          </div>
                          <p className="font-bold text-sm text-white">@{m.userName}</p>
                        </div>
                        <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                          {m.isAutoMode ? 'AUTO ROUTING' : 'MANUAL MODE'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Original Input</p>
                          <p className="text-sm italic">"{m.originalText}"</p>
                        </div>
                        <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 relative">
                          <p className="text-[10px] text-indigo-400 uppercase font-bold mb-2">AI Optimized Prompt</p>
                          <Textarea 
                            value={optimizedEdits[m.id] || m.optimizedText || ""} 
                            onChange={(e) => setOptimizedEdits({...optimizedEdits, [m.id]: e.target.value})}
                            className="bg-transparent border-none text-xs min-h-[60px] p-0 text-right focus-visible:ring-0"
                          />
                          <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-indigo-400">
                            <ArrowRight className="size-4" />
                          </div>
                        </div>
                        <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/20">
                          <p className="text-[10px] text-green-400 uppercase font-bold mb-2">Routed Engine</p>
                          <Badge variant="outline" className="border-green-500/30 text-green-400 uppercase text-[10px]">
                            {m.selectedModel}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <Label className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block">Final Response Draft</Label>
                        <Textarea 
                          dir="auto"
                          placeholder="Refine response before transmission..." 
                          className="bg-white/5 border-white/10 rounded-xl text-sm min-h-[100px] text-right"
                          value={responses[m.id] || m.response || ""}
                          onChange={(e) => setResponses({...responses, [m.id]: e.target.value})}
                        />
                        <div className="flex gap-2 flex-row-reverse">
                          <Button 
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl h-11 font-bold"
                            onClick={async () => {
                              await approveMessage(m.id, m.userId, responses[m.id] || m.response || "");
                              toast({ title: "Response Transmitted" });
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

        <TabsContent value="users" className="flex-1">
           {/* UI Users code remains similar, focuses on management */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
