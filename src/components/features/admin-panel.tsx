
"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Send, User, MessageSquare, History, ShieldAlert, Cpu, Activity, Edit3, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoredMessages, approveMessage, rejectMessage, updateMessageStatus, editMessage, WizardMessage } from "@/lib/chat-store";
import { cn } from "@/lib/utils";

export function AdminPanel() {
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  
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

  const handleReject = (id: string) => {
    rejectMessage(id);
  };

  const openEditModal = (msg: WizardMessage) => {
    setEditingMessage(msg);
    setEditResponse(msg.response || "");
    setEditReason("");
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !editResponse.trim() || !editReason.trim()) return;
    editMessage(editingMessage.id, editResponse, editReason);
    setEditingMessage(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
              <Activity className="text-indigo-400 animate-pulse" />
              Incoming Stream
            </h2>
            <p className="text-muted-foreground mt-1">Real-time neural queue management.</p>
          </div>
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">
            {pendingMessages.length} In Stream
          </Badge>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {pendingMessages.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center glass rounded-3xl opacity-50 border-dashed border-2 border-white/10">
                <Cpu className="size-12 mb-4" />
                <p>Queue is empty. Waiting for incoming neural signals.</p>
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
                        <div className="size-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                          <User className="size-4 text-indigo-400" />
                        </div>
                        <span className="text-sm font-bold text-white/90">User Interface Terminal</span>
                        {msg.status === 'processing' && (
                          <Badge className="bg-indigo-500 text-[10px] h-4">PROCESSING</Badge>
                        )}
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
                      placeholder="Craft a neural response..."
                      className="bg-white/5 border-white/10 rounded-2xl h-32 focus-visible:ring-indigo-500 resize-none text-sm"
                      value={responses[msg.id] || ""}
                      onFocus={() => handleFocus(msg.id)}
                      onChange={(e) => setResponses({ ...responses, [msg.id]: e.target.value })}
                    />
                  </CardContent>
                  <CardFooter className="bg-white/5 pt-4 flex justify-end gap-3">
                    <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 rounded-xl" onClick={() => handleReject(msg.id)}>
                      <X className="mr-2 size-4" />
                      Discard
                    </Button>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20"
                      onClick={() => handleApprove(msg.id)}
                      disabled={!responses[msg.id]?.trim()}
                    >
                      <Send className="mr-2 size-4" />
                      Transmit Response
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden border-l border-white/5 pl-8">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="size-5 text-muted-foreground" />
          Processed History
        </h3>
        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {historyMessages.map((msg) => (
              <div key={msg.id} className="group p-4 rounded-2xl bg-white/5 border border-white/5 text-xs transition-all hover:bg-white/10 relative">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={msg.status === 'replied' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {msg.status === 'replied' ? 'TRANSMITTED' : 'REJECTED'}
                    </Badge>
                    {msg.isEdited && <Badge variant="outline" className="text-[9px] border-indigo-500/50 text-indigo-400 uppercase">Edited</Badge>}
                  </div>
                  <span className="text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-white/60 line-clamp-1 mb-1">Q: {msg.text}</p>
                {msg.response && <p className="text-indigo-400/80 line-clamp-2 italic">A: {msg.response}</p>}
                
                {msg.status === 'replied' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity size-7"
                    onClick={() => openEditModal(msg)}
                  >
                    <Edit3 className="size-3.5 text-indigo-400" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingMessage} onOpenChange={(open) => !open && setEditingMessage(null)}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-headline font-bold">
              <Edit3 className="size-5 text-indigo-400" />
              Correct Neural Response
            </DialogTitle>
            <DialogDescription className="text-indigo-200/50">
              Modifying an already transmitted signal. The user will be notified of the update.
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
              <Label htmlFor="edit-response" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Updated Response</Label>
              <Textarea 
                id="edit-response"
                placeholder="Enter the corrected response..."
                className="bg-white/5 border-white/10 rounded-2xl h-32 focus-visible:ring-indigo-500 resize-none text-sm"
                value={editResponse}
                onChange={(e) => setEditResponse(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-reason" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reason for Correction</Label>
              <Input 
                id="edit-reason"
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 px-8"
              onClick={handleSaveEdit}
              disabled={!editResponse.trim() || !editReason.trim()}
            >
              <Save className="mr-2 size-4" />
              Save & Notify User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
