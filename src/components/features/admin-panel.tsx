
"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, ShieldAlert, Badge as BadgeIcon, Send, 
  ArrowRight, User as UserIcon, RefreshCcw, CheckCircle2, 
  Video, BarChart3, Users, Zap, XCircle, MessageCircle, 
  Eye, ShieldCheck, Activity, BookOpen, Trash2, Database,
  Wallet, Repeat, Bell, AlertTriangle, Radio, History, Tag, CreditCard,
  FileVideo, ArrowUpRight, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

  // States for Editing
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
      toast({ variant: "destructive", title: "Sync Failure", description: "Could not reach the neural backbone." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Auto-sync every 30s
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "العقد البشرية", value: users.length, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "رسائل المعالجة", value: messages.length, icon: MessageCircle, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "بثوث معلقة", value: videos.filter(v => v.status === 'pending_review').length, icon: FileVideo, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "سيولة النظام", value: allTransactions.reduce((acc, tx) => acc + (tx.amount > 0 ? tx.amount : 0), 0).toLocaleString(), icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
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

  const handleVideoAction = async (id: string, status: 'published' | 'rejected') => {
    const feedback = videoFeedback[id] || "";
    await updateVideoStatus(id, status, feedback);
    toast({ title: "Media Protocol Updated", description: `Video has been ${status}.` });
    loadData();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen gap-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h2 className="text-5xl font-headline font-bold text-white flex items-center gap-4 justify-end">
            Admin Neural Console
            <ShieldAlert className="text-indigo-400 size-12" />
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">نظام الرقابة والتحكم المركزي في نسيج نكسوس.</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading} className="size-14 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all shadow-xl">
          <RefreshCcw className={cn("size-6 text-indigo-400", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Stats Pulse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Card key={i} className="glass border-white/5 rounded-[2rem] overflow-hidden relative group">
            <div className={cn("absolute top-0 right-0 size-32 blur-3xl -mr-16 -mt-16 opacity-20 transition-all group-hover:opacity-40", s.bg)} />
            <CardContent className="p-8 flex items-center justify-between flex-row-reverse relative z-10">
              <div className={cn("size-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5", s.color)}>
                <s.icon className="size-7" />
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] mb-1">{s.label}</p>
                <p className="text-3xl font-black text-white">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40 border-2 border-dashed border-white/5 rounded-[3rem]">
              <MessageSquare className="size-16 mb-4" />
              <p className="text-xl">لا توجد رسائل معلقة للمراجعة.</p>
            </div>
          ) : (
            messages.map((m) => (
              <Card key={m.id} className="glass border-white/10 rounded-[3rem] overflow-hidden p-10 space-y-8 shadow-2xl relative">
                <div className="absolute top-0 right-0 size-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                <div className="flex justify-between items-center flex-row-reverse relative z-10">
                  <div className="flex items-center gap-5 flex-row-reverse">
                    <div className="size-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-xl border border-indigo-500/20 shadow-inner">{m.userName?.charAt(0).toUpperCase()}</div>
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
            {videos.filter(v => v.status === 'pending_review').map((v) => (
              <Card key={v.id} className="glass border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
                <div className="relative aspect-video">
                  <img src={v.thumbnail} className="size-full object-cover opacity-60" alt={v.title} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="text-white size-12" />
                  </div>
                  <Badge className="absolute top-4 left-4 bg-amber-500/80 backdrop-blur-md border-white/10 uppercase text-[8px] font-bold">Needs Review</Badge>
                </div>
                <CardContent className="p-8 flex-1 flex flex-col">
                  <h3 dir="auto" className="font-bold text-xl text-white mb-2 text-right">{v.title}</h3>
                  <p className="text-xs text-muted-foreground text-right mb-6">المؤلف: @{v.author}</p>
                  
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
                </CardContent>
              </Card>
            ))}
          </div>
          {videos.filter(v => v.status === 'pending_review').length === 0 && (
            <div className="text-center py-32 glass border-dashed border-2 border-white/5 rounded-[3rem] opacity-40">
              <FileVideo className="size-16 mx-auto mb-4" />
              <p className="text-xl">لا توجد بثوث بانتظار المراجعة.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="market" className="flex-1 outline-none">
          <Card className="glass border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-10 border-b border-white/5 flex justify-between items-center flex-row-reverse bg-white/5">
              <h3 className="text-2xl font-bold text-white flex items-center gap-4 flex-row-reverse"><Tag className="text-indigo-400 size-8" /> سجل المفاوضات العالمي</h3>
              <Badge className="bg-indigo-500/20 text-indigo-400 px-6 py-1.5 rounded-full font-bold">{offers.length} عروض نشطة</Badge>
            </div>
            <ScrollArea className="h-[650px]">
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
              <div className="divide-y divide-white/5">
                {allTransactions.map((tx) => (
                  <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all flex-row-reverse">
                    <div className="text-right">
                      <p className="font-bold text-white text-lg">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-2 justify-end">
                        <ClockIcon className="size-3" />
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
                  <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 uppercase text-[8px] font-bold">Subject Node</Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">ID: {s.id.substring(0,8)}</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="flex-1 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((u) => (
              <Card key={u.id} className="p-8 glass border-white/5 rounded-[2.5rem] flex items-center justify-between flex-row-reverse group hover:border-indigo-500/30 transition-all shadow-xl">
                <div className="flex items-center gap-5 flex-row-reverse">
                  <div className="size-16 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-2xl font-black text-indigo-400 border border-indigo-500/10 shadow-inner group-hover:scale-110 transition-transform">{u.name?.charAt(0).toUpperCase()}</div>
                  <div className="text-right">
                    <p className="font-black text-xl text-white">{u.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">@{u.username}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn("capitalize h-8 px-4 rounded-xl border-indigo-500/20 font-bold", u.role === 'admin' ? "text-indigo-400 bg-indigo-500/10" : "text-slate-400")}>
                  {u.role}
                </Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
