"use client";

import React, { useState } from "react";
import { Users, Plus, DollarSign, UserRole, UserClassification, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addUser, updateUserProfile } from "@/lib/auth-store";
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
  const [newUser, setNewUser] = useState({ name: '', username: '', role: 'user' as any });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [creditTarget, setCreditTarget] = useState<any | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [isAddingCredits, setIsAddingCredits] = useState(false);

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
      toast({ title: "تم تسجيل العقدة", description: `المستخدم ${newUser.name} أصبح جزءاً من النظام.` });
      setNewUser({ name: '', username: '', role: 'user' });
      setIsAddUserOpen(false);
      onRefresh();
    } catch (err) {
      toast({ variant: "destructive", title: "فشل التسجيل", description: "تعذر تسجيل العقدة في Firestore." });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: any) => {
    try {
      await updateUserProfile(userId, { role });
      toast({ title: "تمت إعادة المعايرة", description: "تم تحديث مستويات الوصول للعقدة." });
      onRefresh();
    } catch (err) {
      toast({ variant: "destructive", title: "فشل التحديث", description: "تعذر مزامنة تغيير الرتبة." });
    }
  };

  const handleUpdateClassification = async (userId: string, classification: any) => {
    try {
      await updateUserProfile(userId, { classification });
      toast({ title: "تم تحديث التصنيف", description: "تم تعديل النطاق العصبي للمستخدم." });
      onRefresh();
    } catch (err) {
      toast({ variant: "destructive", title: "فشل التحديث", description: "تعذر مزامنة التصنيف." });
    }
  };

  const handleUpdateProResponses = async (userId: string, amount: string) => {
    const num = parseInt(amount);
    if (isNaN(num)) return;
    try {
      await updateUserProfile(userId, { proResponsesRemaining: num });
      toast({ title: "مزامنة عصبية", description: "تم تخصيص ردود Pro بنجاح." });
      onRefresh();
    } catch (err) {
      toast({ variant: "destructive", title: "فشل التحديث", description: "فشل في المزامنة." });
    }
  };

  const handleAddCredits = async () => {
    if (!creditTarget || !creditAmount || isNaN(Number(creditAmount))) return;
    setIsAddingCredits(true);
    try {
      const success = await adjustFunds(creditTarget.id, Number(creditAmount), 'deposit');
      if (success) {
        toast({ title: "تم حقن الرصيد", description: `تمت إضافة ${creditAmount} Credits إلى @${creditTarget.username}` });
        setCreditTarget(null);
        setCreditAmount("");
        onRefresh();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "فشل الحقن", description: "رفضت عقدة الائتمان الطلب." });
    } finally {
      setIsAddingCredits(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-row-reverse">
        <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-row-reverse">
          <Users className="text-indigo-400" /> إدارة العقد والتصنيفات
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
                <Select defaultValue={u.classification || 'none'} onValueChange={(v) => handleUpdateClassification(u.id, v)}>
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
                <Select defaultValue={u.role} onValueChange={(v) => handleUpdateUserRole(u.id, v)}>
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