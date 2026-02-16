
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
           {/* Previous tab content... */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
