
"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Send, User, MessageSquare, History, ShieldAlert, Cpu, Activity, Edit3, Save, Radio, BellRing, Info, AlertTriangle, Users, Key, Trash2, Plus, Download, FileText, Music, Image as ImageIcon, Video as VideoIcon, CheckCircle2, XCircle, AlertCircle, Clock, GraduationCap, BookOpen, Lock, Globe } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function AdminPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  
  // Broadcast state
  const [broadcast, setBroadcast] = useState({ title: "", body: "", priority: "info" as Priority });

  // User Mgmt state
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "user" as any });

  // Video Feedback State
  const [videoFeedback, setVideoFeedback] = useState<Record<string, string>>({});

  // Learning State
  const [newSubject, setNewSubject] = useState({ name: "", description: "", allowedUserIds: "" });

  useEffect(() => {
    const loadData = async () => {
      const msgs = await getStoredMessages(undefined, true);
      setMessages(msgs);
      setUsers(getStoredUsers());
      setVideos(getStoredVideos());
      const subs = await getSubjects();
      setSubjects(subs);
    };
    loadData();
    
    const interval = setInterval(loadData, 30000); // Periodic refresh
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
    toast({ title: "Broadcast Transmitted", description: "Global notification sent to all Nexus units." });
  };

  const handleCreateSubject = async () => {
    if (!newSubject.name) return;
    const allowed = newSubject.allowedUserIds ? newSubject.allowedUserIds.split(',').map(s => s.trim()) : null;
    await addSubject({ ...newSubject, allowedUserIds: allowed });
    toast({ title: "Subject Registered", description: "Learning pathway activated." });
    setNewSubject({ name: "", description: "", allowedUserIds: "" });
    const subs = await getSubjects();
    setSubjects(subs);
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
          <TabsTrigger value="stream" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">
            <Activity className="size-4 mr-2" />
            Chat Stream
          </TabsTrigger>
          <TabsTrigger value="content" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">
            <VideoIcon className="size-4 mr-2" />
            Content CMS
          </TabsTrigger>
          <TabsTrigger value="learning" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">
            <GraduationCap className="size-4 mr-2" />
            Learning LMS
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">
            <Users className="size-4 mr-2" />
            Users & Keys
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">
            <Radio className="size-4 mr-2" />
            Broadcast Console
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stream" className="flex-1 flex gap-8 overflow-hidden outline-none">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {messages.filter(m => m.status === 'sent' || m.status === 'processing').length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center glass rounded-3xl opacity-50 border-dashed border-2 border-white/10">
                  <p>Queue is empty. Systems ready for signal.</p>
                </div>
              ) : (
                messages.filter(m => m.status === 'sent' || m.status === 'processing').map((msg) => (
                  <Card key={msg.id} className={cn(
                    "glass border-white/10 rounded-3xl overflow-hidden shadow-xl transition-all duration-300",
                    msg.status === 'processing' ? "border-indigo-500/50 scale-[1.01] bg-indigo-500/5" : "hover:border-indigo-500/30"
                  )}>
                    <CardHeader className="bg-white/5 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-indigo-400" />
                          <span className="text-sm font-bold text-white/90">{msg.userName} (@{msg.userId.slice(0, 6)})</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 mb-6 text-sm text-indigo-100/70">
                        {msg.text && <p className="mb-4 italic">"{msg.text}"</p>}
                      </div>
                      <Textarea 
                        placeholder="Neural response..."
                        className="bg-white/5 border-white/10 rounded-2xl h-32 focus-visible:ring-indigo-500 resize-none text-sm"
                        value={responses[msg.id] || ""}
                        onFocus={() => updateMessageStatus(msg.id, 'processing')}
                        onChange={(e) => setResponses({ ...responses, [msg.id]: e.target.value })}
                      />
                    </CardContent>
                    <CardFooter className="bg-white/5 pt-4 flex justify-end gap-3">
                      <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 rounded-xl" onClick={() => rejectMessage(msg.id)}>
                        Discard
                      </Button>
                      <Button 
                        className="bg-indigo-600 hover:bg-indigo-50 text-white rounded-xl shadow-lg px-6"
                        onClick={() => {
                          if (!responses[msg.id]?.trim()) return;
                          approveMessage(msg.id, responses[msg.id]);
                        }}
                        disabled={!responses[msg.id]?.trim()}
                      >
                        Transmit
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="content" className="flex-1 flex flex-col overflow-hidden outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="flex flex-col gap-6 overflow-hidden">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Clock className="size-5 text-amber-400" />
                Moderation Queue ({videos.filter(v => v.status === 'pending_review').length})
              </h3>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {videos.filter(v => v.status === 'pending_review').map((video) => (
                    <Card key={video.id} className="glass border-white/10 rounded-3xl overflow-hidden shadow-xl">
                      <div className="flex h-32">
                         <div className="w-40 relative">
                            <img src={video.thumbnail} className="size-full object-cover" />
                         </div>
                         <div className="flex-1 p-4 flex flex-col">
                            <h4 className="font-bold text-white line-clamp-1">{video.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">Uploader: {video.author}</p>
                         </div>
                      </div>
                      <div className="p-4 border-t border-white/5 flex gap-2">
                        <Button className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl" onClick={() => updateVideoStatus(video.id, 'published')}>Approve</Button>
                        <Button variant="ghost" className="flex-1 bg-red-500/10 text-red-400 rounded-xl" onClick={() => updateVideoStatus(video.id, 'rejected', "Policy violation")}>Reject</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="learning" className="flex-1 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <Card className="glass border-white/10 rounded-[2.5rem] p-8 h-fit">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <BookOpen className="size-5 text-indigo-400" />
                New Subject
              </h3>
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label>Name</Label>
                  <Input className="bg-white/5 border-white/10 rounded-xl h-11" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Description</Label>
                  <Textarea className="bg-white/5 border-white/10 rounded-xl" value={newSubject.description} onChange={e => setNewSubject({...newSubject, description: e.target.value})} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Allowed Node IDs (Empty for public)</Label>
                  <Input placeholder="user1, user2" className="bg-white/5 border-white/10 rounded-xl h-11" value={newSubject.allowedUserIds} onChange={e => setNewSubject({...newSubject, allowedUserIds: e.target.value})} />
                </div>
                <Button onClick={handleCreateSubject} className="w-full mt-4 h-12 bg-indigo-600 rounded-xl">Register Subject</Button>
              </div>
            </Card>

            <Card className="lg:col-span-2 glass border-white/10 rounded-[2.5rem] p-8">
               <h3 className="text-xl font-bold text-white mb-6">Subject Inventory</h3>
               <ScrollArea className="h-[400px]">
                 <div className="space-y-3">
                   {subjects.map(s => (
                     <div key={s.id} className="p-4 glass border border-white/5 rounded-2xl flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                         <div className="size-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                            {s.allowedUserIds ? <Lock className="size-4 text-amber-400" /> : <Globe className="size-4 text-green-400" />}
                         </div>
                         <div>
                           <p className="font-bold text-white">{s.name}</p>
                           <p className="text-[10px] text-muted-foreground">{s.description.slice(0, 60)}...</p>
                         </div>
                       </div>
                       <Button variant="ghost" size="icon" className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                         deleteSubject(s.id);
                         setSubjects(prev => prev.filter(x => x.id !== s.id));
                       }}>
                         <Trash2 className="size-4" />
                       </Button>
                     </div>
                   ))}
                 </div>
               </ScrollArea>
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
                  <Label>Display Name</Label>
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
                <Button 
                  onClick={() => {
                    addUser(newUser);
                    setNewUser({ name: "", username: "", password: "", role: "user" });
                    toast({ title: "User Registered", description: "Node activated." });
                  }}
                  className="w-full mt-4 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg"
                  disabled={!newUser.name || !newUser.username || !newUser.password}
                >
                  Confirm Registration
                </Button>
              </div>
            </Card>

            <Card className="lg:col-span-2 glass border-white/10 rounded-[2.5rem] p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Key className="size-5 text-indigo-400" />
                Active Neural Nodes
              </h3>
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 glass border-white/5 rounded-2xl group">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                          <User className="size-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{u.name}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-xs text-muted-foreground">@{u.username}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={u.id === 'admin-id'}
                        onClick={() => deleteUser(u.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="broadcast" className="flex-1 outline-none">
          <div className="max-w-2xl">
            <Card className="glass border-white/10 rounded-[2.5rem] p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <BellRing className="size-6 text-indigo-400" />
                    Neural Broadcast
                  </h3>
                  <p className="text-muted-foreground text-sm">Targeted transmission to all Nexus user units.</p>
                </div>
                
                <div className="grid gap-2">
                  <Label>Broadcast Title</Label>
                  <Input 
                    placeholder="e.g., System Maintenance" 
                    className="bg-white/5 border-white/10 rounded-xl"
                    value={broadcast.title}
                    onChange={(e) => setBroadcast({...broadcast, title: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Transmission Priority</Label>
                  <Select value={broadcast.priority} onValueChange={(v: Priority) => setBroadcast({...broadcast, priority: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="info">Information</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Message Body</Label>
                  <Textarea 
                    placeholder="Enter message details..." 
                    className="bg-white/5 border-white/10 rounded-2xl h-40 resize-none"
                    value={broadcast.body}
                    onChange={(e) => setBroadcast({...broadcast, body: e.target.value})}
                  />
                </div>

                <Button 
                  onClick={handleSendBroadcast}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-50 text-white rounded-xl shadow-lg shadow-indigo-500/20"
                  disabled={!broadcast.title || !broadcast.body}
                >
                  <Send className="size-4 mr-2" />
                  Initiate Broadcast
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
