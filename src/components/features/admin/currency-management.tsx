"use client";

import React, { useState, useEffect } from "react";
import {
    Coins, Plus, Trash2, CheckCircle2, XCircle, Loader2,
    ShieldCheck, AlertTriangle, ArrowUpCircle, Lock, Unlock, Crown, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    save_CURRENCIES, saveCurrencyCode, getCurrencyDef,
    getConditionLibrary, addConditionTemplate, removeConditionTemplate,
    getUserUnfreezeRules, activateConditionForUser, updateUnfreezeRuleStatus, removeUserUnfreezeRule,
    getEscalationRequests, createEscalationRequest, resolveEscalationRequest,
    UnfreezeConditionTemplate, UserUnfreezeRule, EscalationRequest, ConditionType
} from "@/lib/currency-store";

interface CurrencyManagementProps {
    users: any[];
    currentUser: any;
    onRefresh: () => void;
}

/**
 * [STABILITY_ANCHOR: CURRENCY_MANAGEMENT_V1.0]
 * إدارة العملات وشروط فك التجميد - مكتبة الشروط + تطبيق لكل موظف + مسار التصعيد.
 */
export function CurrencyManagement({ users, currentUser, onRefresh }: CurrencyManagementProps) {
    const { toast } = useToast();
    const isFounder = currentUser?.role === 'founder';

    // Condition Library
    const [conditions, setConditions] = useState<UnfreezeConditionTemplate[]>([]);
    const [isAddConditionOpen, setIsAddConditionOpen] = useState(false);
    const [newCondition, setNewCondition] = useState({ label: '', labelAr: '', description: '', type: 'custom' as ConditionType, threshold: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Per-user rules
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [userRules, setUserRules] = useState<UserUnfreezeRule[]>([]);
    const [isLoadingRules, setIsLoadingRules] = useState(false);
    const [activateCurrency, setActivateCurrency] = useState<saveCurrencyCode>('EGC_save');
    const [activateConditionId, setActivateConditionId] = useState('');

    // Escalation
    const [escalations, setEscalations] = useState<EscalationRequest[]>([]);
    const [newEscalation, setNewEscalation] = useState({ description: '', suggestedCondition: '' });

    useEffect(() => {
        loadConditions();
        loadEscalations();
    }, []);

    const loadConditions = async () => {
        const data = await getConditionLibrary();
        setConditions(data);
    };

    const loadEscalations = async () => {
        const data = await getEscalationRequests();
        setEscalations(data);
    };

    const loadUserRules = async (userId: string) => {
        setIsLoadingRules(true);
        const rules = await getUserUnfreezeRules(userId);
        setUserRules(rules);
        setIsLoadingRules(false);
    };

    const handleAddCondition = async () => {
        if (!newCondition.label || !newCondition.labelAr) return;
        setIsSubmitting(true);
        try {
            await addConditionTemplate({ ...newCondition, createdBy: currentUser.id });
            toast({ title: "تمت الإضافة", description: "تم إضافة الشرط لمكتبة الشروط." });
            setNewCondition({ label: '', labelAr: '', description: '', type: 'custom', threshold: 0 });
            setIsAddConditionOpen(false);
            loadConditions();
        } catch (e) {
            toast({ variant: "destructive", title: "فشل الإضافة" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleActivateForUser = async () => {
        if (!selectedUser || !activateConditionId) return;
        const cond = conditions.find(c => c.id === activateConditionId);
        if (!cond) return;
        setIsSubmitting(true);
        try {
            await activateConditionForUser(
                selectedUser.id, activateCurrency, activateConditionId,
                cond.labelAr || cond.label, currentUser.id
            );
            toast({ title: "تم التفعيل", description: `تم تفعيل شرط "${cond.labelAr}" لـ @${selectedUser.username}.` });
            loadUserRules(selectedUser.id);
            setActivateConditionId('');
        } catch (e) {
            toast({ variant: "destructive", title: "فشل التفعيل" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRuleAction = async (ruleId: string, action: 'fulfilled' | 'waived' | 'delete') => {
        if (!selectedUser) return;
        try {
            if (action === 'delete') {
                await removeUserUnfreezeRule(selectedUser.id, ruleId);
            } else {
                await updateUnfreezeRuleStatus(selectedUser.id, ruleId, action);
            }
            toast({ title: "تم التحديث" });
            loadUserRules(selectedUser.id);
        } catch (e) {
            toast({ variant: "destructive", title: "فشل" });
        }
    };

    const handleEscalation = async () => {
        if (!newEscalation.description) return;
        setIsSubmitting(true);
        try {
            await createEscalationRequest({
                description: newEscalation.description,
                suggestedCondition: newEscalation.suggestedCondition,
                requestedBy: currentUser.id,
                requestedByName: currentUser.name
            });
            toast({ title: "تم الإرسال", description: "تم رفع الطلب للمؤسس." });
            setNewEscalation({ description: '', suggestedCondition: '' });
            loadEscalations();
        } catch (e) {
            toast({ variant: "destructive", title: "فشل" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolveEscalation = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
        try {
            await resolveEscalationRequest(id, status, notes);
            toast({ title: status === 'approved' ? "تمت الموافقة" : "تم الرفض" });
            loadEscalations();
        } catch (e) {
            toast({ variant: "destructive", title: "فشل" });
        }
    };

    const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
        tasks_completed: 'إكمال مهام',
        sales_target: 'هدف مبيعات',
        time_served: 'مدة خدمة',
        approval_required: 'يتطلب موافقة',
        custom: 'مخصص'
    };

    const pendingEscalations = escalations.filter(e => e.status === 'pending_founder');

    return (
        <div className="space-y-8 text-right">
            <Tabs defaultValue="users" className="w-full">
                <TabsList className="bg-white/5 border-white/10 p-1 flex-row-reverse mb-8 gap-1">
                    <TabsTrigger value="users" className="rounded-lg gap-2 flex-row-reverse font-bold">
                        <ShieldCheck className="size-4" /> إدارة الشروط لكل موظف
                    </TabsTrigger>
                    <TabsTrigger value="library" className="rounded-lg gap-2 flex-row-reverse font-bold">
                        <Coins className="size-4" /> مكتبة الشروط
                    </TabsTrigger>
                    <TabsTrigger value="escalation" className="rounded-lg gap-2 flex-row-reverse font-bold">
                        <ArrowUpCircle className="size-4" /> التصعيد
                        {pendingEscalations.length > 0 && <Badge className="bg-red-500 h-4 w-4 p-0 flex items-center justify-center text-[10px]">{pendingEscalations.length}</Badge>}
                    </TabsTrigger>
                </TabsList>

                {/* ===== Tab 1: Per-User Rules ===== */}
                <TabsContent value="users">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* User list */}
                        <Card className="glass border-white/5 rounded-[2.5rem] p-6 lg:col-span-1">
                            <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4 text-right">اختر موظف</h3>
                            <ScrollArea className="h-[600px]">
                                <div className="space-y-2">
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => { setSelectedUser(u); loadUserRules(u.id); }}
                                            className={cn(
                                                "w-full p-4 rounded-2xl flex items-center gap-3 flex-row-reverse text-right transition-all",
                                                selectedUser?.id === u.id ? "bg-primary/20 border border-primary/30" : "bg-white/5 border border-white/5 hover:bg-white/10"
                                            )}
                                        >
                                            <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-sm font-bold text-indigo-400 border border-indigo-500/10 overflow-hidden shrink-0">
                                                {u.avatar_url ? <img src={u.avatar_url} className="size-full object-cover" alt="" /> : (u.name || "?").charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white text-sm truncate flex items-center gap-1 justify-end">
                                                    {u.name}
                                                    {u.role === 'founder' && <Crown className="size-3 text-amber-400 shrink-0" />}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-mono">@{u.username}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </Card>

                        {/* User rules panel */}
                        <Card className="glass border-white/5 rounded-[2.5rem] p-8 lg:col-span-2">
                            {!selectedUser ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                                    <ShieldCheck className="size-16 mb-4" />
                                    <p className="text-lg font-bold">اختر موظف لعرض وإدارة شروط فك التجميد</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between flex-row-reverse">
                                        <div className="text-right">
                                            <h3 className="text-xl font-bold text-white">شروط فك التجميد لـ {selectedUser.name}</h3>
                                            <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                                        </div>
                                        <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/20">
                                            {userRules.filter(r => r.status === 'pending').length} شرط معلق
                                        </Badge>
                                    </div>

                                    {/* Add condition to user */}
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                        <Label className="text-[10px] font-black text-primary uppercase tracking-widest">تفعيل شرط جديد</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <Select value={activateCurrency} onValueChange={(v: any) => setActivateCurrency(v)}>
                                                <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse"><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                                    {save_CURRENCIES.map(c => (
                                                        <SelectItem key={c.code} value={c.code}>{c.icon} {c.nameAr}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select value={activateConditionId} onValueChange={setActivateConditionId}>
                                                <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse"><SelectValue placeholder="اختر شرط..." /></SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                                    {conditions.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.labelAr}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                onClick={handleActivateForUser}
                                                disabled={!activateConditionId || isSubmitting}
                                                className="bg-primary rounded-xl font-bold"
                                            >
                                                <Plus className="size-4 mr-2" /> تفعيل
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Rules list */}
                                    {isLoadingRules ? (
                                        <div className="py-10 flex justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
                                    ) : userRules.length === 0 ? (
                                        <div className="py-16 text-center opacity-30 border-2 border-dashed border-white/5 rounded-2xl">
                                            <Lock className="size-10 mx-auto mb-3" />
                                            <p className="font-bold">لا توجد شروط مفعلة لهذا الموظف</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[350px]">
                                            <div className="space-y-3">
                                                {userRules.map(rule => {
                                                    const currDef = getCurrencyDef(rule.currencyCode);
                                                    return (
                                                        <div key={rule.id} className={cn(
                                                            "p-5 rounded-2xl border flex items-center justify-between flex-row-reverse group transition-all",
                                                            rule.status === 'pending' ? "bg-amber-500/5 border-amber-500/10" :
                                                                rule.status === 'fulfilled' ? "bg-green-500/5 border-green-500/10" :
                                                                    "bg-white/5 border-white/5"
                                                        )}>
                                                            <div className="text-right flex-1">
                                                                <div className="flex items-center gap-2 justify-end mb-1">
                                                                    <span className="text-sm">{currDef?.icon}</span>
                                                                    <Badge variant="outline" className="text-[8px] border-white/10">{currDef?.nameAr}</Badge>
                                                                    <Badge className={cn(
                                                                        "text-[8px]",
                                                                        rule.status === 'pending' ? "bg-amber-500/20 text-amber-400" :
                                                                            rule.status === 'fulfilled' ? "bg-green-500/20 text-green-400" :
                                                                                "bg-slate-500/20 text-slate-400"
                                                                    )}>
                                                                        {rule.status === 'pending' ? 'معلق' : rule.status === 'fulfilled' ? 'محقق' : 'متنازل'}
                                                                    </Badge>
                                                                </div>
                                                                <p className="font-bold text-white text-sm">{rule.conditionLabel}</p>
                                                                <p className="text-[9px] text-muted-foreground mt-1">
                                                                    فُعّل بواسطة: {rule.activatedBy.substring(0, 8)} • {new Date(rule.activatedAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            {rule.status === 'pending' && (
                                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button size="icon" className="size-8 bg-green-600 rounded-lg" onClick={() => handleRuleAction(rule.id, 'fulfilled')}>
                                                                        <CheckCircle2 className="size-4" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="size-8 text-slate-400 rounded-lg" onClick={() => handleRuleAction(rule.id, 'waived')}>
                                                                        <Unlock className="size-4" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="size-8 text-red-400 rounded-lg" onClick={() => handleRuleAction(rule.id, 'delete')}>
                                                                        <Trash2 className="size-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>

                {/* ===== Tab 2: Condition Library ===== */}
                <TabsContent value="library">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center flex-row-reverse">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-row-reverse">
                                <Coins className="text-amber-400" /> مكتبة شروط فك التجميد
                            </h3>
                            {isFounder && (
                                <Dialog open={isAddConditionOpen} onOpenChange={setIsAddConditionOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-amber-600 rounded-xl px-6 font-bold h-11"><Plus className="mr-2 size-4" /> إضافة شرط</Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-slate-950 border-white/10 rounded-[2rem] text-right p-8">
                                        <DialogHeader><DialogTitle className="text-right text-xl font-bold">شرط جديد لمكتبة فك التجميد</DialogTitle></DialogHeader>
                                        <DialogDescription className="text-muted-foreground text-right text-sm">هذا الشرط سيكون متاح لجميع المديرين لتفعيله على الموظفين.</DialogDescription>
                                        <div className="space-y-4 py-4">
                                            <Input dir="auto" className="bg-white/5 border-white/10 text-right" placeholder="اسم الشرط (English)" value={newCondition.label} onChange={e => setNewCondition({ ...newCondition, label: e.target.value })} />
                                            <Input dir="auto" className="bg-white/5 border-white/10 text-right" placeholder="اسم الشرط (عربي)" value={newCondition.labelAr} onChange={e => setNewCondition({ ...newCondition, labelAr: e.target.value })} />
                                            <Textarea dir="auto" className="bg-white/5 border-white/10 text-right" placeholder="وصف تفصيلي للشرط..." value={newCondition.description} onChange={e => setNewCondition({ ...newCondition, description: e.target.value })} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">نوع الشرط</Label>
                                                    <Select value={newCondition.type} onValueChange={(v: any) => setNewCondition({ ...newCondition, type: v })}>
                                                        <SelectTrigger className="bg-white/5 border-white/10 flex-row-reverse"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="bg-slate-900 text-white">
                                                            {Object.entries(CONDITION_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">الحد الرقمي (اختياري)</Label>
                                                    <Input type="number" className="bg-white/5 border-white/10 text-center" placeholder="0" value={newCondition.threshold || ''} onChange={e => setNewCondition({ ...newCondition, threshold: Number(e.target.value) })} />
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleAddCondition} disabled={isSubmitting || !newCondition.label} className="w-full bg-amber-600 rounded-xl font-bold">
                                                {isSubmitting ? <Loader2 className="animate-spin size-4" /> : "إضافة للمكتبة"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        {!isFounder && (
                            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3 flex-row-reverse">
                                <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-300">المؤسس فقط يمكنه إضافة أو حذف شروط من المكتبة. يمكنك تفعيل الشروط الموجودة على الموظفين من تبويب "إدارة الشروط".</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {conditions.length === 0 ? (
                                <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-white/5 rounded-3xl">
                                    <Coins className="size-12 mx-auto mb-4" />
                                    <p className="font-bold">لا توجد شروط في المكتبة</p>
                                </div>
                            ) : (
                                conditions.map(c => (
                                    <Card key={c.id} className="p-6 glass border-white/5 rounded-[2rem] group hover:border-amber-500/20 transition-all relative">
                                        <div className="flex justify-between items-start flex-row-reverse mb-4">
                                            <Badge variant="outline" className="text-[8px] border-white/10 uppercase">{CONDITION_TYPE_LABELS[c.type]}</Badge>
                                            {isFounder && (
                                                <Button variant="ghost" size="icon" className="size-7 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeConditionTemplate(c.id).then(loadConditions)}>
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-white text-right mb-1">{c.labelAr}</h4>
                                        <p className="text-[10px] text-muted-foreground text-right mb-3">{c.label}</p>
                                        {c.description && <p className="text-xs text-slate-400 text-right italic">"{c.description}"</p>}
                                        {c.threshold ? (
                                            <Badge className="mt-3 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">الحد: {c.threshold}</Badge>
                                        ) : null}
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* ===== Tab 3: Escalation ===== */}
                <TabsContent value="escalation">
                    <div className="space-y-8">
                        {/* Send escalation (admin only, not founder) */}
                        {!isFounder && (
                            <Card className="p-8 glass border-indigo-500/10 rounded-[2.5rem] space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-3 justify-end flex-row-reverse">
                                    <Send className="text-indigo-400" /> رفع حالة جديدة للمؤسس
                                </h3>
                                <Textarea dir="auto" className="bg-white/5 border-white/10 text-right" placeholder="وصف الحالة الجديدة التي ظهرت..." value={newEscalation.description} onChange={e => setNewEscalation({ ...newEscalation, description: e.target.value })} />
                                <Input dir="auto" className="bg-white/5 border-white/10 text-right" placeholder="الشرط المقترح لهذه الحالة (اختياري)" value={newEscalation.suggestedCondition} onChange={e => setNewEscalation({ ...newEscalation, suggestedCondition: e.target.value })} />
                                <Button onClick={handleEscalation} disabled={isSubmitting || !newEscalation.description} className="bg-indigo-600 rounded-xl font-bold w-full h-12">
                                    {isSubmitting ? <Loader2 className="animate-spin size-4" /> : <><ArrowUpCircle className="size-4 mr-2" /> رفع للمؤسس</>}
                                </Button>
                            </Card>
                        )}

                        {/* Escalation queue */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3 justify-end flex-row-reverse">
                                <Crown className="text-amber-400" /> طلبات التصعيد
                            </h3>
                            {escalations.length === 0 ? (
                                <div className="py-16 text-center opacity-30 border-2 border-dashed border-white/5 rounded-3xl">
                                    <ArrowUpCircle className="size-12 mx-auto mb-4" />
                                    <p className="font-bold">لا توجد طلبات تصعيد</p>
                                </div>
                            ) : (
                                escalations.map(esc => (
                                    <Card key={esc.id} className={cn(
                                        "p-6 glass rounded-[2rem] space-y-4",
                                        esc.status === 'pending_founder' ? "border-amber-500/20" :
                                            esc.status === 'approved' ? "border-green-500/10" : "border-red-500/10"
                                    )}>
                                        <div className="flex justify-between items-start flex-row-reverse">
                                            <div className="text-right">
                                                <p className="font-bold text-white">{esc.description}</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">بواسطة: {esc.requestedByName} • {new Date(esc.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <Badge className={cn(
                                                "text-[9px]",
                                                esc.status === 'pending_founder' ? "bg-amber-500/20 text-amber-400" :
                                                    esc.status === 'approved' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                            )}>
                                                {esc.status === 'pending_founder' ? 'قيد مراجعة المؤسس' : esc.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
                                            </Badge>
                                        </div>
                                        {esc.suggestedCondition && (
                                            <p className="text-xs text-indigo-400 italic text-right">الشرط المقترح: "{esc.suggestedCondition}"</p>
                                        )}
                                        {esc.founderNotes && (
                                            <p className="text-xs text-slate-400 text-right bg-white/5 p-3 rounded-xl">ملاحظات المؤسس: {esc.founderNotes}</p>
                                        )}
                                        {isFounder && esc.status === 'pending_founder' && (
                                            <div className="flex gap-3 flex-row-reverse pt-4 border-t border-white/5">
                                                <Button className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl font-bold" onClick={() => handleResolveEscalation(esc.id, 'approved')}>
                                                    <CheckCircle2 className="size-4 mr-2" /> موافقة وإضافة
                                                </Button>
                                                <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 rounded-xl px-8" onClick={() => handleResolveEscalation(esc.id, 'rejected')}>
                                                    <XCircle className="size-4 mr-2" /> رفض
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
