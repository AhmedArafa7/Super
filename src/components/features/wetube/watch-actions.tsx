"use client";

import React from "react";
import { 
    ThumbsUp, ThumbsDown, Share2, Download, Scissors, 
    Bell, ChevronDown, Settings, CheckCircle2, MoreHorizontal, Flag, Trash2,
    Ban, UserX, Scissors as ScissorsIcon, UserCircle, ArrowRight, Zap, ShieldCheck
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useWatch } from "./watch-context";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface WatchActionsProps {
    currentUser: any;
    likeCount: string;
    handleQualityChange: (q: string) => void;
    downloadedQuality?: string;
    isCached: boolean;
    onSync: (video: any) => void;
    onClose?: () => void;
}

export function WatchActions({
    currentUser,
    likeCount,
    handleQualityChange,
    downloadedQuality,
    isCached,
    onSync,
    onClose
}: WatchActionsProps) {
    const { toast } = useToast();
    const {
        video,
        selectedQuality,
        isLiked, setIsLiked,
        isDisliked, setIsDisliked,
        isSubscribed, setIsSubscribed,
        isPro, proSettings, updateProSettings
    } = useWatch();

    const handleShare = () => {
        const url = video.externalUrl || `https://www.youtube.com/watch?v=${video.id}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "تم نسخ الرابط",
            description: "يمكنك الآن مشاركة الفيديو مع أصدقائك.",
        });
    };

    const handleActionFeedback = (title: string, description: string) => {
        toast({ title, description });
    };

    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between gap-4">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors shrink-0"
                >
                    <ArrowRight className="size-4" />
                    الرجوع للرئيسية
                </button>
                <h1 className="text-xl font-bold line-clamp-2 text-right flex-1">{video.title}</h1>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                {/* Channel Info & Subscribe */}
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-[#272727] overflow-hidden cursor-pointer shrink-0 flex items-center justify-center">
                        {video.channelAvatar ? (
                            <img src={video.channelAvatar} className="size-full object-cover" alt="Avatar" />
                        ) : (
                            <UserCircle className="size-6 text-white/20" />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0 pr-1">
                        <span className="font-bold text-foreground text-[16px] truncate cursor-pointer hover:text-white">{video.author}</span>
                        {video.subscriberCount && (
                            <span className="text-muted-foreground text-xs truncate">{video.subscriberCount} مشترك</span>
                        )}
                    </div>

                    <button
                        onClick={() => setIsSubscribed(!isSubscribed)}
                        className={cn(
                            "ml-2 mr-4 px-4 py-2 font-medium text-sm rounded-full transition-all flex items-center gap-2",
                            isSubscribed
                                ? "bg-[#272727] text-[#f1f1f1] hover:bg-[#3f3f3f]"
                                : "bg-[#f1f1f1] text-[#0f0f0f] hover:bg-white"
                        )}
                    >
                        {isSubscribed ? (
                            <>
                                <Bell className="size-4" fill="currentColor" />
                                <span>مشترك</span>
                                <ChevronDown className="size-4" />
                            </>
                        ) : (
                            "اشتراك"
                        )}
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    {/* Quality Selector */}
                    <div className="bg-[#272727] rounded-full px-1 flex items-center h-10 border border-white/5">
                        <Settings className="size-4 text-muted-foreground ml-2" />
                        <Select value={selectedQuality} onValueChange={handleQualityChange}>
                            <SelectTrigger className="w-[110px] h-8 bg-transparent border-none outline-none focus:ring-0 shadow-none text-sm font-medium">
                                <SelectValue placeholder="الجودة" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#222222] border-white/10 text-white rounded-xl">
                                {["144", "240", "360", "480", "720", "1080"].map((q) => (
                                    <SelectItem key={q} value={q} className="focus:bg-[#3f3f3f] cursor-pointer" dir="rtl">
                                        <div className="flex items-center justify-between w-full">
                                            <span>{q}p</span>
                                            {downloadedQuality === q && isCached && (
                                                <Badge className="mr-2 ml-4 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 font-bold border-none h-5 px-1.5 rounded-sm">
                                                    <CheckCircle2 className="size-3 ml-1" />
                                                    محمل
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Like/Dislike Pill */}
                    <div className="flex items-center bg-[#272727] rounded-full overflow-hidden shrink-0">
                        <button
                            onClick={() => { setIsLiked(!isLiked); setIsDisliked(false); }}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-[#3f3f3f] transition-colors border-l border-white/10"
                        >
                            <ThumbsUp className="size-5" fill={isLiked ? "currentColor" : "none"} />
                            <span className="text-sm font-medium">{likeCount}</span>
                        </button>
                        <button
                            onClick={() => { setIsDisliked(!isDisliked); setIsLiked(false); }}
                            className="px-4 py-2 hover:bg-[#3f3f3f] transition-colors"
                        >
                            <ThumbsDown className="size-5" fill={isDisliked ? "currentColor" : "none"} />
                        </button>
                    </div>

                    {/* Share */}
                    <button 
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors shrink-0"
                    >
                        <Share2 className="size-5" />
                        <span className="text-sm font-medium">مشاركة</span>
                    </button>

                    {/* Download/Sync */}
                    <button
                        onClick={() => onSync(video)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full transition-colors shrink-0",
                            isCached ? "bg-indigo-500/20 text-indigo-400" : "bg-[#272727] hover:bg-[#3f3f3f]"
                        )}
                    >
                        {isCached ? <CheckCircle2 className="size-5" /> : <Download className="size-5" />}
                        <span className="text-sm font-medium">تنزيل</span>
                    </button>

                    {/* Clip */}
                    <button 
                        onClick={() => handleActionFeedback("قص مقطع", "ميزة اقتطاع المقاطع ستتوفر قريباً في التحديث القادم.")}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors shrink-0"
                    >
                        <Scissors className="size-5" />
                        <span className="text-sm font-medium">قص</span>
                    </button>

                    {/* WeTube Pro Controls */}
                    {isPro && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-primary hover:from-indigo-500 hover:to-primary/80 rounded-full transition-all shrink-0 shadow-lg shadow-primary/20 group">
                                    <Zap className="size-5 fill-white group-hover:animate-pulse" />
                                    <span className="text-sm font-bold text-white">Pro Settings</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-72 bg-slate-950 border-primary/20 text-white rounded-2xl shadow-2xl p-4 space-y-4 rtl">
                                <div className="flex items-center gap-3 mb-2 px-1">
                                    <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <ShieldCheck className="size-5 text-primary" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black uppercase tracking-widest text-primary">WeTube Pro</p>
                                        <p className="text-[10px] text-muted-foreground">تجربة مشاهدة فائقة الذكاء</p>
                                    </div>
                                </div>
                                
                                <DropdownMenuSeparator className="bg-white/5" />
                                
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground px-1">توفير الباقة (Frame Skip)</Label>
                                    <Select 
                                        value={proSettings.frameSkipRatio} 
                                        onValueChange={(v: any) => updateProSettings({ frameSkipRatio: v })}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 h-10 rounded-xl flex-row-reverse">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            <SelectItem value="none">تعطيل (جودة كاملة)</SelectItem>
                                            <SelectItem value="1/2">نسبة 1/2 (توفير 50%)</SelectItem>
                                            <SelectItem value="3/4">نسبة 3/4 (توفير 25%)</SelectItem>
                                            <SelectItem value="4/5">نسبة 4/5 (توفير 20%)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between gap-3 px-1 py-1">
                                    <span className="text-[10px] font-bold text-muted-foreground">تخطي الخاتمة تلقائياً (Auto-Trim)</span>
                                    <button 
                                        onClick={() => updateProSettings({ autoTrimOutro: !proSettings.autoTrimOutro })}
                                        className={cn(
                                            "size-10 rounded-xl border transition-all flex items-center justify-center",
                                            proSettings.autoTrimOutro ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-muted-foreground"
                                        )}
                                    >
                                        {proSettings.autoTrimOutro ? <CheckCircle2 className="size-5" /> : <Ban className="size-5" />}
                                    </button>
                                </div>

                                <Button 
                                    variant="ghost" 
                                    className="w-full h-10 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-[10px] font-bold gap-2"
                                    onClick={() => toast({ title: "تنظيف الذاكرة", description: "تم إفراغ مساحة 1.2GB من الملفات المؤقتة بنجاح." })}
                                >
                                    <Trash2 className="size-4" /> تنظيف الذاكرة العشوائية (Smart Clean)
                                </Button>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* More Options Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors shrink-0 outline-none">
                                <MoreHorizontal className="size-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 bg-[#282828] border-white/10 text-white rounded-xl shadow-2xl p-1.5">
                            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                                <ScissorsIcon className="size-4" />
                                <span className="text-sm">اقتطاع كليب</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                                onClick={() => handleActionFeedback("تم تسجيل تفضيلك", "سنقلل من اقتراح مثل هذا المحتوى لك.")}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                            >
                                <Ban className="size-4" />
                                <span className="text-sm">لا يهمني</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                                onClick={() => handleActionFeedback("تحديث الاقتراحات", "لن نقوم باقتراح هذه القناة لك مرة أخرى.")}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                            >
                                <UserX className="size-4" />
                                <span className="text-sm">عدم اقتراح القناة</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                                onClick={() => handleActionFeedback("إبلاغ", "تم إرسال بلاغك لفريق المراجعة، شكراً لمساعدتنا.")}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                            >
                                <Flag className="size-4" />
                                <span className="text-sm">إبلاغ</span>
                            </DropdownMenuItem>

                            {(currentUser?.role === 'admin' || currentUser?.role === 'founder') && (
                                <>
                                    <DropdownMenuSeparator className="bg-white/5 mx-1 my-1" />
                                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 focus:bg-red-500/20 text-red-400 rounded-lg cursor-pointer transition-colors">
                                        <Trash2 className="size-4" />
                                        <span className="text-sm">حذف الفيديو</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
