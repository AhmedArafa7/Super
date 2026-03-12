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

// Extracted Components
import { WatchPlayer } from "./watch-player";
import { WatchActions } from "./watch-actions";
import { WatchDescription } from "./watch-description";
import { WatchComments } from "./watch-comments";
import { WatchSidebar } from "./watch-sidebar";

/**
 * [STABILITY_ANCHOR: WETUBE_WATCH_VIEW_V2.0]
 * Refactored container for the watch view.
 */
export function WeTubeWatchView({ video, user, onClose, relatedVideos, onSync, isCached }: any) {
    const { cachedAssets } = useGlobalStorage();

    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);
    const [details, setDetails] = useState<VideoDetails | null>(null);
    const [comments, setComments] = useState<YouTubeComment[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        if (video.source === 'youtube') {
            const loadData = async () => {
                setIsLoadingDetails(true);
                try {
                    const [d, c] = await Promise.all([
                        fetchVideoDetails(video.id),
                        fetchVideoComments(video.id)
                    ]);
                    setDetails(d);
                    setComments(c);
                } catch (e) {
                    console.error("Load Watch Data Error", e);
                } finally {
                    setIsLoadingDetails(false);
                }
            };
            loadData();
        }
    }, [video.id, video.source]);

    const cachedAsset = cachedAssets.find(a => a.id === `video-${video.id}`);
    const downloadedQuality = cachedAsset?.downloadedQuality;

    const [selectedQuality, setSelectedQuality] = useState<string>(downloadedQuality || "720");
    const [pendingQuality, setPendingQuality] = useState<string | null>(null);
    const [showDataWarningDialog, setShowDataWarningDialog] = useState(false);
    const [showScreenWarningDialog, setShowScreenWarningDialog] = useState(false);

    const rawViews = details?.views || video.views;
    const viewCount = typeof rawViews === 'number' ? rawViews.toLocaleString() : rawViews || "12,345";
    const likeCount = details ? "مخفي" : "45 ألف";
    const dateStr = video.time || "حديثاً";

    const isPlayingLocally = isCached && selectedQuality === downloadedQuality;

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
                    video={video}
                    isPlayingLocally={isPlayingLocally}
                    selectedQuality={selectedQuality}
                    downloadedQuality={downloadedQuality}
                    handleQualityChange={handleQualityChange}
                />

                <WatchActions 
                    video={video}
                    user={user}
                    isLiked={isLiked}
                    setIsLiked={setIsLiked}
                    isDisliked={isDisliked}
                    setIsDisliked={setIsDisliked}
                    likeCount={likeCount}
                    selectedQuality={selectedQuality}
                    handleQualityChange={handleQualityChange}
                    downloadedQuality={downloadedQuality}
                    isCached={isCached}
                    onSync={onSync}
                />

                <WatchDescription 
                    video={video}
                    details={details}
                    viewCount={viewCount}
                    dateStr={dateStr}
                    isDescriptionExpanded={isDescriptionExpanded}
                    setIsDescriptionExpanded={setIsDescriptionExpanded}
                />

                <WatchComments 
                    comments={comments}
                    user={user}
                />
            </div>

            {/* Right Column: Related Videos */}
            <WatchSidebar relatedVideos={relatedVideos} />

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
