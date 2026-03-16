"use client";

import React, { useState, useEffect } from "react";
import { fetchVideoDetails, fetchVideoComments, VideoDetails, YouTubeComment } from "@/lib/youtube-discovery-store";
import { AlertTriangle } from "lucide-react";
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
import { useGlobalStorage } from "@/lib/global-storage-store";
import { getRelativeTime } from "@/lib/date-utils";
import { addToHistory } from "@/lib/history-store";

// Extracted Components
import { WatchProvider, useWatch } from "./watch-context";
import { WatchPlayer } from "./watch-player";
import { WatchActions } from "./watch-actions";
import { WatchDescription } from "./watch-description";
import { WatchComments } from "./watch-comments";
import { WatchSidebar } from "./watch-sidebar";
import { WatchProductShelf } from "./watch-product-shelf";

/**
 * [STABILITY_ANCHOR: WETUBE_WATCH_VIEW_V3.0]
 * Refactored container for the watch view using Context API.
 */
function WatchViewContent({ user, onClose, relatedVideos, onSync, isCached, onChannelClick }: any) {
    const { cachedAssets } = useGlobalStorage();
    const { 
        video, 
        details, setDetails, 
        setComments, 
        setIsLoading,
        selectedQuality, setSelectedQuality
    } = useWatch();

    useEffect(() => {
        if (video.source === 'youtube') {
            const loadData = async () => {
                setIsLoading(true);
                try {
                    const [d, c] = await Promise.all([
                        fetchVideoDetails(video.id),
                        fetchVideoComments(video.id)
                    ]);
                    setDetails(d);
                    setComments(c);
                    
                    if (user?.id) {
                        addToHistory(user.id, {
                            id: video.id,
                            title: d?.title || video.title,
                            thumbnail: d?.thumbnail || video.thumbnail,
                            author: d?.author || video.author,
                            authorId: d?.authorId || video.authorId,
                            channelAvatar: d?.channelAvatar || video.channelAvatar
                        });
                    }
                } catch (e) {
                    console.error("Load Watch Data Error", e);
                } finally {
                    setIsLoading(false);
                }
            };
            loadData();
        }
    }, [video.id, video.source]);

    const cachedAsset = cachedAssets.find(a => a.id === `video-${video.id}`);
    const downloadedQuality = cachedAsset?.downloadedQuality;

    const [pendingQuality, setPendingQuality] = useState<string | null>(null);
    const [showDataWarningDialog, setShowDataWarningDialog] = useState(false);
    const [showScreenWarningDialog, setShowScreenWarningDialog] = useState(false);

    const rawViews = details?.views || video.views;
    const viewCount = typeof rawViews === 'number' ? rawViews.toLocaleString() : (rawViews || "");
    const likeCount = details?.likes !== undefined ? details.likes.toLocaleString() : (details ? "مخفي" : "");
    const dateStr = getRelativeTime(details?.date || video.published || video.time);

    const handleQualityChange = (newQuality: string) => {
        if (newQuality === selectedQuality) return;

        let screenWidth = window.screen.width;
        let requiresHighRes = newQuality === "1080" || newQuality === "1440" || newQuality === "2160";
        if (requiresHighRes && screenWidth < parseInt(newQuality)) {
            setPendingQuality(newQuality);
            setShowScreenWarningDialog(true);
            return;
        }

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
            {/* Left Column: Player, Actions, Description, Comments */}
            <div className="flex-1 lg:max-w-[calc(100%-400px)] flex flex-col min-w-0">
                <WatchPlayer 
                    isCached={isCached}
                    downloadedQuality={downloadedQuality}
                    handleQualityChange={handleQualityChange}
                />

                <WatchActions 
                    currentUser={user}
                    likeCount={likeCount}
                    handleQualityChange={handleQualityChange}
                    downloadedQuality={downloadedQuality}
                    isCached={isCached}
                    onSync={onSync}
                    onClose={onClose}
                />

                <WatchDescription 
                    viewCount={viewCount}
                    dateStr={dateStr}
                />

                <WatchProductShelf 
                    authorId={video.authorId}
                    productIds={video.productIds}
                    displayMode={video.productDisplayMode}
                />

                <WatchComments user={user} />
            </div>

            {/* Right Column: Related Videos */}
            <WatchSidebar relatedVideos={relatedVideos} onChannelClick={onChannelClick} />

            {/* Warning Dialogs */}
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

export function WeTubeWatchView(props: any) {
    return (
        <WatchProvider key={props.video?.id} initialVideo={props.video}>
            <WatchViewContent {...props} />
        </WatchProvider>
    );
}
