
"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Send, User, MessageSquare, History, ShieldAlert, Cpu, Activity, Edit3, Save, Radio, BellRing, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStoredMessages, approveMessage, rejectMessage, updateMessageStatus, editMessage, WizardMessage } from "@/lib/chat-store";
import { addNotification, Priority } from "@/lib/notification-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function AdminPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  
  // Broadcast state
  const [broadcast, setBroadcast] = useState({ title: "", body: "", priority: "info" as Priority });

  // Editing state
  const [editingMessage, setEditingMessage] = useState<WizardMessage | null>(null);
  const [editResponse, setEditResponse] = useState("");
  const [editReason, setEditReason] = useState("");

  useEffect(() => {
    const loadMessages = () => {
      setMessages(getStoredMessages());
    };
    loadMessages();
    window.addEventListener('storage-update', loadMessages);
    return () => window.removeEventListener('storage-update', loadMessages);
  }, []);

  const pendingMessages = messages.filter(m => m.status === 'sent' || m.status === 'processing');
  const historyMessages = messages.filter(m => m.status === 'replied' || m.status === 'rejected').reverse();

  const handleFocus = (id: string) => {
    updateMessageStatus(id, 'processing');
  };

  const handleApprove = (id: string) => {
    const text = responses[id];
    if (!text?.trim()) return;
    approveMessage(id, text);
    setResponses(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
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

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-8">
        <h2 className="text-3xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
          <ShieldAlert className="text-indigo-400" />
          Neural Console
        </h2>
        <p className="text-muted-foreground mt-1">Global administration and neural synchronization controls.</p>
      </div>

      <Tabs defaultValue="stream" className="flex-1 flex flex-col">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 w-fit">
          <TabsTrigger value="stream" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">
            <Activity className="size-4 mr-2" />
            Incoming Stream
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">
            <Radio className="size-4 mr-2" />
            Broadcast Console
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-6 data-[state=active]:bg-indigo-600">
            <History className="size-4 mr-2" />
            History Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stream" className="flex-1 flex gap-8 overflow-hidden outline-none">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {pendingMessages.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center glass rounded-3xl opacity-50 border-dashed border-2 border-white/10">
                  <Cpu className="size-12 mb-4" />
                  <p>Queue is empty. Systems ready for signal.</p>
                </div>
              ) : (
                pendingMessages.map((msg) => (
                  <Card key={msg.id} className={cn(
                    "glass border-white/10 rounded-3xl overflow-hidden shadow-xl transition-all duration-300",
                    msg.status === 'processing' ? "border-indigo-500/50 scale-[1.01] bg-indigo-500/5" : "hover:border-indigo-500/30"
                  )}>
                    <CardHeader className="bg-white/5 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-indigo-400" />
                          <span className="text-sm font-bold text-white/90">User Interface Terminal</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 mb-6 italic text-sm text-indigo-100/70">
                        "{msg.text}"
                      </div>
                      <Textarea 
                        placeholder="Neural response..."
                        className="bg-white/5 border-white/10 rounded-2xl h-32 focus-visible:ring-indigo-500 resize-none text-sm"
                        value={responses[msg.id] || ""}
                        onFocus={() => handleFocus(msg.id)}
                        onChange={(e) => setResponses({ ...responses, [msg.id]: e.target.value })}
                      />
                    </CardContent>
                    <CardFooter className="bg-white/5 pt-4 flex justify-end gap-3">
                      <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 rounded-xl" onClick={() => rejectMessage(msg.id)}>
                        Discard
                      </Button>
                      <Button 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg px-6"
                        onClick={() => handleApprove(msg.id)}
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
                      <SelectItem value="info" className="text-blue-400"><div className="flex items-center gap-2"><Info className="size-4" /> Information</div></SelectItem>
                      <SelectItem value="warning" className="text-amber-400"><div className="flex items-center gap-2"><AlertTriangle className="size-4" /> Warning</div></SelectItem>
                      <SelectItem value="critical" className="text-red-400"><div className="flex items-center gap-2"><ShieldAlert className="size-4" /> Critical Alert</div></SelectItem>
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
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20"
                  disabled={!broadcast.title || !broadcast.body}
                >
                  <Send className="size-4 mr-2" />
                  Initiate Broadcast
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 outline-none">
           <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historyMessages.map((msg) => (
                  <div key={msg.id} className="group p-5 rounded-3xl glass border-white/5 text-sm transition-all hover:border-indigo-500/30 relative">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className={msg.status === 'replied' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                        {msg.status === 'replied' ? 'TRANSMITTED' : 'REJECTED'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground uppercase">{new Date(msg.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-white/80 font-medium mb-3 line-clamp-2">Q: {msg.text}</p>
                    {msg.response && (
                      <div className="p-3 bg-black/20 rounded-xl border border-white/5 mb-3 italic text-indigo-100/60 line-clamp-3">
                        A: {msg.response}
                      </div>
                    )}
                    {msg.status === 'replied' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full rounded-xl hover:bg-indigo-500/10 text-indigo-400 h-9"
                        onClick={() => {
                          setEditingMessage(msg);
                          setEditResponse(msg.response || "");
                          setEditReason("");
                        }}
                      >
                        <Edit3 className="size-3.5 mr-2" />
                        Correct Signal
                      </Button>
                    )}
                  </div>
                ))}
              </div>
           </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Edit Modal (shared from previous implementation) */}
      <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Edit3 className="size-5 text-indigo-400" />
              Correct Neural Response
            </DialogTitle>
            <DialogDescription className="text-indigo-200/50">
              Modifying an already transmitted signal. The user will be notified of the adjustment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Original Request</Label>
              <div className="p-3 bg-white/5 rounded-xl text-sm italic border border-white/5 text-indigo-100/60">
                "{editingMessage?.text}"
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Updated Response</Label>
              <Textarea 
                className="bg-white/5 border-white/10 rounded-2xl h-32 focus-visible:ring-indigo-500 resize-none text-sm"
                value={editResponse}
                onChange={(e) => setEditResponse(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reason for Correction</Label>
              <Input 
                placeholder="e.g., Better Explanation, Clarification..."
                className="bg-white/5 border-white/10 rounded-xl text-sm h-11"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setEditingMessage(null)}>Cancel</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg px-8"
              onClick={() => {
                if (!editingMessage || !editResponse.trim() || !editReason.trim()) return;
                editMessage(editingMessage.id, editResponse, editReason);
                setEditingMessage(null);
                toast({ title: "Correction Logged", description: "Signal updated and user notified." });
              }}
              disabled={!editResponse.trim() || !editReason.trim()}
            >
              <Save className="mr-2 size-4" />
              Save & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
