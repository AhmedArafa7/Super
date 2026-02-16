
"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Send, User, MessageSquare, History, ShieldAlert, Cpu, Activity, Edit3, Save, Radio, BellRing, Info, AlertTriangle, Users, Key, Trash2, Plus, Download, FileText, Music, Image as ImageIcon, Video as VideoIcon, CheckCircle2, XCircle, AlertCircle, Clock, GraduationCap, BookOpen, Lock, Globe, Wallet, PlusCircle, MinusCircle, ShieldCheck, Tag } from "lucide-react";
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
import { getStoredMessages, approveMessage, rejectMessage, updateMessageStatus, editMessage, WizardMessage, Attachment } from "@/lib/chat-store";
import { addNotification, Priority } from "@/lib/notification-store";
import { getStoredUsers, addUser, deleteUser, User as AuthUser } from "@/lib/auth-store";
import { getStoredVideos, updateVideoStatus, deleteVideo, Video } from "@/lib/video-store";
import { getSubjects, addSubject, deleteSubject, Subject } from "@/lib/learning-store";
import { getWallet, adjustFunds, Wallet as UserWallet } from "@/lib/wallet-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function AdminPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [wallets, setWallets] = useState<Record<string, UserWallet>>({});
  const [videos, setVideos] = useState<Video[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [walletAmounts, setWalletAmounts] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Broadcast state
  const [broadcast, setBroadcast] = useState({ title: "", body: "", priority: "info" as Priority });

  // User Mgmt state
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "user" as 'user'|'admin', custom_tag: "" });

  // Subject Mgmt state
  const [newSubject, setNewSubject] = useState({ name: "", description: "", allowedUserIds: "" });

  const loadData = async () => {
    const msgs = await getStoredMessages(undefined, true);
    setMessages(msgs);
    const allUsers = await getStoredUsers();
    setUsers(allUsers);
    setVideos(getStoredVideos());
    const subs = await getSubjects();
    setSubjects(subs);

    const walletMap: Record<string, UserWallet> = {};
    for (const u of allUsers) {
      await getWallet(u.id);
      // Wallet state is managed in useWalletStore, but for this admin view we might need local mapping
      // In this specific implementation, we'll fetch them individually for the map
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); 
    const handleAuthUpdate = () => loadData();
    window.addEventListener('auth-update', handleAuthUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('auth-update', handleAuthUpdate);
    };
  }, []);

  const handleRegisterUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.password) return;
    
    setIsRegistering(true);
    try {
      await addUser(newUser);
      setNewUser({ name: "", username: "", password: "", role: "user", custom_tag: "" });
      toast({ title: "User Registered", description: "Node activated and wallet initialized." });
      loadData();
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Registration Failed", 
        description: err.message || "Could not register neural node." 
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAdjustWallet = async (userId: string, type: 'deposit' | 'withdrawal') => {
    const amountStr = walletAmounts[userId];
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Enter a positive numerical value." });
      return;
    }

    const success = await adjustFunds(userId, amount, type);
    if (success) {
      toast({ 
        title: type === 'deposit' ? "Credits Deposited" : "Credits Deducted", 
        description: `Node balance adjusted by ${type === 'deposit' ? '+' : '-'}${amount} credits.` 
      });
      setWalletAmounts(prev => ({ ...prev, [userId]: "" }));
      loadData();
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser(id);
      toast({ title: "Node Deactivated", description: "User and associated data removed from registry." });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Purge Failed", description: err.message });
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
    toast({ title: "Broadcast Transmitted", description: "Global notification sent to all Nexus units." });
  };

  const handleCreateSubject = async () => {
    if (!newSubject.name) return;
    const allowed = newSubject.allowedUserIds ? newSubject.allowedUserIds.split(',').map(s => s.trim()) : null;
    await addSubject({ title: newSubject.name, description: newSubject.description, allowedUserIds: allowed });
    toast({ title: "Subject Registered", description: "Learning pathway activated." });
    setNewSubject({ name: "", description: "", allowedUserIds: "" });
    loadData();
  };

  const pendingVideos = videos.filter(v => v.status === 'pending_review');

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
          <TabsTrigger value="broadcast" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">Broadcast</TabsTrigger>
        </TabsList>

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
                    placeholder="e.g., John Doe" 
                    className="bg-white/5 border-white/10 rounded-xl h-11"
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
                <div className="grid gap-1.5">
                  <Label>Node Role</Label>
                  <Select value={newUser.role} onValueChange={(v: any) => setNewUser({...newUser, role: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="user">Standard Node (User)</SelectItem>
                      <SelectItem value="admin">Nexus Control (Admin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Custom Classification</Label>
                  <Input 
                    placeholder="e.g., Beta Tester, VIP" 
                    className="bg-white/5 border-white/10 rounded-xl h-11"
                    value={newUser.custom_tag}
                    onChange={(e) => setNewUser({...newUser, custom_tag: e.target.value})}
                  />
                </div>
                <Button 
                  onClick={handleRegisterUser}
                  className="w-full mt-4 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg"
                  disabled={!newUser.name || !newUser.username || !newUser.password || isRegistering}
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
                              <p className="font-bold text-white text-base">{u.name}</p>
                              {u.custom_tag && <Badge variant="outline" className="text-[8px] border-indigo-500/30 text-indigo-400 px-1.5 h-4 uppercase">{u.custom_tag}</Badge>}
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] text-muted-foreground uppercase font-mono">@{u.username}</span>
                               <span className="text-[10px] text-indigo-400 font-bold uppercase">{u.role}</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-400 hover:bg-red-500/10 rounded-xl size-9"
                          disabled={u.id === 'admin-id'}
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                        <div className="flex-1 relative">
                          <Input 
                            type="number"
                            placeholder="Amount..."
                            className="bg-transparent border-none h-9 text-sm focus-visible:ring-0 pl-8"
                            value={walletAmounts[u.id] || ""}
                            onChange={(e) => setWalletAmounts({...walletAmounts, [u.id]: e.target.value})}
                          />
                          <Tag className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600/20 text-green-400 hover:bg-green-600/30 h-9 rounded-xl border border-green-600/20 px-4 text-[10px] font-bold"
                            onClick={() => handleAdjustWallet(u.id, 'deposit')}
                          >
                            <PlusCircle className="size-3.5 mr-1.5" /> Deposit
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-red-600/20 text-red-400 hover:bg-red-600/30 h-9 rounded-xl border border-red-600/20 px-4 text-[10px] font-bold"
                            onClick={() => handleAdjustWallet(u.id, 'withdrawal')}
                          >
                            <MinusCircle className="size-3.5 mr-1.5" /> Deduct
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

        <TabsContent value="stream" className="flex-1 outline-none">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
              <div className="flex flex-col gap-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <MessageSquare className="size-5 text-indigo-400" />
                  Neural Requests Queue
                </h3>
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.filter(m => m.status === 'sent').length === 0 ? (
                      <div className="py-20 text-center glass rounded-3xl opacity-50 border-dashed border-2">
                        <CheckCircle2 className="mx-auto mb-3 size-10 text-indigo-400" />
                        <p className="text-sm">Queue Clear. All requests processed.</p>
                      </div>
                    ) : (
                      messages.filter(m => m.status === 'sent').map(m => (
                        <Card key={m.id} className="glass border-white/5 p-6 rounded-3xl">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                <User className="size-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">{m.userName}</p>
                                <p className="text-[9px] text-muted-foreground">{new Date(m.timestamp).toLocaleString()}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[9px] border-indigo-500/30 text-indigo-400">PENDING</Badge>
                          </div>
                          <p className="text-sm text-white/80 mb-6 bg-white/5 p-4 rounded-2xl italic leading-relaxed">"{m.text}"</p>
                          <div className="space-y-4">
                            <Textarea 
                              placeholder="Draft AI response..." 
                              className="bg-white/5 border-white/10 rounded-2xl h-24"
                              value={responses[m.id] || ""}
                              onChange={(e) => setResponses({ ...responses, [m.id]: e.target.value })}
                            />
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => approveMessage(m.id, responses[m.id] || "Request acknowledged and processed.")}
                                className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl h-11"
                              >
                                <Check className="size-4 mr-2" /> Approve
                              </Button>
                              <Button 
                                onClick={() => rejectMessage(m.id)}
                                variant="ghost" 
                                className="flex-1 text-red-400 hover:bg-red-500/10 rounded-xl h-11"
                              >
                                <X className="size-4 mr-2" /> Reject
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex flex-col gap-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <History className="size-5 text-indigo-400" />
                  Processed History
                </h3>
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-3">
                    {messages.filter(m => m.status !== 'sent').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(m => (
                      <div key={m.id} className="p-4 glass border-white/5 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className={cn(
                             "size-2 rounded-full",
                             m.status === 'replied' ? "bg-green-500" : "bg-red-500"
                           )} />
                           <div>
                             <p className="text-xs font-bold text-white truncate w-40">{m.text}</p>
                             <p className="text-[9px] text-muted-foreground">Processed {new Date(m.timestamp).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8"><Edit3 className="size-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl">
                            <DialogHeader>
                              <DialogTitle>Audit Transmission</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Original Request</p>
                                <p className="text-sm italic">"{m.text}"</p>
                              </div>
                              <div className="space-y-2">
                                <Label>Current Response</Label>
                                <Textarea 
                                  className="bg-white/5 border-white/10" 
                                  defaultValue={m.response || ""}
                                  onChange={(e) => setResponses({...responses, [m.id]: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Correction Reason</Label>
                                <Input className="bg-white/5 border-white/10" placeholder="e.g., Fact check update" id={`reason-${m.id}`} />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                onClick={() => {
                                  const reason = (document.getElementById(`reason-${m.id}`) as HTMLInputElement)?.value || "Administrative adjustment";
                                  editMessage(m.id, responses[m.id] || m.response || "", reason);
                                  toast({ title: "Transmission Updated", description: "Node informed of correction." });
                                }}
                                className="w-full bg-indigo-600 h-11 rounded-xl"
                              >
                                <Save className="size-4 mr-2" /> Save & Notify Node
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="content" className="flex-1 outline-none">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="flex flex-col gap-6 overflow-hidden">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Clock className="size-5 text-amber-400" />
                Moderation Queue ({pendingVideos.length})
              </h3>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {pendingVideos.map(video => (
                    <Card key={video.id} className="glass border-white/5 overflow-hidden rounded-3xl flex">
                      <div className="w-40 relative aspect-video shrink-0">
                        <img src={video.thumbnail} className="size-full object-cover" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-sm line-clamp-1">{video.title}</p>
                          <p className="text-[10px] text-muted-foreground">Uploader: {video.author}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateVideoStatus(video.id, 'published')} className="bg-green-600 h-8 text-[10px]">Approve</Button>
                          <Dialog>
                            <DialogTrigger asChild>
                               <Button size="sm" variant="ghost" className="h-8 text-[10px] text-red-400">Reject</Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-white/10">
                              <DialogHeader><DialogTitle>Reject Submission</DialogTitle></DialogHeader>
                              <div className="py-4 space-y-2">
                                <Label>Feedback for User</Label>
                                <Textarea className="bg-white/5" id={`feedback-${video.id}`} placeholder="Explain why..." />
                              </div>
                              <DialogFooter>
                                <Button variant="destructive" onClick={() => {
                                  const feedback = (document.getElementById(`feedback-${video.id}`) as HTMLTextAreaElement).value;
                                  updateVideoStatus(video.id, 'rejected', feedback);
                                }}>Confirm Rejection</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            <div className="flex flex-col gap-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Cpu className="size-5 text-indigo-400" />
                LMS Mastery Inventory
              </h3>
              <div className="flex gap-2">
                 <Input 
                   placeholder="New Subject Name..." 
                   className="bg-white/5 border-white/10"
                   value={newSubject.name}
                   onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                 />
                 <Button onClick={handleCreateSubject} className="bg-indigo-600"><Plus className="size-4" /></Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {subjects.map(s => (
                    <div key={s.id} className="p-4 glass border-white/5 rounded-2xl flex items-center justify-between">
                      <p className="text-sm font-bold">{s.title}</p>
                      <Button variant="ghost" size="icon" onClick={() => deleteSubject(s.id)} className="text-red-400"><Trash2 className="size-4" /></Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
           </div>
        </TabsContent>

        <TabsContent value="broadcast" className="flex-1 outline-none">
          <div className="max-w-2xl mx-auto py-10">
            <Card className="glass border-white/10 rounded-[2.5rem] p-10">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="size-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 mb-6">
                  <BellRing className="size-8 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Global Neural Broadcast</h3>
                <p className="text-muted-foreground text-sm mt-2">Transmit priority notifications to all active nodes.</p>
              </div>
              
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label>Broadcast Title</Label>
                  <Input 
                    placeholder="Urgent System Update" 
                    className="bg-white/5 border-white/10 rounded-xl h-12"
                    value={broadcast.title}
                    onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Message Body</Label>
                  <Textarea 
                    placeholder="Explain the update in detail..." 
                    className="bg-white/5 border-white/10 rounded-2xl h-32"
                    value={broadcast.body}
                    onChange={(e) => setBroadcast({ ...broadcast, body: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Priority Level</Label>
                  <Select value={broadcast.priority} onValueChange={(v: any) => setBroadcast({...broadcast, priority: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="info">Info (Blue)</SelectItem>
                      <SelectItem value="warning">Warning (Amber)</SelectItem>
                      <SelectItem value="critical">Critical (Red)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleSendBroadcast}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold shadow-lg shadow-indigo-500/20"
                >
                  <Send className="size-5 mr-2" /> Initiate Global Sync
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
