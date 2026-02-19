
"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, ShieldAlert, Send, RefreshCcw, CheckCircle2, 
  Video, Users, MessageCircle, Zap, XCircle, BookOpen, Trash2, 
  Database, Wallet, Radio, Tag, CreditCard, Play, Plus, UserPlus, 
  Shield, DollarSign, Clock, ArrowUpRight, AlertTriangle, Lock, Unlock,
  FileVideo, Repeat, UserCog, BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getStoredMessages, approveMessage, rejectMessage, WizardMessage } from "@/lib/chat-store";
import { getStoredUsers, User, addUser, UserRole, UserClassification, updateUserProfile } from "@/lib/auth-store";
import { getStoredVideos, updateVideoStatus, Video as VideoType } from "@/lib/video-store";
import { getSubjects, deleteSubject, Subject } from "@/lib/learning-store";
import { getAllOffersAdmin, MarketOffer } from "@/lib/market-store";
import { getAllTransactionsAdmin, Transaction, adjustFunds } from "@/lib/wallet-store";
import { addNotification } from "@/lib/notification-store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

export function AdminPanel() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [offers, setOffers] = useState<MarketOffer[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // User Management State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', role: 'user' as UserRole });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Responses State
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [optimizedEdits, setOptimizedEdits] = useState<Record<string, string>>({});
  const [videoFeedback, setVideoFeedback] = useState<Record<string, string>>({});

  // Credit/Responses Injection
  const [creditTarget, setCreditTarget] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [isAddingCredits, setIsAddingCredits] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [msgs, allUsers, allVideos, allSubjects, allOffers, allTxs] = await Promise.all([
        getStoredMessages(undefined, true),
        getStoredUsers(),
        getStoredVideos(),
        getSubjects(undefined, true), 
        getAllOffersAdmin(),
        getAllTransactionsAdmin()
      ]);
      setMessages(msgs || []);
      setUsers(allUsers || []);
      setVideos(allVideos || []);
      setSubjects(allSubjects || []);
      setOffers(allOffers || []);
      setAllTransactions(allTxs || []);
    } catch (err) {
      console.error("Admin Load Error:", err);
      toast({ variant: "destructive", title: "Sync Failure", description: "Could not reach the neural backbone." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.username) return;
    setIsCreatingUser(true);
    try {
      await addUser({
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        classification: 'none',
        proResponsesRemaining: 0,
        avatarUrl: `https://picsum.photos/seed/${newUser.username}/100/100`,
        canManageCredits: false
      });
      toast({ title: "Node Registered", description: `User ${newUser.name} is now part of the ecosystem.` });
      setNewUser({ name: '', username: '', role: 'user' });
      setIsAddUserOpen(false);
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Registration Failed", description: "Could not register node in Firestore." });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: UserRole) => {
    try {
      await updateUserProfile(userId, { role });
      toast({ title: "Role Re-calibrated", description: "Node authorization levels updated." });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not sync role change." });
    }
  };

  const handleUpdateClassification = async (userId: string, classification: UserClassification) => {
    try {
      await updateUserProfile(userId, { classification });
      toast({ title: "Classification Updated", description: "User neural tier has been modified." });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not sync classification." });
    }
  };

  const handleUpdateProResponses = async (userId: string, amount: string) => {
    const num = parseInt(amount);
    if (isNaN(num)) return;
    try {
      await updateUserProfile(userId, { proResponsesRemaining: num });
      toast({ title: "Neural Sync", description: "Pro responses allocated successfully." });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: "Sync failure." });
    }
  };

  const handleAddCredits = async () => {
    if (!creditTarget || !creditAmount || isNaN(Number(creditAmount))) return;
    setIsAddingCredits(true);
    try {
      const success = await adjustFunds(creditTarget.id, Number(creditAmount), 'deposit');
      if (success) {
        toast({ title: "Credits Injected", description: `Successfully added ${creditAmount} credits to @${creditTarget.username}` });
        setCreditTarget(null);
        setCreditAmount("");
        loadData();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Injection Failed", description: "Credit node rejected the request." });
    } finally {
      setIsAddingCredits(false);
    }
  };

  const renderEmptyState = (icon: React.ElementType, title: string) => (
    <div className="flex flex-col items-center justify-center py-32 opacity-40 border-2 border-dashed border-white/5 rounded-[3rem] text-center w-full">
      {React.createElement(icon, { className: "size-16 mb-4" })}
      <p className="text-xl font-bold">{title}</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen gap-10 animate-in fade-in duration-700 font-sans">
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h2 className="text-5xl font-headline font-bold text-white flex items-center gap-4 justify-end">
            Admin Neural Console
            <ShieldAlert className="text-indigo-400 size-12" />
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">نظام الرقابة والتحكم المركزي - إدارة الرتب والتصنيفات السيادية.</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading} className="size-14 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all shadow-xl">
          <RefreshCcw className={cn("size-6 text-indigo-400", isLoading && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="users" className="flex-1 flex flex-col">
        <TabsList className="bg-white/5 border border-white/10 rounded-[1.5rem] p-1.5 mb-10 w-fit flex-wrap flex-row-reverse self-end h-auto gap-1.5">
          <TabsTrigger value="users" className="rounded-xl px-6 py-3 font-bold gap-3 flex-row-reverse data-[state=active]:bg-indigo-600"><Users className="size-4" /> العقد البشرية</TabsTrigger>
          <TabsTrigger value="chat" className="rounded-xl px-6 py-3 font-bold gap-3 flex-row-reverse data-[state=active]:bg-indigo-600"><MessageSquare className="size-4" /> مراجعة الدردشة</TabsTrigger>
          <TabsTrigger value="media" className="rounded-xl px-6 py-3 font-bold gap-3 flex-row-reverse data-[state=active]:bg-indigo-600"><Video className="size-4" /> الرقابة البصرية</TabsTrigger>
          <TabsTrigger value="finances" className="rounded-xl px-6 py-3 font-bold gap-3 flex-row-reverse data-[state=active]:bg-indigo-600"><Wallet className="size-4" /> السجل المالي</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="flex-1 outline-none space-y-8">
          <div className="flex justify-between items-center flex-row-reverse">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3 flex-row-reverse"><Users className="text-indigo-400" /> سجل العقد البشرية والتحكم في الهوية</h3>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-6 font-bold h-12 shadow-xl shadow-indigo-600/20">
                  <UserPlus className="mr-2 size-5" /> تسجيل عقدة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 rounded-[2rem] p-8 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-right">إضافة مستخدم جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-6 text-right">
                  <Input dir="auto" className="bg-white/5 border-white/10 h-12 rounded-xl text-right" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="الاسم الكامل..." />
                  <Input dir="auto" className="bg-white/5 border-white/10 h-12 rounded-xl text-right" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="معرف الدخول..." />
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateUser} disabled={isCreatingUser || !newUser.username} className="w-full bg-indigo-600 h-14 rounded-xl font-bold text-lg">تفعيل العقدة</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((u) => (
              <Card key={u.id} className="p-8 glass border-white/5 rounded-[2.5rem] flex flex-col gap-6 group hover:border-indigo-500/30 transition-all shadow-xl">
                <div className="flex items-center justify-between flex-row-reverse">
                  <div className="flex items-center gap-5 flex-row-reverse text-right">
                    <div className="size-16 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-2xl font-black text-indigo-400 border border-indigo-500/10 shadow-inner group-hover:scale-110 transition-transform">
                      {(u.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-xl text-white">{u.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">@{u.username}</p>
                    </div>
                  </div>
                  {currentUser?.canManageCredits && (
                    <Button variant="ghost" size="icon" className="size-10 bg-emerald-500/10 rounded-full text-emerald-400" onClick={() => setCreditTarget(u)}>
                      <Plus className="size-5" />
                    </Button>
                  )}
                </div>
                
                <div className="pt-4 border-t border-white/5 space-y-6 text-right">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">تصنيف الوصول (Classification)</Label>
                    <Select defaultValue={u.classification || 'none'} onValueChange={(v: UserClassification) => handleUpdateClassification(u.id, v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl flex-row-reverse"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10 text-white">
                        <SelectItem value="none">بدون تصنيف</SelectItem>
                        <SelectItem value="freelancer">موظف حر (NexusAI)</SelectItem>
                        <SelectItem value="investor">مستثمر (+1 Pro)</SelectItem>
                        <SelectItem value="manager">إداري (+3 Pro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(u.classification === 'investor' || u.classification === 'manager') && (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">رصيد ردود Pro المتبقي</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="number" 
                          className="bg-white/5 border-white/10 h-11 text-center font-bold" 
                          defaultValue={u.proResponsesRemaining || 0}
                          onBlur={(e) => handleUpdateProResponses(u.id, e.target.value)}
                        />
                        <div className="size-11 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                          <BrainCircuit className="size-5" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-row-reverse pt-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">صلاحية النخاع</Label>
                    <Select defaultValue={u.role} onValueChange={(v: UserRole) => handleUpdateUserRole(u.id, v)}>
                      <SelectTrigger className="h-9 w-32 bg-white/5 border-white/10 text-[10px] font-bold rounded-xl flex-row-reverse"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10 text-white">
                        <SelectItem value="user">User Node</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">System Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 outline-none space-y-8">
          {messages.length === 0 ? renderEmptyState(MessageSquare, "لا توجد رسائل للمراجعة.") : (
            messages.map((m) => (
              <Card key={m.id} className="glass border-white/10 rounded-[3rem] p-10 space-y-8 relative overflow-hidden">
                <div className="flex justify-between items-center flex-row-reverse">
                  <div className="flex items-center gap-5 flex-row-reverse text-right">
                    <div className="size-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-xl border border-indigo-500/20">{(m.userName || "?").charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="font-bold text-xl text-white">@{m.userName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{new Date(m.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-6 px-4 uppercase font-bold tracking-widest text-green-400 border-green-500/20 bg-green-500/5">{m.status}</Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4 text-right">
                    <Label className="text-xs uppercase font-bold text-muted-foreground tracking-[0.2em] px-2">الرسالة الأصلية</Label>
                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                      <p className="text-sm text-slate-300 italic leading-relaxed">"{m.originalText}"</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-right">
                    <Label className="text-xs uppercase font-bold text-indigo-400 tracking-[0.2em] px-2">الرد العصبى (QA)</Label>
                    <Textarea dir="auto" value={responses[m.id] ?? m.response || ""} onChange={(e) => setResponses({...responses, [m.id]: e.target.value})} className="bg-white/5 border-white/10 rounded-3xl text-sm min-h-[150px] text-right p-6 focus-visible:ring-indigo-500 shadow-inner" placeholder="جاري انتظار الرد أو كتابة رد مخصص..." />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/5 flex-row-reverse">
                  <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-14 font-bold text-lg shadow-xl shadow-indigo-600/20" onClick={async () => {
                    await approveMessage(m.id, m.userId, responses[m.id] ?? m.response ?? "", optimizedEdits[m.id] ?? m.optimizedText);
                    toast({ title: "Memory Sync", description: "Verified and saved." });
                    loadData();
                  }}>اعتمد وثبت المعرفة</Button>
                  <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 rounded-2xl h-14 px-8 font-bold" onClick={async () => { if(confirm("حذف السجل؟")) { await rejectMessage(m.id, m.userId); loadData(); } }}>رفض السجل</Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Credit Injection Dialog */}
      <Dialog open={!!creditTarget} onOpenChange={(open) => !open && setCreditTarget(null)}>
        <DialogContent className="bg-slate-900 border-white/10 rounded-[2rem] p-8 sm:max-w-sm text-right">
          <DialogHeader><DialogTitle className="text-2xl font-bold flex items-center justify-end gap-3">حقن رصيد ائتماني <DollarSign className="text-emerald-400" /></DialogTitle></DialogHeader>
          <div className="py-6 space-y-4">
            <Label className="px-1 text-xs font-bold text-muted-foreground uppercase">كمية الرصيد للمستخدم @{creditTarget?.username}</Label>
            <Input type="number" placeholder="0.00" className="h-14 bg-white/5 border-white/10 rounded-xl text-center text-2xl font-black text-emerald-400" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={handleAddCredits} disabled={isAddingCredits || !creditAmount} className="w-full h-14 bg-emerald-600 rounded-xl font-bold text-lg shadow-lg">تأكيد الحق المالي</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
