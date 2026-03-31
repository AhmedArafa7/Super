'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { FeatureHeader } from "@/components/ui/feature-header";
import { SecurityBadge } from "@/components/ui/security-badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Send, CheckCircle2, Upload, Link as LinkIcon, User, Mail, FileText, Loader2, AlertTriangle, Droplets as LucideDrop } from 'lucide-react';
import { findUserByUsername, submitDrop } from '@/lib/drop-store';

export const runtime = 'edge';

export default function DropPage() {
    const params = useParams();
    const username = params?.username as string;

    const [targetUser, setTargetUser] = useState<{ id: string; name: string; avatar_url?: string; dropBoxEnabled?: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [senderName, setSenderName] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [title, setTitle] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [fileType, setFileType] = useState('link');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (username) loadUser();
    }, [username]);

    const loadUser = async () => {
        setIsLoading(true);
        const user = await findUserByUsername(username);
        if (!user || !user.dropBoxEnabled) {
            setNotFound(true);
        } else {
            setTargetUser(user);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetUser || !senderName || !title || !fileUrl) return;

        setIsSubmitting(true);
        try {
            await submitDrop({
                targetUserId: targetUser.id,
                targetUsername: username,
                senderName,
                senderEmail: senderEmail || undefined,
                title,
                fileUrl,
                fileType,
                message: message || undefined
            });
            setIsSuccess(true);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
                <Loader2 className="size-10 text-indigo-400 animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-6 text-right">
                <GlassCard className="max-w-md w-full space-y-6">
                    <div className="size-20 mx-auto rounded-3xl bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle className="size-10 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-black text-white">صندوق غير متاح</h1>
                    <p className="text-muted-foreground text-sm leading-relaxed" dir="rtl">
                        هذا الرابط غير نشط حالياً. إما أن اسم المستخدم غير موجود أو أن صاحب الحساب لم يُفعِّل صندوق الإسقاط الخاص به بعد.
                    </p>
                </GlassCard>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-6 text-right">
                <GlassCard className="max-w-md w-full space-y-6 animate-in zoom-in-95 duration-500 border-emerald-500/20">
                    <div className="size-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="size-12 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white">تم الإرسال بنجاح!</h1>
                    <p className="text-muted-foreground text-sm leading-relaxed" dir="rtl">
                        تم إيصال ملفك إلى <span className="text-emerald-400 font-bold">{targetUser?.name}</span> بنجاح.
                        <br />سيقوم بمراجعته والتحكم في ظهوره.
                    </p>
                    <SecurityBadge className="mx-auto" />
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6">
             <div className="max-w-lg w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <GlassCard className="space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="relative mx-auto w-fit">
                            <img
                                src={targetUser?.avatar_url || 'https://picsum.photos/seed/drop/200/200'}
                                alt={targetUser?.name}
                                className="size-20 rounded-3xl object-cover border-2 border-indigo-500/30 shadow-2xl shadow-indigo-500/20"
                            />
                            <div className="absolute -bottom-2 -right-2 size-7 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
                                <Upload className="size-3.5 text-white" />
                            </div>
                        </div>
                        <FeatureHeader 
                            title={`إرسال ملف إلى ${targetUser?.name}`}
                            description={`@${username} • Nexus Secure Drop`}
                            className="mb-0 block text-center"
                            titleClassName="text-2xl justify-center"
                        />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/80 flex items-center gap-2 justify-end mb-1"><User className="size-3" /> اسمك</label>
                            <input
                                type="text"
                                required
                                value={senderName}
                                onChange={e => setSenderName(e.target.value)}
                                placeholder="أحمد محمد"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none transition-colors text-sm text-right"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/80 flex items-center gap-2 justify-end mb-1"><Mail className="size-3" /> البريد (اختياري)</label>
                            <input
                                type="email"
                                value={senderEmail}
                                onChange={e => setSenderEmail(e.target.value)}
                                placeholder="example@mail.com"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none transition-colors text-sm text-right"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/80 flex items-center gap-2 justify-end mb-1"><FileText className="size-3" /> عنوان الملف</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="مستند التصميم النهائي"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none transition-colors text-sm text-right"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/80 flex items-center gap-2 justify-end mb-1"><LinkIcon className="size-3" /> رابط الملف</label>
                            <input
                                type="url"
                                required
                                value={fileUrl}
                                onChange={e => setFileUrl(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none transition-colors text-sm text-right"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/80 block text-right mb-2">نوع الملف</label>
                            <div className="flex gap-2 flex-wrap justify-end">
                                {[
                                    { id: 'link', label: 'رابط' },
                                    { id: 'document', label: 'مستند' },
                                    { id: 'video', label: 'فيديو' },
                                    { id: 'image', label: 'صورة' },
                                    { id: 'archive', label: 'أرشيف' },
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setFileType(opt.id)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${fileType === opt.id
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                            : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/80 block text-right mb-1">رسالة (اختياري)</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={3}
                                placeholder="ملاحظات إضافية..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none transition-colors text-sm resize-none text-right"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !senderName || !title || !fileUrl}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-bold text-lg shadow-2xl shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                            {isSubmitting ? 'جاري الإرسال...' : 'إرسال الملف بأمان'}
                        </button>
                    </form>

                    <div className="pt-4 flex justify-center">
                        <SecurityBadge />
                    </div>
                </GlassCard>

                <div className="text-center text-[10px] text-white/20 font-bold uppercase tracking-widest">
                    Nexus Platform • Secure Drop Protocol v1.0
                </div>
            </div>
        </div>
    );
}
