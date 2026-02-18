
"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, ShieldAlert, Badge as BadgeIcon, Send, 
  ArrowRight, User as UserIcon, RefreshCcw, CheckCircle2, 
  Video, BarChart3, Users, Zap, XCircle, MessageCircle, 
  Eye, ShieldCheck, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getStoredMessages, approveMessage, rejectMessage, WizardMessage } from "@/lib/chat-store";
import { getStoredUsers, User } from "@/lib/auth-store";
import { getStoredVideos, updateVideoStatus, Video as VideoType } from "@/lib/video-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function AdminPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [optimizedEdits, setOptimizedEdits] = useState<Record<string, string>>({});
  const [videoFeedback, setVideoFeedback] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [msgs, allUsers, allVideos] = await Promise.all([
        getStoredMessages(undefined, true),
        getStoredUsers(),
        getStoredVideos()
      ]);
      setMessages(msgs || []);
      setUsers(allUsers || []);
      setVideos(allVideos || []);
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
    { label: "كفاءة النظام", value: "99.9%", icon: Activity, color: "text-green-400" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen gap-8">
      {/* Header & Sync */}
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h2 className="text-4xl font-headline font-bold text-white flex items-center gap-3 justify-end">
            Neural Admin Console
            <ShieldAlert className="text-indigo-400 size-10" />
          </h2>
          <p className="text-muted-foreground mt-1">إدارة البروتوكولات، مراجعة المحتوى، وتجويد الذاكرة العصبية.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={loadData} disabled={isLoading} className="size-12 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10">
          <RefreshCcw className={cn("size-5", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Stats Ribbon */}
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
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 w-fit flex-row-reverse self-end">
          <TabsTrigger value="chat" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-indigo-600 font-bold gap-2">
            <MessageSquare className="size-4" /> مسار الدردشة
          </TabsTrigger>
          <TabsTrigger value="media" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-indigo-600 font-bold gap-2">
            <Video className="size-4" /> مراجعة البث
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-indigo-600 font-bold gap-2">
            <Users className="size-4" /> سجل المستخدمين
          </TabsTrigger>
        </TabsList>

        {/* Chat Flow Tab */}
        <TabsContent value="chat" className="flex-1 outline-none">
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="py-20 text-center glass rounded-[3rem] border-dashed border-2 border-white/10">
                <Zap className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">لا توجد رسائل في مسار المعالجة حالياً.</p>
              </div>
            ) : (
              messages.map((m) => (
                <Card key={m.id} className="glass border-white/10 rounded-[2.5rem] overflow-hidden">
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <div className="flex items-center gap-4 flex-row-reverse">
                        <div className="size-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-lg border border-indigo-500/20">
                          {m.userName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">@{m.userName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{new Date(m.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-bold uppercase",
                          m.status === 'replied' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {m.status}
                        </Badge>
                        <Badge className="bg-white/5 border-white/10 text-[10px] uppercase">{m.engine || 'Neural'}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3 text-right">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Original & Optimized Input</Label>
                        <div className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                          <p className="text-sm text-slate-300 italic">"{m.originalText}"</p>
                          <div className="h-px bg-white/10" />
                          <Textarea 
                            dir="auto"
                            value={optimizedEdits[m.id] !== undefined ? optimizedEdits[m.id] : (m.optimizedText || "")} 
                            onChange={(e) => setOptimizedEdits({...optimizedEdits, [m.id]: e.target.value})}
                            placeholder="Prompt Optimization مسودة الـ"
                            className="bg-transparent border-none text-xs p-0 text-right focus-visible:ring-0 min-h-[60px] text-indigo-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 text-right">
                        <Label className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block">AI Response Quality Check</Label>
                        <Textarea 
                          dir="auto"
                          value={responses[m.id] !== undefined ? responses[m.id] : (m.response || "")}
                          onChange={(e) => setResponses({...responses, [m.id]: e.target.value})}
                          placeholder="Refine response before transmission..."
                          className="bg-white/5 border-white/10 rounded-2xl text-sm min-h-[125px] text-right p-5 focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white/5 flex-row-reverse">
                      <Button 
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl h-12 font-bold shadow-lg shadow-indigo-600/20"
                        onClick={async () => {
                          await approveMessage(
                            m.id, 
                            m.userId, 
                            responses[m.id] !== undefined ? responses[m.id] : (m.response || ""),
                            optimizedEdits[m.id] !== undefined ? optimizedEdits[m.id] : m.optimizedText
                          );
                          toast({ title: "Memory Updated", description: "Node response has been verified and stored." });
                          loadData();
                        }}
                      >
                        <CheckCircle2 className="size-4 mr-2" /> اعتماد وتثبيت الرد
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-red-400 hover:bg-red-500/10 rounded-xl h-12 px-8"
                        onClick={async () => {
                          await rejectMessage(m.id, m.userId);
                          loadData();
                        }}
                      >
                        <XCircle className="size-4 mr-2" /> رفض
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Media Review Tab */}
        <TabsContent value="media" className="flex-1 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.filter(v => v.status === 'pending_review').length === 0 ? (
              <div className="col-span-full py-20 text-center glass rounded-[3rem] border-dashed border-2 border-white/10 opacity-50">
                <Video className="size-12 mx-auto mb-4" />
                <p>لا توجد بثوث بانتظار المراجعة.</p>
              </div>
            ) : (
              videos.filter(v => v.status === 'pending_review').map((v) => (
                <Card key={v.id} className="glass border-white/10 rounded-[2.5rem] overflow-hidden group">
                  <div className="aspect-video relative overflow-hidden bg-slate-900">
                    <img src={v.thumbnail} className="size-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" alt={v.title} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button variant="outline" className="rounded-full bg-black/40 backdrop-blur-md border-white/20 h-14 w-14 group-hover:bg-primary group-hover:text-white transition-all">
                        <Eye className="size-6" />
                      </Button>
                    </div>
                    <Badge className="absolute top-4 left-4 bg-amber-500/80 backdrop-blur-md">REVIEW REQUIRED</Badge>
                  </div>
                  <CardContent className="p-8 text-right space-y-6">
                    <div>
                      <h3 dir="auto" className="text-xl font-bold text-white mb-1">{v.title}</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2 justify-end">
                        @{v.author} <UserIcon className="size-3" />
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Admin Feedback</Label>
                      <Textarea 
                        dir="auto"
                        placeholder="إضافة ملاحظات للمستخدم (اختياري)..." 
                        className="bg-white/5 border-white/10 rounded-xl text-xs h-20 text-right"
                        value={videoFeedback[v.id] || ""}
                        onChange={(e) => setVideoFeedback({...videoFeedback, [v.id]: e.target.value})}
                      />
                    </div>

                    <div className="flex gap-2 flex-row-reverse">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl font-bold h-11"
                        onClick={async () => {
                          await updateVideoStatus(v.id, 'published', videoFeedback[v.id]);
                          toast({ title: "Broadcast Authorized", description: "Video is now live on StreamHub." });
                          loadData();
                        }}
                      >
                        <ShieldCheck className="size-4 mr-2" /> إطلاق البث
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-red-400 hover:bg-red-500/10 rounded-xl h-11 px-6"
                        onClick={async () => {
                          await updateVideoStatus(v.id, 'rejected', videoFeedback[v.id]);
                          loadData();
                        }}
                      >
                        رفض
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* User Registry Tab */}
        <TabsContent value="users" className="flex-1 outline-none">
          <Card className="glass border-white/10 rounded-[3rem] p-8">
            <div className="flex justify-between items-center mb-8 flex-row-reverse">
              <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-row-reverse">
                <Users className="text-indigo-400" />
                سجل العقد البشرية
              </h3>
              <Badge className="bg-indigo-500/20 text-indigo-400">{users.length} Active Nodes</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((u) => (
                <div key={u.id} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-between flex-row-reverse group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="size-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-xl font-black text-indigo-400 border border-indigo-500/10 group-hover:scale-105 transition-transform">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={cn(
                      "capitalize border-indigo-500/20",
                      u.role === 'admin' ? "text-indigo-400 bg-indigo-500/5" : "text-slate-400"
                    )}>
                      {u.role}
                    </Badge>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Verified Node</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
