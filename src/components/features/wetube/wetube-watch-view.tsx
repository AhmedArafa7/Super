"use client";

import React, { useState } from "react";
import {
    ThumbsUp, ThumbsDown, Share2, Download, Scissors,
    MoreHorizontal, CheckCircle2, UserCircle, Bell, ChevronDown
} from "lucide-react";
import { VideoCard } from "../stream/video-card";
import { cn } from "@/lib/utils";
import { useStreamStore } from "@/lib/stream-store";

/**
 * [STABILITY_ANCHOR: WETUBE_WATCH_VIEW_V1.0]
 * محاكاة دقيقة لصفحة مشاهدة الفيديو في يوتيوب `watch?v=...`
 */
export function WeTubeWatchView({ video, user, onClose, relatedVideos, onSync, isCached }: any) {
    const { setActiveVideo } = useStreamStore();
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);

    const viewCount = typeof video.views === 'number' ? video.views.toLocaleString() : video.views || "12,345";
    const likeCount = "45 ألف"; // Mock data
    const dateStr = video.time || "منذ يومين";

    return (
        <div className="flex flex-col lg:flex-row w-full max-w-[1500px] mx-auto pt-16 px-4 sm:px-6 lg:px-8 gap-6 rtl">

            {/* Left Column: Video Player, Info, Comments */}
            <div className="flex-1 lg:max-w-[calc(100%-400px)] flex flex-col min-w-0">

                {/* === 1. VIDEO PLAYER CONTAINER === */}
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative group">
                    {video.source === 'youtube' && video.externalUrl ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${getYoutubeId(video.externalUrl)}?autoplay=1&rel=0`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f0f0f]">
                            <p className="text-[#aaaaaa] mb-2 font-mono">Loading MP4 Source...</p>
                            <div className="size-10 border-4 border-t-blue-500 border-white/10 rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                {/* === 2. TITLE SECTION === */}
                <h1 dir="auto" className="text-xl sm:text-2xl font-bold text-[#f1f1f1] mt-4 mb-2 leading-tight">
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
                            <span className="font-bold text-[#f1f1f1] text-[16px] truncate cursor-pointer hover:text-white">{video.author}</span>
                            <span className="text-[#aaaaaa] text-xs truncate">456 ألف مشترك</span>
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
                        "bg-[#272727] hover:bg-[#3f3f3f] transition-colors p-3 rounded-xl cursor-pointer text-sm mb-6",
                        !isDescriptionExpanded && "hover:bg-[#3f3f3f]"
                    )}
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                >
                    <div className="font-bold text-[#f1f1f1] flex items-center gap-2 mb-1">
                        <span>{viewCount} مشاهدة</span>
                        <span>{dateStr}</span>
                        {video.category && <span className="text-[#aaaaaa] font-medium ml-1">#{video.category}</span>}
                    </div>
                    <div className={cn("text-[#f1f1f1] whitespace-pre-wrap mt-2", !isDescriptionExpanded && "line-clamp-2")}>
                        {video.description || `هذا هو الوصف التلقائي للفيديو المسمى "${video.title}". في هذه المساحة يمكن للناشر توفير روابط إضافية ومقاطع زمنية وتفاصيل حول المحتوى لكي يستفيد منها المشاهد.\n\nتابعنا على وسائل التواصل الاجتماعي لمزيد من الفيديوهات الحصرية والدروس المتقدمة.`}
                    </div>
                    <button className="mt-2 text-[#f1f1f1] font-bold">
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
                                    <span className="font-medium text-sm text-[#f1f1f1]">@user-{i}x9</span>
                                    <span className="text-xs text-[#aaaaaa]">منذ {i} أيام</span>
                                </div>
                                <p className="text-sm text-[#f1f1f1] mb-2 leading-relaxed">
                                    هذا تعليق محاكاة يوضح كيف يبدو قسم التعليقات في تصميم يوتيوب. تم مراعاة الخطوط، المسافات، وأزرار التفاعل بالأسفل!
                                </p>
                                <div className="flex items-center gap-4 text-[#aaaaaa]">
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
                            <h4 dir="auto" className="text-sm font-medium text-[#f1f1f1] line-clamp-2 leading-snug group-hover:text-blue-400">{rv.title}</h4>
                            <p className="text-xs text-[#aaaaaa] mt-1 hover:text-[#f1f1f1]">{rv.author}</p>
                            <div className="text-xs text-[#aaaaaa] flex items-center gap-1">
                                <span>{(typeof rv.views === 'number' ? rv.views : 5000).toLocaleString()} مشاهدة</span>
                                <span>•</span>
                                <span>منذ يوم</span>
                            </div>
                            <button className="absolute top-0 left-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-[#3f3f3f] rounded-full"><MoreHorizontal className="size-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const getYoutubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};
