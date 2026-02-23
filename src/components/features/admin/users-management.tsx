
"use client";

import React, { useState } from "react";
import { Users, Plus, DollarSign, ShieldCheck, Crown, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addUser, updateUserProfile, UserRole } from "@/lib/auth-store";
import { adjustFunds } from "@/lib/wallet-store";
import { cn } from "@/lib/utils";

interface UsersManagementProps {
  users: any[];
  currentUser: any;
  onRefresh: () => void;
}

export function UsersManagement({ users, currentUser, onRefresh }: UsersManagementProps) {
  const { toast } = useToast();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', role: 'free' as UserRole });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [creditTarget, setCreditTarget] = useState<any | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [isAddingCredits, setIsAddingCredits] = useState(false);

  // تعريف الرتب للعرض في القائمة
  const ROLE_OPTIONS: { id: UserRole, label: string, color: string }[] = [
    { id: 'founder', label: 'Founder (المؤسس)', color: 'text-amber-400' },
    { id: 'cofounder', label: 'Co-Founder (شريك مؤسس)', color: 'text-amber-200' },
    { id: 'admin', label: 'Admin (مدير نظام)', color: 'text-indigo-400' },
    { id: 'management', label: 'Management (إدارة)', color: 'text-blue-400' },
    { id: 'investor', label: 'Investor (مستثمر)', color: 'text-emerald-400' },
    { id: 'task_executor', label: 'Task Executor (منفذ مهام)', color: 'text-purple-400' },
    { id: 'free', label: 'Free (مجاني)', color: 'text-slate-400' },
    { id: 'external_user', label: 'External (مستخدم خارجي)', color: 'text-slate-500' },
  ];

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
        proTTSRemaining: 0,
        avatar_url: `https://picsum.photos/seed/${newUser.username}/100/100`,
        canManageCredits: false
      });
      toast({ title: "تم تسجيل العقدة", description: `المستخدم ${newUser.name} أصبح جزءاً من النظام.` });
      setNewUser({ name: '', username: '', role: 'free' });
      setIsAddUserOpen(false);
      onRefresh();
    } catch (err) {
      toast({ variant: "destructive", title: "فشل التسجيل" });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: UserRole) => {
    try {
      await updateUserProfile(userId, { role });
      toast({ title: "تمت إعادة المعايرة بنجاح" });
      onRefresh();
    } catch (err) {
      toast({ variant: "destructive", title: "فشل تحديث الرتبة" });
    }
  };

  const handleUpdateAuthority = async (userId: string, canManageCredits: boolean) => {
    try {
      await updateUserProfile(userId, { canManageCredits });
      toast({ 
        title: canManageCredits ? "تم منح السلطة المالية" : "تم سحب السلطة المالية",
        variant: canManageCredits ? "default" : "destructive"
      });
      onRefresh();
    } catch (err) {
      toast({ variant: "destructive", title: "فشل التحديث" });
    }
  };

  const handleAddCredits = async () => {
    if (!creditTarget || !creditAmount || isNaN(Number(creditAmount))) return;
    setIsAddingCredits(true);
    try {
      const success = await adjustFunds(creditTarget.id, Number(creditAmount), 'deposit');
      if (success) {
        toast({ title: "تم حقن الرصيد", description: `تمت إضافة ${creditAmount} Credits.` });
        setCreditTarget(null);
        setCreditAmount("");
        onRefresh();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "فشل الحقن المالي" });
    } finally {
      setIsAddingCredits(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-row-reverse">
        <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-row-reverse">
          <ShieldAlert className="text-amber-400" /> إدارة العقد والسيادة
        </h3>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 rounded-xl px-6 font-bold h-11"><Plus className="mr-2 size-4" /> إضافة مستخدم</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-950 border-white/10 rounded-[2rem] text-right">
            <DialogHeader><DialogTitle className="text-right">تسجيل عقدة جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Input dir="auto" className="bg-white/5 border-white/10 text-right" placeholder="الاسم الكامل" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              <Input dir="auto" className="bg-white/5 border-white/10 text-right" placeholder="معرف الدخول" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
              <div className="space-y-2">
                <Label className="text-right block">الرتبة الممنوحة</Label>
                <Select value={newUser.role} onValueChange={(v: any) => setNewUser({...newUser, role: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-950 text-white">
                    {ROLE_OPTIONS.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={handleCreateUser} className="w-full bg-indigo-600 rounded-xl">تفعيل العقدة</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => (
          <Card key={u.id} className="p-6 glass border-white/5 rounded-[2rem] flex flex-col gap-4 group hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-4 flex-row-reverse text-right">
                <div className="size-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-lg font-black text-indigo-400 border border-indigo-500/10 overflow-hidden">
                  {u.avatar_url ? <img src={u.avatar_url} className="size-full object-cover" /> : (u.name || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white flex items-center gap-2 justify-end">
                    {u.name}
                    {u.role === 'founder' && <Crown className="size-3 text-amber-400" />}
                  </p>
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
              {currentUser?.role === 'founder' && (
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between flex-row-reverse">
                  <div className="text-right">
                    <Label className="text-[10px] font-bold text-white flex items-center gap-2 justify-end">
                      سلطة الائتمان
                      <ShieldCheck className={cn("size-3", u.canManageCredits ? "text-emerald-400" : "text-muted-foreground")} />
                    </Label>
                    <p className="text-[8px] text-muted-foreground">تتيح إصدار الرصيد للآخرين</p>
                  </div>
                  <Switch 
                    checked={u.canManageCredits} 
                    onCheckedChange={(val) => handleUpdateAuthority(u.id, val)}
                    disabled={u.id === currentUser.id && u.role !== 'founder'}
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[9px] uppercase font-bold text-muted-foreground">رتبة العقدة السيادية</Label>
                <Select defaultValue={u.role} onValueChange={(v: any) => handleUpdateUserRole(u.id, v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-10 flex-row-reverse"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-950 border-white/10 text-white">
                    {ROLE_OPTIONS.map(opt => <SelectItem key={opt.id} value={opt.id} className={opt.color}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
