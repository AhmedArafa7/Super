
"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, ShieldAlert, Send, RefreshCcw, CheckCircle2, 
  Video, Users, MessageCircle, Zap, XCircle, BookOpen, Trash2, 
  Database, Wallet, Radio, Tag, CreditCard, Play, Plus, UserPlus, 
  Shield, DollarSign, Clock, ArrowUpRight, AlertTriangle, Lock, Unlock,
  FileVideo, Repeat, UserCog, BrainCircuit, LayoutGrid, GraduationCap,
  ShoppingBag
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
import { getStoredMessages, approveMessage, rejectMessage, WizardMessage } from "@/lib/chat-store";
import { getStoredUsers, User, addUser, UserRole, UserClassification, updateUserProfile } from "@/lib/auth-store";
import { getStoredVideos, updateVideoStatus, Video as VideoType, deleteVideo } from "@/lib/video-store";
import { getSubjects, deleteSubject, Subject } from "@/lib/learning-store";
import { getAllOffersAdmin, MarketOffer } from "@/lib/market-store";
import { getAllTransactionsAdmin, Transaction, adjustFunds } from "@/lib/wallet-store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: ADMIN_NEURAL_CONSOLE_V5.5]
 * لوحة التحكم المركزية - تم استعادة كافة المزايا التاريخية مع نظام التصنيفات الجديد.
 */
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

  // UI State
  const [responses, setResponses] = useState<Record<string, string>>({});
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
    const interval = setInterval(loadData, 60000); 
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
    <div className="flex flex-col items-center justify-center py-20 opacity-40 border-2 border-dashed border-white/5 rounded-[2rem] text-center w-full">
      {React.createElement(icon, { className: "size-12 mb-4" })}
      <p className="text-lg font-bold">{title}</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen gap-8 animate-in fade-in duration-700 font-sans">
      <div className="flex justify-between items-center flex-row-reverse">
        <div className="text-right">
          <h2 className="text-4xl font-headline font-bold text-white flex items-center gap-4 justify-end">
            Admin Neural Console
            <ShieldAlert className="text-indigo-400 size-10" />
          </h2>
          <p className="text-muted-foreground mt-1 text-base">نظام الرقابة والتحكم المركزي - إدارة الرتب والتصنيفات السيادية.</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading} className="size-12 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
          <RefreshCcw className={cn("size-5 text-indigo-400", isLoading && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="users" className="flex-1 flex flex-col">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 w-fit flex-wrap flex-row-reverse self-end h-auto gap-1">
          <TabsTrigger value="users" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-indigo-600"><Users className="size-4" /> العقد البشرية</TabsTrigger>
          <TabsTrigger value="chat" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-indigo-600"><MessageSquare className="size-4" /> مراجعة الدردشة</TabsTrigger>
          <TabsTrigger value="media" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-indigo-600"><Video className="size-4" /> الرقابة البصرية</TabsTrigger>
          <TabsTrigger value="market" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-indigo-600"><ShoppingBag className="size-4" /> المتجر</TabsTrigger>
          <TabsTrigger value="finances" className="rounded-xl px-6 py-2.5 font-bold gap-2 flex-row-reverse data-[state=active]:bg-indigo-600"><Wallet className="size-4" /> السجل المالي</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="outline-none space-y-8">
          <div className="flex justify-between items-center flex-row-reverse">
            <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-row-reverse"><Users className="text-indigo-400" /> إدارة العقد والتصنيفات</h3>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 rounded-xl px-6 font-bold h-11"><Plus className="mr-2 size-4" /> إضافة مستخدم</Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-950 border-white/10 rounded-[2rem] text-right">
                <DialogHeader><DialogTitle className="text-right">تسجيل عقدة جديدة</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <Input dir="auto" className="bg-white/5 border-white/10 text-right" placeholder="الاسم الكامل" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                  <Input dir="auto" className="bg-white/5 border-white/10 text-right" placeholder="معرف الدخول" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                </div>
                <DialogFooter><Button onClick={handleCreateUser} className="w-full bg-indigo-600 rounded-xl">تفعيل</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((u) => (
              <Card key={u.id} className="p-6 glass border-white/5 rounded-[2rem] flex flex-col gap-4 group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between flex-row-reverse">
                  <div className="flex items-center gap-4 flex-row-reverse text-right">
                    <div className="size-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-lg font-black text-indigo-400 border border-indigo-500/10">
                      {(u.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">@{u.username}</p>
                    </div>
                  </div>
                  {currentUser?.canManageCredits && (
                    <Button variant="ghost" size="icon" className="size-9 bg-emerald-500/10 rounded-full text-emerald-400" onClick={() => setCreditTarget(u)}>
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
                
                <div className="pt-4 border-t border-white/5 space-y-4 text-right">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">تصنيف الوصول</Label>
                    <Select defaultValue={u.classification || 'none'} onValueChange={(v: UserClassification) => handleUpdateClassification(u.id, v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-10 flex-row-reverse"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-950 border-white/10 text-white">
                        <SelectItem value="none">بدون تصنيف</SelectItem>
                        <SelectItem value="freelancer">موظف حر (NexusAI)</SelectItem>
                        <SelectItem value="investor">مستثمر (+1 Pro)</SelectItem>
                        <SelectItem value="manager">إداري (+3 Pro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(u.classification === 'investor' || u.classification === 'manager') && (
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-indigo-400">رصيد ردود Pro المتبقي</Label>
                      <Input 
                        type="number" 
                        className="bg-white/5 border-white/10 h-10 text-center font-bold" 
                        defaultValue={u.proResponsesRemaining || 0}
                        onBlur={(e) => handleUpdateProResponses(u.id, e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-row-reverse pt-2">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">صلاحية النخاع</Label>
                    <Select defaultValue={u.role} onValueChange={(v: UserRole) => handleUpdateUserRole(u.id, v)}>
                      <SelectTrigger className="h-8 w-28 bg-white/5 border-white/10 text-[9px] font-bold flex-row-reverse"><SelectValue /></SelectTrigger>
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

        <TabsContent value="chat" className="outline-none space-y-6">
          {messages.length === 0 ? renderEmptyState(MessageSquare, "لا توجد رسائل للمراجعة") : (
            messages.map((m) => (
              <Card key={m.id} className="glass border-white/10 rounded-[2rem] p-6 space-y-6">
                <div className="flex justify-between items-center flex-row-reverse">
                  <div className="flex items-center gap-4 flex-row-reverse text-right">
                    <div className="size-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 font-bold">{(m.userName || "?").charAt(0)}</div>
                    <div>
                      <p className="font-bold text-sm text-white">@{m.userName}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">{new Date(m.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-green-500/20 text-green-400">{m.status}</Badge>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2 text-right">
                    <Label className="text-[9px] text-muted-foreground uppercase px-1">الرسالة الأصلية</Label>
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-xs italic text-slate-300">"{m.originalText}"</div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Label className="text-[9px] text-indigo-400 uppercase px-1">الرد المقترح</Label>
                    <Textarea dir="auto" value={responses[m.id] ?? m.response || ""} onChange={(e) => setResponses({...responses, [m.id]: e.target.value})} className="bg-white/5 border-white/10 rounded-xl text-xs min-h-[100px] text-right" />
                  </div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <Button className="flex-1 bg-indigo-600 rounded-xl font-bold h-11" onClick={async () => { await approveMessage(m.id, m.userId, responses[m.id] ?? m.response ?? ""); toast({title: "تم الحفظ"}); loadData(); }}>اعتماد</Button>
                  <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 rounded-xl h-11" onClick={async () => { await rejectMessage(m.id, m.userId); loadData(); }}>رفض</Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="media" className="outline-none space-y-6">
          {videos.length === 0 ? renderEmptyState(Video, "لا يوجد محتوى بصري حالياً") : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map(v => (
                <Card key={v.id} className="glass border-white/5 rounded-[2rem] overflow-hidden">
                  <div className="aspect-video relative bg-slate-900">
                    <img src={v.thumbnail} className="size-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center"><Play className="text-white size-8" /></div>
                  </div>
                  <div className="p-6 text-right space-y-4">
                    <h4 className="font-bold text-white line-clamp-1">{v.title}</h4>
                    <div className="flex items-center justify-between flex-row-reverse">
                      <Badge variant="outline" className={cn("text-[9px]", v.status === 'published' ? "text-green-400" : "text-amber-400")}>{v.status}</Badge>
                      <p className="text-10px text-muted-foreground">بواسطة: @{v.author}</p>
                    </div>
                    <div className="flex gap-2 flex-row-reverse">
                      <Button className="flex-1 bg-indigo-600 h-9 rounded-lg text-xs" onClick={async () => { await updateVideoStatus(v.id, 'published'); loadData(); }}>نشر</Button>
                      <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 h-9 rounded-lg" onClick={async () => { await deleteVideo(v.id); loadData(); }}><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="market" className="outline-none space-y-6">
          {offers.length === 0 ? renderEmptyState(Tag, "لا توجد مفاوضات تجارية نشطة") : (
            <div className="space-y-4">
              {offers.map(o => (
                <Card key={o.id} className="p-6 glass border-white/10 rounded-[2rem] flex items-center justify-between flex-row-reverse">
                  <div className="text-right space-y-1">
                    <p className="font-bold text-white">{o.itemTitle}</p>
                    <p className="text-[10px] text-muted-foreground">من: @{o.buyerName} &rarr; إلى: @{o.sellerId.substring(0,8)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-indigo-500">{o.type === 'price' ? `${o.value} Credits` : 'Neural Swap'}</Badge>
                    <Badge variant="outline" className="border-white/10 uppercase text-[9px]">{o.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="finances" className="outline-none space-y-6">
          <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden">
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-white/5">
                {allTransactions.map(tx => (
                  <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all flex-row-reverse">
                    <div className="text-right">
                      <p className="font-bold text-white text-sm">{tx.description}</p>
                      <p className="text-[9px] text-muted-foreground uppercase mt-1">المستخدم: {tx.userId || "System"} • {new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="text-left">
                      <p className={cn("font-black text-lg", tx.amount > 0 ? "text-green-400" : "text-red-400")}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </p>
                      <Badge variant="outline" className="text-[8px] border-white/10">{tx.type.toUpperCase()}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Credit Injection Dialog */}
      <Dialog open={!!creditTarget} onOpenChange={(open) => !open && setCreditTarget(null)}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-[2rem] p-8 sm:max-w-sm text-right">
          <DialogHeader><DialogTitle className="text-xl font-bold flex items-center justify-end gap-2">حقن رصيد ائتماني <DollarSign className="text-emerald-400" /></DialogTitle></DialogHeader>
          <div className="py-6 space-y-4">
            <Label className="px-1 text-[10px] font-bold text-muted-foreground uppercase">كمية الرصيد لـ @{creditTarget?.username}</Label>
            <Input type="number" placeholder="0.00" className="h-12 bg-white/5 border-white/10 rounded-xl text-center text-xl font-black text-emerald-400" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={handleAddCredits} disabled={isAddingCredits || !creditAmount} className="w-full h-12 bg-emerald-600 rounded-xl font-bold">تأكيد الحق المالي</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
