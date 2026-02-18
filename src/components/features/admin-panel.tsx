
"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, ShieldAlert, Send, RefreshCcw, CheckCircle2, 
  Video, Users, MessageCircle, Zap, XCircle, BookOpen, Trash2, 
  Database, Wallet, Radio, Tag, CreditCard, Play, Plus, UserPlus, 
  Shield, DollarSign, Clock, ArrowUpRight, AlertTriangle, Lock, Unlock
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
import { getStoredUsers, User, addUser, UserRole, updateUserProfile } from "@/lib/auth-store";
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

  // Credit Addition State
  const [creditTarget, setCreditTarget] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [isAddingCredits, setIsAddingCredits] = useState(false);

  // Editing States
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [optimizedEdits, setOptimizedEdits] = useState<Record<string, string>>({});
  const [videoFeedback, setVideoFeedback] = useState<Record<string, string>>({});

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

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

  const handleToggleCreditAuthority = async (userId: string, currentStatus: boolean) => {
    try {
      await updateUserProfile(userId, { canManageCredits: !currentStatus });
      toast({ title: "Authority Updated", description: "Credit management permission toggled." });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: "Permission sync failed." });
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

  const handleSendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMsg) return;
    setIsBroadcasting(true);
    try {
      addNotification({
        type: 'system_broadcast',
        title: broadcastTitle,
        message: broadcastMsg,
        priority: 'critical'
      });
      toast({ title: "Broadcast Transmitted", description: "All active nodes have received the system update." });
      setBroadcastTitle("");
      setBroadcastMsg("");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleVideoAction = async (id: string, status: 'published' | 'rejected') => {
    const feedback = videoFeedback[id] || "";
    await updateVideoStatus(id, status, feedback);
    toast({ title: "Media Protocol Updated", description: `Video has been ${status}.` });
    loadData();
  };

  const renderEmptyState = (icon: React.ElementType, title: string) => (
    <div className="flex flex-col items-center justify-center py-32 opacity-40 border-2 border-dashed border-white/5 rounded-[3rem] text-center w-full">
      {React.createElement(icon, { className: "size-16 mb-4" })}
      <p className="text-xl font-bold">{title}</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen gap-10 animate-in fade-in duration-700 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h2 className="text-5xl font-headline font-bold text-white flex items-center gap-4 justify-end">
            Admin Neural Console
            <ShieldAlert className="text-indigo-400 size-12" />
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">نظام الرقابة والتحكم المركزي - المستوى السيادي.</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading} className="size-14 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all shadow-xl">
          <RefreshCcw className={cn("size-6 text-indigo-400", isLoading && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="bg-white/5 border border-white/10 rounded-[1.5rem] p-1.5 mb-10 w-fit flex-wrap flex-row-reverse self-end h-auto gap-1.5">
          <TabsTrigger value="chat" className="rounded-xl px-6 py-3 font-bold gap-3 flex-row-reverse data-[state=active]:bg-indigo-600"><MessageSquare className="size-4" /> مراجعة الدردشة</TabsTrigger>
          <TabsTrigger value="media" className="rounded-xl px-6 py-3 font-bold gap-3 flex-row-reverse data-[state=active]:bg-indigo-600"><Video className="size-4" /> الرقابة البصرية</TabsTrigger>
          <TabsTrigger value="market" className="rounded-xl px-6 py-3 font-bold gap-3 flex-row-reverse data-[state=active]:bg-indigo-600"><Tag className="size-4" /> تدقيق السوق</TabsTrigger>
          <TabsTrigger value="finances" className="rounded-xl px-6 py-3 font-bold gap-3 flex-row-reverse data-[state=active]:bg-indigo-600"><Wallet className="size-4" /> السجل المالي</TabsTrigger>
          <TabsTrigger value="broadcast" className="rounded-xl px-6 py-3 data-[state=active]:bg-red-600 font-bold gap-3 flex-row-reverse"><Radio className="size-4" /> البث العام</TabsTrigger>
          <TabsTrigger value="knowledge" className="rounded-xl px-6 py-3 font-bold gap-3 flex-row-reverse data-[state=active]:bg-indigo-600"><Database className="size-4" /> المعرفة</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-6 py-3 font-bold gap-3 flex-row-reverse data-[state=active]:bg-indigo-600"><Users className="size-4" /> العقد البشرية</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 outline-none space-y-8">
          {messages.length === 0 ? renderEmptyState(MessageSquare, "لا توجد رسائل معلقة للمراجعة.") : (
            messages.map((m) => (
              <Card key={m.id} className="glass border-white/10 rounded-[3rem] overflow-hidden p-10 space-y-8 shadow-2xl relative">
                <div className="absolute top-0 right-0 size-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                <div className="flex justify-between items-center flex-row-reverse relative z-10">
                  <div className="flex items-center gap-5 flex-row-reverse">
                    <div className="size-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-xl border border-indigo-500/20 shadow-inner">{(m.userName || "?").charAt(0).toUpperCase()}</div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-white">@{m.userName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{new Date(m.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] h-6 px-4 uppercase font-bold tracking-widest", m.status === 'replied' ? "text-green-400 border-green-500/20 bg-green-500/5" : "text-amber-400 border-amber-500/20 bg-amber-500/5")}>
                    {m.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                  <div className="space-y-4 text-right">
                    <Label className="text-xs uppercase font-bold text-muted-foreground tracking-[0.2em] px-2">Original & Optimized Transmission</Label>
                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-6 shadow-inner">
                      <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Input:</p>
                        <p className="text-sm text-slate-300 italic leading-relaxed">"{m.originalText}"</p>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="space-y-2">
                        <p className="text-[10px] text-indigo-400 uppercase font-bold">Neural Optimization:</p>
                        <Textarea 
                          dir="auto" 
                          value={optimizedEdits[m.id] ?? m.optimizedText || ""} 
                          onChange={(e) => setOptimizedEdits({...optimizedEdits, [m.id]: e.target.value})} 
                          className="bg-transparent border-none text-xs p-0 text-right text-indigo-300 focus-visible:ring-0 min-h-[60px]" 
                          placeholder="تعديل تحسين الموديل..." 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 text-right">
                    <Label className="text-xs uppercase font-bold text-indigo-400 tracking-[0.2em] px-2">AI Response Quality Assurance</Label>
                    <div className="relative group">
                      <Textarea 
                        dir="auto" 
                        value={responses[m.id] ?? m.response || ""} 
                        onChange={(e) => setResponses({...responses, [m.id]: e.target.value})} 
                        className="bg-white/5 border-white/10 rounded-3xl text-sm min-h-[180px] text-right p-6 focus-visible:ring-indigo-500 shadow-inner" 
                        placeholder="جاري انتظار الرد أو كتابة رد مخصص..." 
                      />
                      <div className="absolute bottom-4 left-4 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Zap className="size-4 text-indigo-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/5 flex-row-reverse relative z-10">
                  <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-14 font-bold text-lg shadow-xl shadow-indigo-600/20" onClick={async () => {
                    await approveMessage(m.id, m.userId, responses[m.id] ?? m.response ?? "", optimizedEdits[m.id] ?? m.optimizedText);
                    toast({ title: "Memory Sync", description: "Node response verified and saved to database." });
                    loadData();
                  }}>
                    <CheckCircle2 className="size-5 mr-3" /> اعتماد وتثبيت المعرفة
                  </Button>
                  <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 rounded-2xl h-14 px-8 font-bold" onClick={async () => { 
                    if(confirm("هل تريد حذف هذا السجل نهائياً؟")) {
                      await rejectMessage(m.id, m.userId); 
                      loadData(); 
                    }
                  }}>
                    <XCircle className="size-5 mr-3" /> رفض السجل
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="media" className="flex-1 outline-none space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((v) => (
              <Card key={v.id} className={cn("glass border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-all", v.status === 'pending_review' ? "ring-2 ring-amber-500/50" : "opacity-80 hover:opacity-100")}>
                <div className="relative aspect-video">
                  <img src={v.thumbnail} className="size-full object-cover" alt={v.title} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="text-white size-12" />
                  </div>
                  {v.status === 'pending_review' && (
                    <Badge className="absolute top-4 left-4 bg-amber-500/80 backdrop-blur-md border-white/10 uppercase text-[8px] font-bold">Needs Review</Badge>
                  )}
                </div>
                <CardContent className="p-8 flex-1 flex flex-col">
                  <h3 dir="auto" className="font-bold text-xl text-white mb-2 text-right">{v.title}</h3>
                  <p className="text-xs text-muted-foreground text-right mb-6">المؤلف: @{v.author}</p>
                  
                  {v.status === 'pending_review' && (
                    <>
                      <Textarea 
                        dir="auto"
                        placeholder="ملاحظات المراجعة..." 
                        className="bg-white/5 border-white/10 rounded-xl mb-6 text-right text-xs min-h-[80px]"
                        value={videoFeedback[v.id] || ""}
                        onChange={(e) => setVideoFeedback({...videoFeedback, [v.id]: e.target.value})}
                      />
                      <div className="mt-auto flex gap-3 flex-row-reverse">
                        <Button className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl font-bold h-11" onClick={() => handleVideoAction(v.id, 'published')}>قبول</Button>
                        <Button variant="ghost" className="flex-1 text-red-400 hover:bg-red-500/10 rounded-xl font-bold h-11" onClick={() => handleVideoAction(v.id, 'rejected')}>رفض</Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {videos.length === 0 && renderEmptyState(FileVideo, "لا توجد بثوث مسجلة في النظام.")}
        </TabsContent>

        <TabsContent value="market" className="flex-1 outline-none">
          <Card className="glass border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-10 border-b border-white/5 flex justify-between items-center flex-row-reverse bg-white/5">
              <h3 className="text-2xl font-bold text-white flex items-center gap-4 flex-row-reverse"><Tag className="text-indigo-400 size-8" /> سجل المفاوضات العالمي</h3>
              <Badge className="bg-indigo-500/20 text-indigo-400 px-6 py-1.5 rounded-full font-bold">{offers.length} عروض نشطة</Badge>
            </div>
            <ScrollArea className="h-[650px]">
              {offers.length === 0 ? renderEmptyState(Repeat, "لا توجد عروض أو مفاوضات حالية.") : (
                <div className="divide-y divide-white/5">
                  {offers.map((offer) => (
                    <div key={offer.id} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all flex-row-reverse group">
                      <div className="text-right flex items-center gap-6 flex-row-reverse">
                        <div className="size-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
                          {offer.type === 'price' ? <DollarSign className="size-7" /> : <Repeat className="size-7" />}
                        </div>
                        <div>
                          <p className="font-bold text-xl text-white">{offer.itemTitle}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="text-indigo-400 font-bold">@{offer.buyerName}</span> 
                            <ArrowUpRight className="inline size-3 mx-2 opacity-40" /> 
                            @{offer.sellerId.substring(0,8)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-10">
                        <div className="text-center px-6 py-3 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Value Protocol</p>
                          <p className="text-lg font-black text-indigo-400">{offer.type === 'price' ? `${offer.value?.toLocaleString()} Credits` : 'Neural Swap'}</p>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px] h-8 px-5 rounded-xl uppercase font-black tracking-widest", 
                          offer.status === 'pending' ? "text-amber-400 border-amber-500/20 bg-amber-500/5" : 
                          offer.status === 'accepted' ? "text-green-400 border-green-500/20 bg-green-500/5" : 
                          "text-red-400 border-red-500/20 bg-red-500/5")}>
                          {offer.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="finances" className="flex-1 outline-none">
          <Card className="glass border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-10 border-b border-white/5 flex justify-between items-center flex-row-reverse bg-white/5">
              <h3 className="text-2xl font-bold text-white flex items-center gap-4 flex-row-reverse"><CreditCard className="text-emerald-400 size-8" /> النخاع المالي للنظام</h3>
              <Badge className="bg-emerald-500/20 text-emerald-400 px-6 py-1.5 rounded-full font-bold">{allTransactions.length} حركات موثقة</Badge>
            </div>
            <ScrollArea className="h-[650px]">
              {allTransactions.length === 0 ? renderEmptyState(Wallet, "لم يتم رصد أي حركات مالية في النظام بعد.") : (
                <div className="divide-y divide-white/5">
                  {allTransactions.map((tx) => (
                    <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all flex-row-reverse">
                      <div className="text-right">
                        <p className="font-bold text-white text-lg">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-2 justify-end">
                          <Clock className="size-3" />
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className={cn("font-black text-2xl tracking-tighter", tx.amount > 0 ? "text-green-400" : "text-red-400")}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </p>
                        <Badge className="bg-white/5 border border-white/10 text-[9px] h-6 px-3 uppercase font-bold">{tx.type.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="flex-1 outline-none">
          <Card className="glass border-red-500/20 rounded-[4rem] p-16 max-w-4xl mx-auto text-right space-y-10 shadow-[0_0_100px_rgba(239,68,68,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 size-96 bg-red-500/5 blur-[120px] -ml-48 -mt-48 pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <h3 className="text-4xl font-headline font-black text-white flex items-center gap-5 justify-end">
                بث رسالة نظام شاملة 
                <AlertTriangle className="text-red-500 size-12 animate-pulse" />
              </h3>
              <p className="text-muted-foreground text-lg">تحذير: سيصل هذا البث لكافة العقد النشطة في النظام فوراً.</p>
            </div>
            
            <div className="space-y-8 relative z-10">
              <div className="grid gap-3">
                <Label className="uppercase text-xs font-black text-muted-foreground tracking-[0.3em] px-2">عنوان البث العاجل</Label>
                <Input dir="auto" className="bg-white/5 border-white/10 h-16 rounded-2xl text-right text-xl focus-visible:ring-red-500 shadow-inner" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="مثال: تحديث أمني هام..." />
              </div>
              <div className="grid gap-3">
                <Label className="uppercase text-xs font-black text-muted-foreground tracking-[0.3em] px-2">محتوى الإرسال</Label>
                <Textarea dir="auto" className="bg-white/5 border-white/10 min-h-[250px] rounded-[2rem] text-right text-lg p-8 focus-visible:ring-red-500 shadow-inner" value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="اكتب تفاصيل التحديث أو التنبيه هنا..." />
              </div>
            </div>
            
            <Button onClick={handleSendBroadcast} disabled={isBroadcasting || !broadcastTitle || !broadcastMsg} className="w-full h-20 bg-red-600 hover:bg-red-500 rounded-[2rem] font-black text-2xl shadow-2xl shadow-red-600/20 transition-all active:scale-95 relative z-10 group">
              {isBroadcasting ? <RefreshCcw className="animate-spin size-8 mr-4" /> : <Send className="size-8 mr-4 group-hover:translate-x-2 transition-transform" />} 
              إرسال البث الموحد للنخاع
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="flex-1 outline-none">
          {subjects.length === 0 ? renderEmptyState(BookOpen, "لم يتم العثور على أي عقد معرفية في النظام.") : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subjects.map((s) => (
                <Card key={s.id} className="p-10 glass border-white/5 rounded-[3rem] text-right space-y-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 size-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all" />
                  <div className="flex justify-between flex-row-reverse relative z-10">
                    <div className="size-16 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 shadow-inner"><BookOpen className="size-8" /></div>
                    <Button variant="ghost" size="icon" className="size-12 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all" onClick={async () => { if(confirm("حذف عقدة المعرفة بالكامل؟")) { await deleteSubject(s.id); loadData(); } }}>
                      <Trash2 className="size-6" />
                    </Button>
                  </div>
                  <div className="relative z-10">
                    <h4 className="font-black text-2xl text-white mb-2">{s.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{s.description}</p>
                  </div>
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between flex-row-reverse relative z-10">
                    <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 uppercase text-[8px] font-bold">
                      {s.allowedUserIds ? "Restricted" : "Public"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {s.id.substring(0,8)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="flex-1 outline-none space-y-8">
          <div className="flex justify-between items-center flex-row-reverse">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3 flex-row-reverse"><Users className="text-indigo-400" /> سجل العقد البشرية الموثقة</h3>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-6 font-bold h-12 shadow-xl shadow-indigo-600/20">
                  <UserPlus className="mr-2 size-5" /> تسجيل عقدة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 rounded-[2rem] p-8 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-right">إضافة مستخدم جديد</DialogTitle>
                  <DialogDescription className="text-right">قم بإنشاء هوية جديدة للوصول إلى بروتوكول نكسوس.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-6 text-right">
                  <div className="grid gap-2">
                    <Label className="px-1 font-bold text-xs uppercase tracking-widest text-muted-foreground">اسم الهوية الكامل</Label>
                    <Input dir="auto" className="bg-white/5 border-white/10 h-12 rounded-xl text-right" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="الاسم الحقيقي..." />
                  </div>
                  <div className="grid gap-2">
                    <Label className="px-1 font-bold text-xs uppercase tracking-widest text-muted-foreground">معرف الدخول (Username)</Label>
                    <Input dir="auto" className="bg-white/5 border-white/10 h-12 rounded-xl text-right" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="id_unique..." />
                  </div>
                  <div className="grid gap-2">
                    <Label className="px-1 font-bold text-xs uppercase tracking-widest text-muted-foreground">صلاحية النخاع (Role)</Label>
                    <Select value={newUser.role} onValueChange={(v: UserRole) => setNewUser({...newUser, role: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl flex-row-reverse"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="user">User Node</SelectItem>
                        <SelectItem value="employee">Staff / Employee</SelectItem>
                        <SelectItem value="admin">System Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateUser} disabled={isCreatingUser || !newUser.username} className="w-full bg-indigo-600 h-14 rounded-xl font-bold text-lg shadow-lg">
                    {isCreatingUser ? <RefreshCcw className="animate-spin size-5 mr-2" /> : <Shield className="size-5 mr-2" />}
                    تفعيل العقدة في السجل
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {users.length === 0 ? renderEmptyState(Users, "لا يوجد مستخدمون مسجلون حالياً.") : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((u) => (
                <Card key={u.id} className="p-8 glass border-white/5 rounded-[2.5rem] flex flex-col gap-6 group hover:border-indigo-500/30 transition-all shadow-xl">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <div className="flex items-center gap-5 flex-row-reverse">
                      <div className="size-16 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-2xl font-black text-indigo-400 border border-indigo-500/10 shadow-inner group-hover:scale-110 transition-transform">
                        {(u.name || u.username || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl text-white">{u.name || u.username}</p>
                        <p className="text-xs text-muted-foreground font-mono">@{u.username}</p>
                      </div>
                    </div>
                    {/* زر إضافة الرصيد - يظهر فقط لمن لديه الصلاحية */}
                    {currentUser?.canManageCredits && (
                      <Button variant="ghost" size="icon" className="size-10 bg-indigo-500/10 rounded-full text-indigo-400" onClick={() => setCreditTarget(u)}>
                        <Plus className="size-5" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">صلاحية النخاع</Label>
                      <Select defaultValue={u.role} onValueChange={(v: UserRole) => handleUpdateUserRole(u.id, v)}>
                        <SelectTrigger className="h-9 w-32 bg-white/5 border-white/10 text-[10px] font-bold rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                          <SelectItem value="user">User Node</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="admin">System Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* صلاحية إدارة الرصيد - يراها ويتحكم بها المدير الأعلى فقط */}
                    {currentUser?.canManageCredits && u.role === 'admin' && (
                      <div className="flex items-center justify-between flex-row-reverse">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">صلاحية الائتمان</Label>
                          {u.canManageCredits ? <Unlock className="size-3 text-green-400" /> : <Lock className="size-3 text-red-400" />}
                        </div>
                        <Switch checked={!!u.canManageCredits} onCheckedChange={() => handleToggleCreditAuthority(u.id, !!u.canManageCredits)} />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* مودال إضافة الرصيد */}
      <Dialog open={!!creditTarget} onOpenChange={(open) => !open && setCreditTarget(null)}>
        <DialogContent className="bg-slate-900 border-white/10 rounded-[2rem] p-8 sm:max-w-sm text-right">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-end gap-3">
              حقن رصيد ائتماني
              <DollarSign className="text-emerald-400" />
            </DialogTitle>
            <DialogDescription className="text-right">أنت تقوم بتوزيع سيولة Credits للمستخدم @{creditTarget?.username}.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="grid gap-2">
              <Label className="px-1 text-xs font-bold text-muted-foreground uppercase">كمية الرصيد</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                className="h-14 bg-white/5 border-white/10 rounded-xl text-center text-2xl font-black text-emerald-400" 
                value={creditAmount}
                onChange={e => setCreditAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddCredits} disabled={isAddingCredits || !creditAmount} className="w-full h-14 bg-emerald-600 rounded-xl font-bold text-lg shadow-lg">
              {isAddingCredits ? <RefreshCcw className="animate-spin mr-2" /> : <Zap className="mr-2" />}
              تأكيد الحق المالي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
