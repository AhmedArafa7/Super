"use client";

import React, { useState } from "react";
import {
    ThumbsUp, ThumbsDown, Share2, Download, Scissors,
    MoreHorizontal, CheckCircle2, UserCircle, Bell, ChevronDown, Check, Settings, AlertTriangle
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { VideoCard } from "../stream/video-card";
import { NexusVideoPlayer } from "../stream/nexus-video-player";
import { cn } from "@/lib/utils";
import { useStreamStore } from "@/lib/stream-store";
import { useGlobalStorage } from "@/lib/global-storage-store";

/**
 * [STABILITY_ANCHOR: WETUBE_WATCH_VIEW_V1.0]
 * محاكاة دقيقة لصفحة مشاهدة الفيديو في يوتيوب `watch?v=...`
 */
export function WeTubeWatchView({ video, user, onClose, relatedVideos, onSync, isCached }: any) {
    const { setActiveVideo } = useStreamStore();
    const { cachedAssets } = useGlobalStorage();

    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);

    // Default to the cached quality if it exists
    const cachedAsset = cachedAssets.find(a => a.id === `video-${video.id}`);
    const downloadedQuality = cachedAsset?.downloadedQuality;

    const [selectedQuality, setSelectedQuality] = useState<string>(downloadedQuality || "720");
    const [pendingQuality, setPendingQuality] = useState<string | null>(null);
    const [showDataWarningDialog, setShowDataWarningDialog] = useState(false);
    const [showScreenWarningDialog, setShowScreenWarningDialog] = useState(false);

    const viewCount = typeof video.views === 'number' ? video.views.toLocaleString() : video.views || "12,345";
    const likeCount = "45 ألف"; // Mock data
    const dateStr = video.time || "منذ يومين";

    const isPlayingLocally = isCached && selectedQuality === downloadedQuality;

    const handleQualityChange = (newQuality: string) => {
        if (newQuality === selectedQuality) return;

        // التحقق من توافق الشاشة
        let screenWidth = window.screen.width;
        let requiresHighRes = newQuality === "1080" || newQuality === "1440" || newQuality === "2160";
        if (requiresHighRes && screenWidth < parseInt(newQuality)) {
            setPendingQuality(newQuality);
            setShowScreenWarningDialog(true);
            return;
        }

        // إذا كانت الجودة الجديدة غير محملة، إظهار تحذير الاستهلاك
        if (isCached && newQuality !== downloadedQuality) {
            setPendingQuality(newQuality);
            setShowDataWarningDialog(true);
            return;
        }

        setSelectedQuality(newQuality);
    };

    const confirmQualityChange = () => {
        if (pendingQuality) {
            setSelectedQuality(pendingQuality);
            setPendingQuality(null);
        }
        setShowDataWarningDialog(false);
        setShowScreenWarningDialog(false);
    };

    const abortQualityChange = () => {
        setPendingQuality(null);
        setShowDataWarningDialog(false);
        setShowScreenWarningDialog(false);
    };

    return (
        <div className="flex flex-col lg:flex-row w-full max-w-[1500px] mx-auto pt-16 px-4 sm:px-6 lg:px-8 gap-6 rtl pb-20">

            {/* Left Column: Video Player, Info, Comments */}
            <div className="flex-1 lg:max-w-[calc(100%-400px)] flex flex-col min-w-0">

                {/* === 1. VIDEO PLAYER CONTAINER === */}
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative group">
                    {isPlayingLocally ? (
                        <NexusVideoPlayer
                            src="/offline-placeholder.mp4"
                            poster={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
                            autoPlay={true}
                            sourceType="local"
                            defaultQuality={selectedQuality}
                            onQualityChange={handleQualityChange}
                            qualityOptions={[]} // Local player doesn't need quality switching for the placeholder
                        />
                    ) : (
                        video.source === 'youtube' && video.externalUrl ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${getYoutubeId(video.externalUrl)}?autoplay=1&rel=0&vq=${selectedQuality === "1080" ? "hd1080" : selectedQuality === "720" ? "hd720" : selectedQuality === "480" ? "large" : "medium"}`}
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full border-0"
                            />
                        ) : (video.source === 'telegram' || video.source === 'local' || video.source === 'tiktok' || !video.source) && video.externalUrl ? (
                            <NexusVideoPlayer
                                src={`/api/stream/telegram?fileId=${video.externalUrl}`}
                                poster={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
                                autoPlay={true}
                                sourceType={video.source === 'local' ? 'local' : video.source === 'telegram' ? 'telegram' : 'tiktok'}
                                defaultQuality={selectedQuality}
                                onQualityChange={handleQualityChange}
                                qualityOptions={[]} // Telegram doesn't inherently support live multi-quality streaming perfectly from one file, so we hide it for now unless we do multiple uploads
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f0f0f]">
                                <p className="text-[#aaaaaa] mb-2 font-mono">Loading MP4 Source...</p>
                                <div className="size-10 border-4 border-t-blue-500 border-white/10 rounded-full animate-spin"></div>
                            </div>
                        )
                    )}

                    {isPlayingLocally && (
                        <div className="absolute top-4 left-4 z-10">
                            <Badge className="bg-indigo-500/80 hover:bg-indigo-500 font-bold border-none text-white shadow-md">
                                وضع عدم الاتصال (Offline)
                            </Badge>
                        </div>
                    )}
                </div>

                {/* === 2. TITLE SECTION === */}
                <h1 dir="auto" className="text-xl sm:text-2xl font-bold text-foreground mt-4 mb-2 leading-tight">
                    {video.title}
                </h1>

                {/* === 3. CONTROLS METADATA BAR === */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">

                    {/* Channel Info & Subscribe */}
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-[#272727] overflow-hidden cursor-pointer shrink-0">
                            <img src={`https://picsum.photos/seed/${video.author}/40/40`} className="size-full object-cover" alt="Avatar" />
                        </div>
                        <div className="flex flex-col min-w-0 pr-1">
                            <span className="font-bold text-foreground text-[16px] truncate cursor-pointer hover:text-white">{video.author}</span>
                            <span className="text-muted-foreground text-xs truncate">456 ألف مشترك</span>
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

                    {/* Action Buttons (Scrollable horizontally on mobile) */}
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
                                                {!isCached && q === "720" && <span className="text-[10px] text-muted-foreground mr-2 ml-2 tracking-widest">تلقائي</span>}
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
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors shrink-0">
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
                        <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors shrink-0">
                            <Scissors className="size-5" />
                            <span className="text-sm font-medium">قص</span>
                        </button>

                        {/* More */}
                        <button className="p-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors shrink-0">
                            <MoreHorizontal className="size-5" />
                        </button>
                    </div>
                </div>

                {/* === 4. EXPANDABLE DESCRIPTION BOX === */}
                <div
                    className={cn(
                        "bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl cursor-pointer text-sm mb-6 border border-white/5 shadow-sm",
                        !isDescriptionExpanded && "hover:bg-white/10"
                    )}
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                >
                    <div className="font-bold text-foreground flex items-center gap-2 mb-1">
                        <span>{viewCount} مشاهدة</span>
                        <span>{dateStr}</span>
                        {video.category && <span className="text-muted-foreground font-medium ml-1">#{video.category}</span>}
                    </div>
                    <div className={cn("text-foreground whitespace-pre-wrap mt-2", !isDescriptionExpanded && "line-clamp-2")}>
                        {video.description || `هذا هو الوصف التلقائي للفيديو المسمى "${video.title}". في هذه المساحة يمكن للناشر توفير روابط إضافية ومقاطع زمنية وتفاصيل حول المحتوى لكي يستفيد منها المشاهد.\n\nتابعنا على وسائل التواصل الاجتماعي لمزيد من الفيديوهات الحصرية والدروس المتقدمة.`}
                    </div>
                    <button className="mt-2 text-foreground font-bold">
                        {isDescriptionExpanded ? "عرض أقل" : "عرض المزيد"}
                    </button>
                </div>

                {/* === 5. COMMENTS SECTION (UI ONLY) === */}
                <div className="mb-10">
                    <div className="flex items-center gap-6 mb-6">
                        <h2 className="text-xl font-bold">2,410 التعليقات</h2>
                        <button className="flex items-center gap-2 text-sm font-medium hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors">
                            <span className="tracking-wide">≡ الترتيب حسب</span>
                        </button>
                    </div>

                    {/* Add Comment Field */}
                    <div className="flex gap-4 mb-8 items-start">
                        <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden shrink-0 mt-1">
                            {user?.avatar_url ? <img src={user.avatar_url} className="size-full object-cover" alt="" /> : <UserCircle className="size-6 text-white" />}
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="إضافة تعليق..."
                                className="w-full bg-transparent border-b border-[#3f3f3f] focus:border-[#f1f1f1] outline-none py-1 transition-colors text-sm"
                            />
                        </div>
                    </div>

                    {/* Dummy Comments */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-4 mb-6 items-start">
                            <div className="size-10 rounded-full bg-[#272727] shrink-0 mt-1 overflow-hidden">
                                <img src={`https://picsum.photos/seed/commenter${i}/40/40`} className="size-full object-cover" alt="" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm text-foreground">@user-{i}x9</span>
                                    <span className="text-xs text-muted-foreground">منذ {i} أيام</span>
                                </div>
                                <p className="text-sm text-foreground mb-2 leading-relaxed">
                                    هذا تعليق محاكاة يوضح كيف يبدو قسم التعليقات في تصميم يوتيوب. تم مراعاة الخطوط، المسافات، وأزرار التفاعل بالأسفل!
                                </p>
                                <div className="flex items-center gap-4 text-muted-foreground">
                                    <button className="hover:text-white flex items-center justify-center p-1.5 rounded-full hover:bg-white/10"><ThumbsUp className="size-4" /></button>
                                    <span className="text-xs -mr-2">{(i * 11).toLocaleString()}</span>
                                    <button className="hover:text-white flex items-center justify-center p-1.5 rounded-full hover:bg-white/10"><ThumbsDown className="size-4" /></button>
                                    <button className="text-xs font-medium hover:bg-white/10 px-3 py-1.5 rounded-full">رد</button>
                                </div>
                            </div>
                            <button className="p-1 text-white/0 hover:text-white transition-colors group-hover:text-white/50"><MoreHorizontal className="size-4" /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Up Next / Recommended */}
            <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-3">
                {/* Category Filter for Related Videos */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {["الكل", "من نفس القناة", "ذات صلة", "حديثاً"].map(cat => (
                        <button
                            key={cat}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                                cat === "الكل" ? "bg-white text-black" : "bg-[#272727] text-white hover:bg-[#3f3f3f]"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Vertical List of Related Videos */}
                {relatedVideos.map((rv: any, idx: number) => (
                    <div key={idx} className="flex gap-2 hover:bg-[#3f3f3f]/50 p-1 rounded-xl transition-colors cursor-pointer group" onClick={() => setActiveVideo(rv)}>
                        <div className="w-[168px] shrink-0 relative rounded-xl overflow-hidden aspect-video bg-[#272727]">
                            <img src={rv.thumbnail || `https://picsum.photos/seed/${rv.id}/168/94`} className="w-full h-full object-cover" alt="" />
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[12px] font-medium px-1 rounded">12:34</div>
                        </div>
                        <div className="flex flex-col flex-1 py-0.5 relative pr-1">
                            <h4 dir="auto" className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-blue-400">{rv.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 hover:text-foreground">{rv.author}</p>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <span>{(typeof rv.views === 'number' ? rv.views : 5000).toLocaleString()} مشاهدة</span>
                                <span>•</span>
                                <span>منذ يوم</span>
                            </div>
                            <button className="absolute top-0 left-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full"><MoreHorizontal className="size-4" /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Warn Dialogs */}
            <AlertDialog open={showDataWarningDialog} onOpenChange={(o) => !o && abortQualityChange()}>
                <AlertDialogContent className="bg-[#121212] border-white/10 text-white rtl rounded-2xl p-6" dir="auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl text-yellow-500">
                            <AlertTriangle className="size-6" />
                            تنبيه استهلاك باقة الإنترنت
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground text-[16px] leading-relaxed mt-2 pt-2">
                            الجودة المختارة (<span className="text-white font-bold">{pendingQuality}p</span>) غير متوفرة محلياً. التبديل إلى هذه الجودة سيقوم بإلغاء التشغيل في وضع "عدم الاتصال" وسيؤدي إلى <strong>استهلاك باقة الإنترنت</strong>، بينما يمكنك مشاهدة جودة <span className="text-indigo-400 font-bold">{downloadedQuality}p</span> مجاناً.
                            <br /><br />
                            هل أنت متأكد من المتابعة واستهلاك البيانات؟
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-start gap-2 mt-6">
                        <AlertDialogCancel className="bg-[#272727] border-white/10 hover:bg-[#3f3f3f] text-white m-0 roudned-xl">
                            تراجع والاستمرار بالمجان
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            // إذا كان هناك تحذير شاشة أيضاً لهذه الجودة، سنظهره بعد تجاوز التحذير الأول
                            let screenWidth = window.screen.width;
                            if (pendingQuality && parseInt(pendingQuality) > screenWidth && (pendingQuality === "1080" || pendingQuality === "1440" || pendingQuality === "2160")) {
                                setShowDataWarningDialog(false);
                                setTimeout(() => setShowScreenWarningDialog(true), 150);
                            } else {
                                confirmQualityChange();
                            }
                        }} className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl">
                            متابعة واستهلاك باقة
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showScreenWarningDialog} onOpenChange={(o) => !o && abortQualityChange()}>
                <AlertDialogContent className="bg-[#121212] border-white/10 text-white rtl rounded-2xl p-6" dir="auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl text-orange-500">
                            <AlertTriangle className="size-6" />
                            جودة غير مناسبة لشاشتك
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground text-[16px] leading-relaxed mt-2 pt-2">
                            لقد اخترت جودة <span className="text-white font-bold">{pendingQuality}p</span>، ولكن شاشة هاتفك/جهازك غير قادرة على عرض هذه الدقة بالكامل.
                            <br /><br />
                            <strong>هذاء سيؤدي إلى استهلاك عالي جداً لباقة الإنترنت بالإضافة إلى إبطاء التشغيل، دون أن تلاحظ أي فرق حقيقي في الوضوح.</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-start gap-2 mt-6">
                        <AlertDialogCancel className="bg-[#272727] border-white/10 hover:bg-[#3f3f3f] text-white m-0 rounded-xl">
                            إلغاء
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmQualityChange} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
                            بالرغم من ذلك، أصر على تشغيلها
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

const getYoutubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};
