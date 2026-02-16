
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Check, X, Send, User, MessageSquare, History, ShieldAlert, Cpu, Activity, Edit3, Save, Radio, BellRing, Info, AlertTriangle, Users, Key, Trash2, Plus, Download, FileText, Music, Image as ImageIcon, Video as VideoIcon, CheckCircle2, XCircle, AlertCircle, Clock, GraduationCap, BookOpen, Lock, Globe, Wallet, PlusCircle, MinusCircle, ShieldCheck, Tag, Zap, Server, Sparkles } from "lucide-react";
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

export function AdminPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [walletAmounts, setWalletAmounts] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [broadcast, setBroadcast] = useState({ title: "", body: "", priority: "info" as Priority });
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "user" as 'user'|'admin', custom_tag: "" });
  const [newSubject, setNewSubject] = useState({ name: "", description: "", allowedUserIds: "" });

  const loadData = async () => {
    try {
      const msgs = await getStoredMessages(undefined, true);
      setMessages(msgs);
      
      const newResponses: Record<string, string> = { ...responses };
      msgs.forEach(m => {
        if (m.status === 'sent' && m.response && !newResponses[m.id]) {
          newResponses[m.id] = m.response;
        }
      });
      setResponses(newResponses);

      const allUsers = await getStoredUsers();
      setUsers(allUsers);
      const allVideos = await getStoredVideos();
      setVideos(allVideos);
      const subs = await getSubjects();
      setSubjects(subs);
    } catch (err) {
      console.error("Admin Load Error:", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const engineCounts: Record<string, number> = {};
    messages.forEach(m => {
      if (m.engine) {
        engineCounts[m.engine] = (engineCounts[m.engine] || 0) + 1;
      }
    });
    return engineCounts;
  }, [messages]);

  const handleRegisterUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.password) return;
    setIsRegistering(true);
    try {
      await addUser({ 
        username: newUser.username, 
        name: newUser.name, 
        role: newUser.role, 
        customTag: newUser.custom_tag 
      });
      setNewUser({ name: "", username: "", password: "", role: "user", custom_tag: "" });
      toast({ title: "Node Activated", description: "User registered in the neural registry." });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: err.message });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAdjustWallet = async (userId: string, type: 'deposit' | 'withdrawal') => {
    const amount = parseFloat(walletAmounts[userId]);
    if (isNaN(amount) || amount <= 0) return;
    const success = await adjustFunds(userId, amount, type);
    if (success) {
      toast({ title: "Wallet Adjusted", description: `Balance updated for user node.` });
      setWalletAmounts(prev => ({ ...prev, [userId]: "" }));
      loadData();
    }
  };

  const handleSendBroadcast = () => {
    if (!broadcast.title.trim() || !broadcast.body.trim()) return;
    addNotification({
      type: 'system_broadcast',
      title: broadcast.title,
      message: broadcast.body,
      priority: broadcast.priority
    });
    setBroadcast({ title: "", body: "", priority: "info" });
    toast({ title: "Broadcast Transmitted", description: "Global alert sent to all nodes." });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-indigo-400" />
            Neural Console
          </h2>
          <p className="text-muted-foreground mt-1">Global administration and neural synchronization controls.</p>
        </div>
      </div>

      <Tabs defaultValue="stream" className="flex-1 flex flex-col">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 w-fit overflow-x-auto">
          <TabsTrigger value="stream" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">Chat Stream</TabsTrigger>
          <TabsTrigger value="content" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">Content CMS</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">Users & Wallets</TabsTrigger>
          <TabsTrigger value="infra" className="rounded-xl px-6 data-[state=active]:bg-indigo-600 flex items-center gap-2">
            <Server className="size-3" /> Infrastructure
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">Broadcast</TabsTrigger>
        </TabsList>

        <TabsContent value="infra" className="flex-1 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="glass border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 size-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16" />
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Cpu className="size-5 text-indigo-400" />
                Neural Engine Status
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="size-4 text-amber-400" />
                    <span className="text-sm font-medium">Groq Llama 3.3</span>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">ONLINE</Badge>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="size-4 text-blue-400" />
                    <span className="text-sm font-medium">Google Gemini 1.5</span>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">ONLINE</Badge>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-2 glass border-white/10 rounded-[2.5rem] p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Activity className="size-5 text-indigo-400" />
                Consumption Metrics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Object.entries(stats).length === 0 ? (
                  <div className="col-span-2 py-12 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-50">
                    <History className="size-10 mx-auto mb-4" />
                    <p className="text-sm">No historical processing data found.</p>
                  </div>
                ) : (
                  Object.entries(stats).map(([engine, count]) => (
                    <div key={engine} className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{engine}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white">{count}</span>
                        <span className="text-xs text-indigo-400 font-bold">Processed Packets</span>
                      </div>
                      <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-1000" 
                          style={{ width: `${Math.min((count / messages.length) * 100, 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="flex-1 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <Card className="glass border-white/10 rounded-[2.5rem] p-8 h-fit">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Plus className="size-5 text-indigo-400" />
                Register Neural ID
              </h3>
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label>Full Name</Label>
                  <Input 
                    dir="auto"
                    placeholder="e.g., John Doe" 
                    className="bg-white/5 border-white/10 rounded-xl h-11 text-right"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Username</Label>
                  <Input 
                    placeholder="e.g., jdoe_nexus" 
                    className="bg-white/5 border-white/10 rounded-xl h-11"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Security Code</Label>
                  <Input 
                    type="password"
                    placeholder="••••••••" 
                    className="bg-white/5 border-white/10 rounded-xl h-11"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <Button 
                  onClick={handleRegisterUser}
                  className="w-full mt-4 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg"
                  disabled={!newUser.name || !newUser.username || isRegistering}
                >
                  {isRegistering ? "Synchronizing..." : "Confirm Registration"}
                </Button>
              </div>
            </Card>

            <Card className="lg:col-span-2 glass border-white/10 rounded-[2.5rem] p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Users className="size-5 text-indigo-400" />
                Active Neural Registry
              </h3>
              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-4">
                  {users.map((u) => (
                    <div key={u.id} className="flex flex-col p-5 glass border-white/5 rounded-3xl group gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="size-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                            {u.role === 'admin' ? <ShieldCheck className="size-6 text-indigo-400" /> : <User className="size-6 text-indigo-400" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p dir="auto" className="font-bold text-white text-base text-right">{u.name}</p>
                              {u.customTag && <Badge variant="outline" className="text-[8px] border-indigo-500/30 text-indigo-400 px-1.5 h-4 uppercase">{u.customTag}</Badge>}
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase font-mono">@{u.username} • {u.role}</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-400 hover:bg-red-500/10 rounded-xl"
                          onClick={() => deleteUser(u.id)}
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                        <Input 
                          type="number"
                          placeholder="Amount..."
                          className="bg-transparent border-none h-9 text-sm"
                          value={walletAmounts[u.id] || ""}
                          onChange={(e) => setWalletAmounts({...walletAmounts, [u.id]: e.target.value})}
                        />
                        <Button 
                          size="sm" 
                          className="bg-green-600/20 text-green-400 hover:bg-green-600/30 h-9 rounded-xl px-4 text-[10px] font-bold"
                          onClick={() => handleAdjustWallet(u.id, 'deposit')}
                        >
                          Deposit
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-red-600/20 text-red-400 hover:bg-red-600/30 h-9 rounded-xl px-4 text-[10px] font-bold"
                          onClick={() => handleAdjustWallet(u.id, 'withdrawal')}
                        >
                          Deduct
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stream" className="flex-1 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <Card className="glass border-white/10 rounded-[2.5rem] p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <MessageSquare className="size-5 text-indigo-400" />
                Pending Authorization
              </h3>
              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                  {messages.filter(m => m.status === 'sent').map((m) => (
                    <div key={m.id} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] space-y-4 group">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-bold text-xs border border-indigo-500/20">
                            {m.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">@{m.userName}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(m.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        {m.response ? (
                          <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 flex items-center gap-1.5">
                            <Sparkles className="size-3" /> AI DRAFT READY
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[8px] h-4 border-white/10 opacity-50">AWAITING AI</Badge>
                        )}
                      </div>
                      <p dir="auto" className="text-sm text-slate-300 italic text-right">"{m.text}"</p>
                      
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest px-1">Neural Response Draft</Label>
                        <Textarea 
                          dir="auto"
                          placeholder="Compose or refine neural response..." 
                          className="bg-white/5 border-white/10 rounded-xl text-sm min-h-[100px] focus-visible:ring-indigo-500 text-right"
                          value={responses[m.id] || ""}
                          onChange={(e) => setResponses({...responses, [m.id]: e.target.value})}
                        />
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl h-11 font-bold shadow-lg shadow-indigo-600/20"
                            onClick={async () => {
                              await approveMessage(m.id, m.userId, responses[m.id] || "");
                              toast({ title: "Response Transmitted", description: "Neural packet sent to user node." });
                              loadData();
                            }}
                          >
                            <Send className="size-4 mr-2" /> Transmit to User
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

            <Card className="glass border-white/10 rounded-[2.5rem] p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <History className="size-5 text-indigo-400" />
                Transmission Archive
              </h3>
              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-4">
                  {messages.filter(m => m.status === 'replied' || m.status === 'rejected').map((m) => (
                    <div key={m.id} className="p-5 border border-white/5 rounded-3xl group transition-all hover:bg-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <p className="font-bold text-xs text-indigo-400">@{m.userName}</p>
                        <Badge variant="outline" className={cn(
                          "text-[8px] h-4",
                          m.status === 'replied' ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"
                        )}>
                          {m.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p dir="auto" className="text-xs text-slate-400 line-clamp-1 mb-2 text-right">Q: {m.text}</p>
                      {m.response && <p dir="auto" className="text-xs text-white line-clamp-2 italic text-right">A: {m.response}</p>}
                      {m.engine && <Badge variant="outline" className="text-[7px] mt-2 border-indigo-500/20 text-indigo-400/50">{m.engine}</Badge>}
                      
                      <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 text-[10px] rounded-lg">Adjust Response</Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl">
                            <DialogHeader>
                              <DialogTitle>Neural Correction</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <Textarea dir="auto" id={`edit-${m.id}`} defaultValue={m.response || ""} className="bg-white/5 min-h-[150px] text-right" />
                              <Input dir="auto" id={`reason-${m.id}`} placeholder="Correction reason..." className="bg-white/5 text-right" />
                            </div>
                            <DialogFooter>
                              <Button className="w-full bg-indigo-600" onClick={async () => {
                                const text = (document.getElementById(`edit-${m.id}`) as HTMLTextAreaElement).value;
                                const reason = (document.getElementById(`reason-${m.id}`) as HTMLInputElement).value;
                                await editMessage(m.id, m.userId, text, reason);
                                toast({ title: "Archive Updated" });
                                loadData();
                              }}>Save Correction</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="flex-1 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <Card className="glass border-white/10 rounded-[2.5rem] p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <VideoIcon className="size-5 text-indigo-400" />
                Stream Review Queue
              </h3>
              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                  {videos.filter(v => v.status === 'pending_review').map((v) => (
                    <div key={v.id} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] space-y-4">
                      <div className="flex gap-4">
                        <img src={v.thumbnail} className="size-20 rounded-xl object-cover" />
                        <div className="flex-1">
                          <h4 dir="auto" className="font-bold text-white text-sm text-right">{v.title}</h4>
                          <p dir="auto" className="text-xs text-muted-foreground text-right">Author: {v.author}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-green-600" onClick={() => updateVideoStatus(v.id, 'published')}>Publish</Button>
                        <Button variant="ghost" className="text-red-400" onClick={() => updateVideoStatus(v.id, 'rejected')}>Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            <Card className="glass border-white/10 rounded-[2.5rem] p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <GraduationCap className="size-5 text-indigo-400" />
                Learning Path Mgmt
              </h3>
              <div className="space-y-6">
                <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl space-y-3">
                  <Input dir="auto" placeholder="Subject Title..." className="bg-white/5 text-right" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} />
                  <Button className="w-full bg-indigo-600" onClick={async () => {
                    await addSubject({ title: newSubject.name, description: newSubject.description, allowedUserIds: null });
                    toast({ title: "Subject Registered" });
                    setNewSubject({ name: "", description: "", allowedUserIds: "" });
                    loadData();
                  }}>Authorize Subject</Button>
                </div>
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-4">
                    {subjects.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <span dir="auto" className="font-bold text-sm text-right flex-1">{s.title}</span>
                        <Button variant="ghost" size="icon" onClick={async () => { await deleteSubject(s.id); loadData(); }}>
                          <Trash2 className="size-4 text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="broadcast" className="flex-1 outline-none">
          <Card className="glass border-white/10 rounded-[2.5rem] p-12 max-w-2xl mx-auto text-center">
            <Radio className="size-12 text-indigo-400 mx-auto mb-6 animate-pulse" />
            <h3 className="text-3xl font-bold text-white mb-8">Global Broadcast</h3>
            <div className="space-y-4 text-left">
              <div className="grid gap-2">
                <Label>Header</Label>
                <Input dir="auto" className="bg-white/5 h-12 text-right" value={broadcast.title} onChange={e => setBroadcast({...broadcast, title: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Content</Label>
                <Textarea dir="auto" className="bg-white/5 min-h-[150px] text-right" value={broadcast.body} onChange={e => setBroadcast({...broadcast, body: e.target.value})} />
              </div>
              <Button className="w-full bg-indigo-600 h-14 font-bold" onClick={handleSendBroadcast}>Initiate Broadcast</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
