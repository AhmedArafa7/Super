"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, ShieldAlert, Badge as BadgeIcon, Send, 
  ArrowRight, User as UserIcon, RefreshCcw, CheckCircle2, 
  Video, BarChart3, Users, Zap, XCircle, MessageCircle, 
  Eye, ShieldCheck, Activity, BookOpen, Trash2, Database,
  Wallet, Repeat, Bell, AlertTriangle, Radio, History, Tag, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getStoredMessages, approveMessage, rejectMessage, WizardMessage } from "@/lib/chat-store";
import { getStoredUsers, User } from "@/lib/auth-store";
import { getStoredVideos, updateVideoStatus, Video as VideoType } from "@/lib/video-store";
import { getSubjects, deleteSubject, Subject } from "@/lib/learning-store";
import { getAllOffersAdmin, MarketOffer } from "@/lib/market-store";
import { getAllTransactionsAdmin, Transaction } from "@/lib/wallet-store";
import { addNotification } from "@/lib/notification-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function AdminPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [offers, setOffers] = useState<MarketOffer[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [optimizedEdits, setOptimizedEdits] = useState<Record<string, string>>({});
  const [videoFeedback, setVideoFeedback] = useState<Record<string, string>>({});

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
        getSubjects(),
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "العقد البشرية", value: users.length, icon: Users, color: "text-blue-400" },
    { label: "رسائل المعالجة", value: messages.length, icon: MessageCircle, color: "text-indigo-400" },
    { label: "بثوث معلقة", value: videos.filter(v => v.status === 'pending_review').length, icon: Video, color: "text-amber-400" },
    { label: "إجمالي العمليات", value: allTransactions.length, icon: CreditCard, color: "text-emerald-400" },
  ];

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

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen gap-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h2 className="text-4xl font-headline font-bold text-white flex items-center gap-3 justify-end">
            Neural Admin Console
            <ShieldAlert className="text-indigo-400 size-10" />
          </h2>
          <p className="text-muted-foreground mt-1">مركز القيادة والرقابة العصبية الشاملة.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={loadData} disabled={isLoading} className="size-12 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
          <RefreshCcw className={cn("size-5", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="glass border-white/5 rounded-3xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 size-24 bg-white/5 blur-3xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-all" />
            <CardContent className="p-6 flex items-center justify-between flex-row-reverse">
              <div className={cn("size-12 rounded-2xl bg-white/5 flex items-center justify-center", s.color)}>
                <s.icon className="size-6" />
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{s.label}</p>
                <p className="text-2xl font-black text-white">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 w-fit flex-wrap flex-row-reverse self-end h-auto gap-1">
          <TabsTrigger value="chat" className="rounded-xl px-4 py-2.5 font-bold gap-2 flex-row-reverse"><MessageSquare className="size-4" /> الدردشة</TabsTrigger>
          <TabsTrigger value="media" className="rounded-xl px-4 py-2.5 font-bold gap-2 flex-row-reverse"><Video className="size-4" /> البث</TabsTrigger>
          <TabsTrigger value="market" className="rounded-xl px-4 py-2.5 font-bold gap-2 flex-row-reverse"><Tag className="size-4" /> رقابة السوق</TabsTrigger>
          <TabsTrigger value="finances" className="rounded-xl px-4 py-2.5 font-bold gap-2 flex-row-reverse"><Wallet className="size-4" /> النخاع المالي</TabsTrigger>
          <TabsTrigger value="broadcast" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-red-600 font-bold gap-2 flex-row-reverse"><Radio className="size-4" /> بث عام</TabsTrigger>
          <TabsTrigger value="knowledge" className="rounded-xl px-4 py-2.5 font-bold gap-2 flex-row-reverse"><Database className="size-4" /> المعرفة</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-4 py-2.5 font-bold gap-2 flex-row-reverse"><Users className="size-4" /> العقد</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 outline-none space-y-6">
          {messages.map((m) => (
            <Card key={m.id} className="glass border-white/10 rounded-[2.5rem] overflow-hidden p-8 space-y-6">
              <div className="flex justify-between items-center flex-row-reverse">
                <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="size-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-lg border border-indigo-500/20">{m.userName?.charAt(0).toUpperCase()}</div>
                  <div className="text-right">
                    <p className="font-bold text-white">@{m.userName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{new Date(m.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-[10px] uppercase", m.status === 'replied' ? "text-green-400" : "text-amber-400")}>{m.status}</Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3 text-right">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Original & Optimized</Label>
                  <div className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                    <p className="text-sm text-slate-300 italic">"{m.originalText}"</p>
                    <Textarea dir="auto" value={optimizedEdits[m.id] ?? m.optimizedText || ""} onChange={(e) => setOptimizedEdits({...optimizedEdits, [m.id]: e.target.value})} className="bg-transparent border-none text-xs p-0 text-right text-indigo-300 focus-visible:ring-0" placeholder="تعديل التحسين..." />
                  </div>
                </div>
                <div className="space-y-3 text-right">
                  <Label className="text-[10px] uppercase font-bold text-indigo-400">AI Response QA</Label>
                  <Textarea dir="auto" value={responses[m.id] ?? m.response || ""} onChange={(e) => setResponses({...responses, [m.id]: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl text-sm min-h-[125px] text-right p-5" placeholder="تجويد الرد..." />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-white/5 flex-row-reverse">
                <Button className="flex-1 bg-indigo-600 rounded-xl h-12 font-bold" onClick={async () => {
                  await approveMessage(m.id, m.userId, responses[m.id] ?? m.response ?? "", optimizedEdits[m.id] ?? m.optimizedText);
                  toast({ title: "Memory Sync", description: "Node response verified." });
                  loadData();
                }}><CheckCircle2 className="size-4 mr-2" /> اعتماد وتثبيت</Button>
                <Button variant="ghost" className="text-red-400 rounded-xl h-12" onClick={async () => { await rejectMessage(m.id, m.userId); loadData(); }}><XCircle className="size-4 mr-2" /> رفض</Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="market" className="flex-1 outline-none">
          <Card className="glass border-white/10 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center flex-row-reverse">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 flex-row-reverse"><Tag className="text-indigo-400" /> سجل المفاوضات العالمي</h3>
              <Badge className="bg-indigo-500/20 text-indigo-400">{offers.length} عروض نشطة</Badge>
            </div>
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-white/5">
                {offers.map((offer) => (
                  <div key={offer.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors flex-row-reverse">
                    <div className="text-right">
                      <p className="font-bold text-white">{offer.itemTitle}</p>
                      <p className="text-xs text-muted-foreground">@{offer.buyerName} ➜ @{offer.sellerId.substring(0,8)}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Offer Value</p>
                        <p className="text-sm font-black text-indigo-400">{offer.type === 'price' ? `${offer.value} Credits` : 'Neural Swap'}</p>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] h-6 px-3", offer.status === 'pending' ? "text-amber-400" : offer.status === 'accepted' ? "text-green-400" : "text-red-400")}>
                        {offer.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="finances" className="flex-1 outline-none">
          <Card className="glass border-white/10 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center flex-row-reverse">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 flex-row-reverse"><CreditCard className="text-emerald-400" /> النخاع المالي للنظام</h3>
              <Badge className="bg-emerald-500/20 text-emerald-400">{allTransactions.length} حركات موثقة</Badge>
            </div>
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-white/5">
                {allTransactions.map((tx) => (
                  <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors flex-row-reverse">
                    <div className="text-right">
                      <p className="font-bold text-white text-sm">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={cn("font-black text-lg", tx.amount > 0 ? "text-green-400" : "text-red-400")}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </p>
                      <Badge className="bg-white/5 border-white/10 text-[8px]">{tx.type.toUpperCase()}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="flex-1 outline-none">
          <Card className="glass border-red-500/20 rounded-[3rem] p-10 max-w-3xl mx-auto text-right space-y-8">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3 justify-end">بث رسالة نظام شاملة <AlertTriangle className="text-red-400" /></h3>
            <div className="space-y-4">
              <div className="grid gap-2"><Label className="uppercase text-[10px] text-muted-foreground">عنوان البث</Label><Input dir="auto" className="bg-white/5 border-white/10 h-12 rounded-xl text-right" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} /></div>
              <div className="grid gap-2"><Label className="uppercase text-[10px] text-muted-foreground">محتوى الرسالة</Label><Textarea dir="auto" className="bg-white/5 border-white/10 min-h-[150px] rounded-2xl text-right" value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} /></div>
            </div>
            <Button onClick={handleSendBroadcast} disabled={isBroadcasting || !broadcastTitle || !broadcastMsg} className="w-full h-14 bg-red-600 rounded-2xl font-bold text-lg">{isBroadcasting ? <RefreshCcw className="animate-spin size-5 mr-2" /> : <Send className="size-5 mr-2" />} إرسال البث الموحد</Button>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="flex-1 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((s) => (
              <Card key={s.id} className="p-6 glass border-white/5 rounded-[2rem] text-right space-y-4">
                <div className="flex justify-between flex-row-reverse">
                  <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10"><BookOpen className="size-6" /></div>
                  <Button variant="ghost" size="icon" className="text-red-400/40 hover:text-red-400" onClick={async () => { if(confirm("حذف؟")) { await deleteSubject(s.id); loadData(); } }}><Trash2 className="size-4" /></Button>
                </div>
                <div><h4 className="font-bold text-white">{s.title}</h4><p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p></div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="flex-1 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => (
              <Card key={u.id} className="p-6 glass border-white/5 rounded-[2rem] flex items-center justify-between flex-row-reverse">
                <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="size-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-xl font-black text-indigo-400 border border-indigo-500/10">{u.name?.charAt(0).toUpperCase()}</div>
                  <div className="text-right"><p className="font-bold text-white">{u.name}</p><p className="text-xs text-muted-foreground">@{u.username}</p></div>
                </div>
                <Badge variant="outline" className={cn("capitalize border-indigo-500/20", u.role === 'admin' ? "text-indigo-400 bg-indigo-500/5" : "text-slate-400")}>{u.role}</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
