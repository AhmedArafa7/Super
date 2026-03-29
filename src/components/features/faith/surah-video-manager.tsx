"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Plus, Loader2, Youtube, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { getStoredVideos, addVideo, Video as StoreVideo } from "@/lib/video-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractYouTubeId } from "@/lib/youtube-utils";

interface SurahVideoManagerProps {
    surahId: number;
    surahName: string;
}

export function SurahVideoManager({ surahId, surahName }: SurahVideoManagerProps) {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [videos, setVideos] = useState<StoreVideo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Suggestion Form State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ytLink, setYtLink] = useState("");
    const [customTitle, setCustomTitle] = useState("");

    const loadVideos = async () => {
        setIsLoading(true);
        try {
            const allVideos = await getStoredVideos();
            const surahVideos = allVideos.filter(v => v.relatedSurah === surahId && v.status === 'published');
            setVideos(surahVideos);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadVideos();
        }
    }, [isOpen]);

    const handleSuggest = async () => {
        if (!ytLink) return;
        const ytId = extractYouTubeId(ytLink);
        
        if (!ytId) {
            toast({ variant: "destructive", title: "رابط غير صالح", description: "يرجى إدخال رابط يوتيوب صحيح." });
            return;
        }

        if (!currentUser) {
            toast({ variant: "destructive", title: "تنبيه", description: "يجب تسجيل الدخول لاقتراح المقاطع." });
            return;
        }

        setIsSubmitting(true);
        try {
            const finalTitle = customTitle.trim() || `تلاوة مقترحة: سورة ${surahName}`;
            const ytThumbnail = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
            
            await addVideo({
                title: finalTitle,
                thumbnail: ytThumbnail,
                author: currentUser.name || "مستخدم",
                authorId: currentUser.id,
                time: "0:00",
                status: 'pending_review',
                visibility: 'public',
                allowedUserIds: [],
                uploaderRole: 'user',
                source: 'youtube',
                externalUrl: ytLink,
                relatedSurah: surahId
            });

            toast({ title: "تم الإرسال!", description: "تم إرسال اقتراحك للإدارة للمراجعة والموافقة." });
            setYtLink("");
            setCustomTitle("");
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "حدث خطأ", description: "فشل إرسال الاقتراح المؤقت." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    className="size-14 rounded-2xl border border-white/10 text-emerald-400 hover:bg-emerald-500/10 shadow-lg transition-all hover:border-emerald-500/50 flex flex-col items-center justify-center p-0"
                >
                    <Video className="size-5 mb-1" />
                    <span className="text-[8px] font-bold">فيديوهات</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-slate-950 border-white/10 text-white rounded-3xl p-6 shadow-2xl overflow-hidden" dir="rtl">
                <div className="flex items-center gap-3 mb-6 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                    <Video className="size-8 text-emerald-400" />
                    <div>
                        <h2 className="text-xl font-bold text-emerald-50">فيديوهات سورة {surahName}</h2>
                        <p className="text-[10px] text-emerald-400/80 uppercase mt-1 tracking-widest">Surah Media Attachment</p>
                    </div>
                </div>

                <Tabs defaultValue="list" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl mb-6 p-1">
                        <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:font-bold transition-all data-[state=active]:shadow-lg">
                            قائمة الفيديوهات المعتمدة
                        </TabsTrigger>
                        <TabsTrigger value="suggest" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:font-bold transition-all data-[state=active]:shadow-lg">
                            <Plus className="size-4 ml-2" /> اقتراح فيديو للسورة
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="outline-none space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="size-8 animate-spin text-emerald-500/50" />
                                <span className="text-sm font-bold opacity-60">جاري استدعاء البيانات...</span>
                            </div>
                        ) : videos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                                <Video className="size-12 opacity-20 mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">لا توجد مساهمات حتى الآن</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mb-6">كن أول من يساهم باقتراح تلاوات أو دروس تفسير مرتبطة بهذه السورة الكريمة.</p>
                                <Button 
                                    variant="outline" 
                                    className="rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                    onClick={() => document.querySelector('button[value="suggest"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}))}
                                >
                                    بادر باقتراح فيديو
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {videos.map(v => (
                                    <div key={v.id} className="flex gap-4 p-3 bg-white/5 border border-white/10 hover:border-emerald-500/30 rounded-2xl transition-all group">
                                        <div className="w-32 aspect-video rounded-xl overflow-hidden bg-black shrink-0 relative">
                                            <img src={v.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded md text-[9px] font-mono font-bold text-white tracking-wider">{v.time}</div>
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <h4 className="font-bold text-sm text-white line-clamp-2 mb-1 group-hover:text-emerald-300 transition-colors">{v.title}</h4>
                                            <div className="flex items-center gap-2 mt-auto">
                                                <div className="size-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[8px] font-black text-emerald-400 px-1 py-1 truncate max-w-[100px] border border-emerald-500/20">{v.author}</div>
                                                <CheckCircle2 className="size-3 text-emerald-500 opacity-60" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="suggest" className="outline-none">
                        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 space-y-6">
                            <div className="text-center space-y-2 mb-4">
                                <Youtube className="size-10 text-indigo-400 mx-auto" strokeWidth={1.5} />
                                <h3 className="text-lg font-bold text-white">إضافة مرجع يوتيوب جديد</h3>
                                <p className="text-xs text-indigo-300/80 max-w-[280px] mx-auto">سيتم إرسال الفيديو للإدارة لمراجعته للتأكد من خلوه من المخالفات לפני نشره بالصفحة.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-white/70 block px-1">رابط الفيديو (يوتيوب فقط)</Label>
                                    <Input 
                                        dir="ltr"
                                        placeholder="https://youtu.be/..." 
                                        className="h-12 bg-black/40 border-indigo-500/20 text-indigo-300 rounded-xl focus-visible:ring-indigo-500"
                                        value={ytLink}
                                        onChange={e => setYtLink(e.target.value)}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-xs text-white/70 block px-1">وصف الفيديو (اختياري)</Label>
                                    <Input 
                                        placeholder={`تلاوة خاشعة سورة ${surahName}...`} 
                                        className="h-12 bg-black/40 border-indigo-500/20 text-indigo-100 rounded-xl focus-visible:ring-indigo-500"
                                        value={customTitle}
                                        onChange={e => setCustomTitle(e.target.value)}
                                        dir="rtl"
                                    />
                                </div>
                            </div>

                            <Button 
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-2 text-md rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                                disabled={isSubmitting || !ytLink}
                                onClick={handleSuggest}
                            >
                                {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
                                {isSubmitting ? "جاري الإرسال للمراجعة..." : "إرسال مقترح"}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
