"use client";

import React, { useState, useEffect } from "react";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Scissors, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractYouTubeId } from "@/lib/youtube-utils";

interface ClipModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    video: any;
}

export function ClipModal({ isOpen, onOpenChange, video }: ClipModalProps) {
    const { toast } = useToast();
    const [clipTitle, setClipTitle] = useState("");
    const [startTime, setStartTime] = useState("0:00");
    const [endTime, setEndTime] = useState("1:00");
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setClipTitle("");
            setStartTime("0:00");
            setEndTime("1:00");
            setIsCopied(false);
        }
    }, [isOpen]);

    const timeToSeconds = (timeStr: string) => {
        const parts = timeStr.split(":");
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        if (parts.length === 3) {
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
        return parseInt(timeStr) || 0;
    };

    const handleGenerateClip = () => {
        const startSec = timeToSeconds(startTime);
        const endSec = timeToSeconds(endTime);

        if (endSec <= startSec) {
            toast({ variant: "destructive", title: "خطأ", description: "يجب أن يكون وقت النهاية أكبر من وقت البداية." });
            return;
        }

        if (endSec - startSec > 60) {
            toast({ variant: "destructive", title: "خطأ", description: "أقصى مدة للمقطع هي 60 ثانية." });
            return;
        }

        let baseUrl = video.externalUrl || `https://youtu.be/${video.id}`;
        let shareUrl = "";
        
        if (baseUrl.includes("youtu.be") || baseUrl.includes("youtube.com")) {
            const videoId = extractYouTubeId(baseUrl) || video.id;
            shareUrl = `https://youtu.be/${videoId}?t=${startSec}`;
        } else {
            const separator = baseUrl.includes("?") ? "&" : "?";
            shareUrl = `${baseUrl}${separator}t=${startSec}`;
        }

        navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        toast({
            title: "تم نسخ رابط المقطع",
            description: "يمكنك الآن مشاركته مع أصدقائك أو على السوشيال ميديا.",
        });
        
        setTimeout(() => {
            onOpenChange(false);
        }, 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-[#212121] border-white/10 text-white rounded-3xl p-6 rtl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-right text-xl font-bold flex items-center gap-3 justify-end">
                        <span className="flex-1">اقتطاع مقطع ومشاركته (Clip)</span>
                        <Scissors className="size-6 text-indigo-400" />
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label className="text-right block text-white/70">عنوان المقطع (اختياري)</Label>
                        <Input 
                            value={clipTitle}
                            onChange={(e) => setClipTitle(e.target.value)}
                            placeholder="أضف وصفاً مميزاً للمقطع..." 
                            className="bg-white/5 border-white/10 text-white focus-visible:ring-indigo-500 rounded-xl"
                            dir="rtl"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-right block text-white/70">وقت البداية</Label>
                            <Input 
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                placeholder="0:00" 
                                className="bg-white/5 border-white/10 text-white focus-visible:ring-indigo-500 rounded-xl font-mono text-center"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block text-white/70">وقت النهاية</Label>
                            <Input 
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                placeholder="1:00" 
                                className="bg-white/5 border-white/10 text-white focus-visible:ring-indigo-500 rounded-xl font-mono text-center"
                            />
                        </div>
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground text-right border-t border-white/5 pt-2">
                        ملاحظة: طول المقطع يجب ألا يتجاوز 60 ثانية.
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                    <Button 
                        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 shadow-lg shadow-indigo-600/20 transition-all font-sans text-white text-md"
                        onClick={handleGenerateClip}
                    >
                        {isCopied ? <CheckCircle2 className="size-5 text-emerald-300" /> : <Copy className="size-5" />}
                        {isCopied ? "تم النسخ بنجاح!" : "إنشاء الرابط ونسخه"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
