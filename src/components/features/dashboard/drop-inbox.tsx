"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Inbox, CheckCircle2, XCircle, ExternalLink, Loader2, Copy,
    ShieldCheck, Lock, Zap, FileText, Video, Image as ImageIcon, Archive, Link as LinkIcon, Mail, User
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useWalletStore } from "@/lib/wallet-store";
import {
    hasDropBoxEnabled, enableDropBox, getPendingDrops, getAllDrops,
    approveDrop, rejectDrop, DropItem, DROP_COST
} from "@/lib/drop-store";

/**
 * [STABILITY_ANCHOR: DROP_INBOX_V1.0]
 * صندوق الوارد السري - يعرض الملفات المرفقة ويتحكم في الموافقة/الرفض.
 */
export function DropInbox() {
    const { user } = useAuth();
    const { toast } = useToast();
    const adjustFunds = useWalletStore(s => s.adjustFunds);
    const wallet = useWalletStore(s => s.wallet);

    const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
    const [isActivating, setIsActivating] = useState(false);
    const [drops, setDrops] = useState<DropItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (user?.id) checkStatus();
    }, [user?.id]);

    const checkStatus = async () => {
        if (!user?.id) return;
        const enabled = await hasDropBoxEnabled(user.id);
        setIsEnabled(enabled);
        if (enabled) loadDrops();
        else setIsLoading(false);
    };

    const loadDrops = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const items = showAll ? await getAllDrops(user.id) : await getPendingDrops(user.id);
            setDrops(items);
        } catch (e) { }
        setIsLoading(false);
    };

    useEffect(() => {
        if (isEnabled) loadDrops();
    }, [showAll]);

    const handleActivate = async () => {
        if (!user?.id) return;
        setIsActivating(true);
        try {
            const success = await adjustFunds(user.id, DROP_COST, 'withdrawal', 'EGC');
            if (!success) {
                toast({ variant: "destructive", title: "رصيد غير كافٍ", description: `تحتاج ${DROP_COST} EGC لتفعيل صندوق الإسقاط السري.` });
                setIsActivating(false);
                return;
            }
            await enableDropBox(user.id);
            setIsEnabled(true);
            toast({ title: "تم التفعيل بنجاح! 🎉", description: "صندوق الإسقاط السري الخاص بك جاهز للاستخدام." });
            loadDrops();
        } catch (err) {
            toast({ variant: "destructive", title: "فشل التفعيل" });
        }
        setIsActivating(false);
    };

    const handleApprove = async (id: string) => {
        await approveDrop(id);
        toast({ title: "تم القبول" });
        loadDrops();
    };

    const handleReject = async (id: string) => {
        if (!confirm("هل أنت متأكد من رفض هذا الملف؟ سيتم حذفه نهائياً.")) return;
        await rejectDrop(id);
        toast({ title: "تم الرفض والحذف" });
        loadDrops();
    };

    const copyDropLink = () => {
        const link = `${window.location.origin}/drop/${user?.username}`;
        navigator.clipboard.writeText(link);
        toast({ title: "تم نسخ الرابط!", description: link });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="size-4 text-indigo-400" />;
            case 'image': return <ImageIcon className="size-4 text-emerald-400" />;
            case 'document': return <FileText className="size-4 text-blue-400" />;
            case 'archive': return <Archive className="size-4 text-amber-400" />;
            default: return <LinkIcon className="size-4 text-slate-400" />;
        }
    };

    // شاشة التفعيل المدفوع
    if (isEnabled === false) {
        const egcBalance = wallet?.balances?.['EGC'] || 0;
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-8 text-center animate-in fade-in duration-700">
                <div className="relative">
                    <div className="size-28 rounded-[3rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-2xl shadow-indigo-500/10">
                        <Lock className="size-14 text-indigo-400" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 size-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg">
                        <Zap className="size-5 text-white" />
                    </div>
                </div>

                <div className="space-y-3 max-w-md">
                    <h3 className="text-3xl font-black text-white">صندوق الإسقاط السري</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed" dir="rtl">
                        احصل على رابط فريد يمكنك مشاركته مع أي شخص ليقوم بإرسال ملفاته إليك بسرية تامة.
                        لن يرى أحد ما أرسله الآخرون، وأنت وحدك من يتحكم في قبول أو رفض كل ملف.
                    </p>
                </div>

                <Card className="glass border-white/10 rounded-[2rem] p-8 max-w-sm w-full space-y-6">
                    <div className="flex items-center justify-between flex-row-reverse">
                        <span className="text-sm font-bold text-white">تكلفة التفعيل</span>
                        <Badge className="bg-indigo-600 text-white px-4 py-1 text-lg font-black rounded-xl">{DROP_COST} EGC</Badge>
                    </div>
                    <div className="flex items-center justify-between flex-row-reverse text-xs text-muted-foreground">
                        <span>رصيدك الحالي</span>
                        <span className={egcBalance >= DROP_COST ? 'text-emerald-400' : 'text-red-400'}>{egcBalance} EGC</span>
                    </div>
                    <ul className="space-y-2 text-right text-xs text-white/60" dir="rtl">
                        <li className="flex items-center gap-2 flex-row-reverse"><ShieldCheck className="size-3 text-emerald-400 shrink-0" /> رابط خاص بك للأبد</li>
                        <li className="flex items-center gap-2 flex-row-reverse"><ShieldCheck className="size-3 text-emerald-400 shrink-0" /> سرية تامة بين الراسل وأنت</li>
                        <li className="flex items-center gap-2 flex-row-reverse"><ShieldCheck className="size-3 text-emerald-400 shrink-0" /> تحكم كامل في الموافقة والرفض</li>
                        <li className="flex items-center gap-2 flex-row-reverse"><ShieldCheck className="size-3 text-emerald-400 shrink-0" /> جاهز لتخزين تيليجرام مستقبلاً</li>
                    </ul>
                    <Button
                        onClick={handleActivate}
                        disabled={isActivating || egcBalance < DROP_COST}
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all"
                    >
                        {isActivating ? <Loader2 className="mr-2 animate-spin" /> : <Zap className="mr-2" />}
                        {isActivating ? 'جاري التفعيل...' : 'تفعيل الآن'}
                    </Button>
                </Card>
            </div>
        );
    }

    if (isEnabled === null || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="size-10 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">جاري فتح القبو...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between flex-row-reverse">
                <div className="flex items-center gap-3 flex-row-reverse">
                    <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                        <Inbox className="size-6 text-indigo-400" />
                    </div>
                    <div className="text-right">
                        <h3 className="text-lg font-black text-white">صندوق الوارد السري</h3>
                        <p className="text-[10px] text-muted-foreground">{drops.length} ملف {showAll ? '(الكل)' : '(معلق)'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)} className="rounded-xl border-white/10 text-xs h-9">
                        {showAll ? 'المعلق فقط' : 'عرض الكل'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyDropLink} className="rounded-xl border-indigo-500/30 text-indigo-400 text-xs h-9 gap-2">
                        <Copy className="size-3" /> نسخ رابطك
                    </Button>
                </div>
            </div>

            {/* Items */}
            {drops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30 space-y-4">
                    <Inbox className="size-16" />
                    <p className="text-sm font-bold">لا توجد ملفات {showAll ? '' : 'معلقة'} حالياً</p>
                    <p className="text-xs">شارك رابطك مع الآخرين ليبدأوا بإرسال ملفاتهم إليك</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {drops.map(drop => (
                        <Card
                            key={drop.id}
                            className="glass border-white/5 hover:border-indigo-500/20 rounded-2xl p-5 flex items-start gap-4 flex-row-reverse transition-all group"
                        >
                            <div className="size-11 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                                {getTypeIcon(drop.fileType)}
                            </div>
                            <div className="flex-1 min-w-0 text-right space-y-1">
                                <p className="font-bold text-white text-sm truncate" dir="auto">{drop.title}</p>
                                <div className="flex items-center gap-3 flex-row-reverse text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1 flex-row-reverse"><User className="size-2.5" /> {drop.senderName}</span>
                                    {drop.senderEmail && <span className="flex items-center gap-1 flex-row-reverse"><Mail className="size-2.5" /> {drop.senderEmail}</span>}
                                    <span>{new Date(drop.createdAt).toLocaleDateString('ar-EG')}</span>
                                </div>
                                {drop.message && <p className="text-xs text-white/40 mt-1 truncate" dir="auto">{drop.message}</p>}
                                <Badge
                                    className={`text-[8px] mt-1 ${drop.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                            drop.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                'bg-red-500/20 text-red-400'
                                        }`}
                                >
                                    {drop.status === 'pending' ? 'قيد المراجعة' : drop.status === 'approved' ? 'تم القبول' : 'مرفوض'}
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => window.open(drop.fileUrl, '_blank')}
                                    className="size-9 rounded-xl hover:bg-indigo-500/10"
                                    title="فتح الملف"
                                >
                                    <ExternalLink className="size-4 text-indigo-400" />
                                </Button>
                                {drop.status === 'pending' && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleApprove(drop.id)}
                                            className="size-9 rounded-xl hover:bg-emerald-500/10"
                                            title="موافقة"
                                        >
                                            <CheckCircle2 className="size-4 text-emerald-400" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleReject(drop.id)}
                                            className="size-9 rounded-xl hover:bg-red-500/10"
                                            title="رفض"
                                        >
                                            <XCircle className="size-4 text-red-400" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
