"use client";

import React from "react";
import { Play, Trash2, CheckCircle2, Youtube, HardDrive, Radio, RotateCcw, ThumbsUp, ThumbsDown, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateVideoStatus, deleteVideo, Video, voteOnVideo } from "@/lib/video-store";
import { cn } from "@/lib/utils";
import { Bot, Loader2, AlertTriangle, ShieldAlert, BadgeCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useSettingsStore } from "@/lib/settings-store";
import { ModerationVoteButtons } from "../moderation-vote-buttons";

interface CensorshipCardProps {
  video: Video;
  onPreview: (video: Video) => void;
  onRefresh: () => void;
}

export function CensorshipCard({ video, onPreview, onRefresh }: CensorshipCardProps) {
  const { user } = useAuth();
  const moderation = useSettingsStore(state => state.settings.moderation);

  const getYoutubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const ytId = video.source === 'youtube' ? getYoutubeId(video.externalUrl) : null;
  const thumbSrc = video.source === 'youtube' && ytId 
    ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` 
    : video.thumbnail;

  const handleVote = async (vote: 'approve' | 'reject') => {
    if (!user?.id) return;
    await voteOnVideo(video.id, user.id, vote, moderation);
    onRefresh();
  };

  const hasApproved = video.approvals?.includes(user?.id || "");
  const hasRejected = video.rejections?.includes(user?.id || "");

  const handleStatusChange = async (status: any, hasMusic?: boolean) => {
    await updateVideoStatus(video.id, status, undefined, hasMusic);
    onRefresh();
  };

  const handleDelete = async () => {
    if (confirm("هل أنت متأكد من مسح هذه العقدة البصرية نهائياً؟")) {
      await deleteVideo(video.id);
      onRefresh();
    }
  };

  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  React.useEffect(() => {
    if (video.status === 'published' && !video.aiReview && video.source === 'youtube' && !isAnalyzing) {
       const runAnalysis = async () => {
         setIsAnalyzing(true);
         try {
           const ytid = getYoutubeId(video.externalUrl);
           if (!ytid) return;
           const res = await fetch('/api/video/review', {
             method: 'POST', body: JSON.stringify({ videoId: ytid })
           });
           const data = await res.json();
           
           if (!data.error) {
              const { initializeFirebase } = await import('@/firebase');
              const { doc, updateDoc } = await import('firebase/firestore');
              const { firestore } = initializeFirebase();
              await updateDoc(doc(firestore, 'videos', video.id), {
                 aiReview: data
              });
              onRefresh();
           } else if (data.needsFallback) {
              const { initializeFirebase } = await import('@/firebase');
              const { doc, updateDoc } = await import('firebase/firestore');
              const { firestore } = initializeFirebase();
              await updateDoc(doc(firestore, 'videos', video.id), {
                 aiReview: { status: 'failed', advice: 'تحتاج معالجة متقدمة للصوت. لا تحتوي على نصوص جاهزة.' }
              });
              onRefresh();
           }
         } catch (e) {
           console.error("AI Analysis failed:", e);
         } finally {
           setIsAnalyzing(false);
         }
       };
       runAnalysis();
    }
  }, [video.status, video.aiReview, video.id]);

  return (
    <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-indigo-500/30 transition-all shadow-xl flex flex-col">
      <div 
        className="aspect-video relative bg-slate-900 cursor-pointer overflow-hidden"
        onClick={() => onPreview(video)}
      >
        <img 
          src={thumbSrc} 
          className="size-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
          alt={video.title}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="size-14 rounded-full bg-primary/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
            <Play className="text-white size-6 fill-white ml-1" />
          </div>
        </div>
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className={cn(
            "uppercase text-[8px] font-black tracking-widest px-3 py-1",
            video.status === 'published' ? "bg-green-500/80" : 
            video.status === 'trash' ? "bg-red-600/80" : "bg-amber-500/80"
          )}>{video.status === 'trash' ? 'سلة المحذوفات' : video.status}</Badge>
          <Badge className="bg-black/60 backdrop-blur-md border-white/10 p-1">
            {video.source === 'youtube' ? <Youtube className="size-3 text-red-500" /> : video.source === 'drive' ? <HardDrive className="size-3 text-emerald-400" /> : <Radio className="size-3 text-indigo-400" />}
          </Badge>
          {video.relatedSurah && (
            <Badge className="bg-emerald-500/80 text-[8px] font-black uppercase tracking-widest px-3 py-1 ml-2">
              سورة {video.relatedSurah}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="p-8 text-right space-y-5 flex-1 flex flex-col">
        <h4 dir="auto" className="font-bold text-white line-clamp-2 text-lg leading-tight h-14">{video.title}</h4>
        
        <div className="flex items-center justify-between flex-row-reverse border-t border-white/5 pt-4 mt-auto">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">بواسطة: @{video.author}</p>
            <div className="flex items-center gap-3 mt-1 justify-end">
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                {video.approvals?.length || 0} <ThumbsUp className="size-2.5" />
              </span>
              <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                {video.rejections?.length || 0} <ThumbsDown className="size-2.5" />
              </span>
            </div>
          </div>
          <div className="size-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <img src={`https://picsum.photos/seed/${video.authorId}/40/40`} className="size-full object-cover" />
          </div>
        </div>

        {video.status === 'published' && (
           <div className="bg-slate-900/50 rounded-xl p-3 border border-indigo-500/20 text-right space-y-2 mt-2">
             <div className="flex justify-between items-center mb-1">
               <Bot className="size-4 text-indigo-400" />
               <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">تقييم المهندس العصبي</span>
             </div>
             
             {isAnalyzing ? (
               <div className="flex items-center justify-center py-2 space-x-2 space-x-reverse text-indigo-400">
                  <Loader2 className="size-3 animate-spin" /><span className="text-[10px]">جاري تدقيق النص بالذكاء الاصطناعي...</span>
               </div>
             ) : video.aiReview ? (
               <div className="text-[9px] text-slate-300 space-y-2 leading-relaxed">
                 {video.aiReview.status === 'failed' ? (
                   <div className="flex items-start gap-1.5 text-amber-400">
                     <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                     <span>{video.aiReview.advice}</span>
                   </div>
                 ) : (
                   <>
                     <p className="opacity-90">{video.aiReview.summary}</p>
                     {video.aiReview.flags && video.aiReview.flags.length > 0 ? (
                       <div className="space-y-1">
                         <div className="font-bold text-red-400 flex items-center justify-end gap-1 mb-1 mt-2">
                            تحذيرات <ShieldAlert className="size-3" />
                         </div>
                         <ul className="list-disc pr-4 opacity-80 space-y-1 text-red-300">
                           {video.aiReview.flags.map((f, i) => <li key={i}>{f}</li>)}
                         </ul>
                       </div>
                     ) : (
                       <div className="text-emerald-400 font-bold flex items-center gap-1 mt-1 justify-end">
                          لم يتم رصد مغالطات واضحة <BadgeCheck className="size-3" />
                       </div>
                     )}
                   </>
                 )}
               </div>
             ) : (
                <div className="text-[9px] text-slate-500 text-center">في انتظار بدء المراجعة...</div>
             )}
           </div>
        )}

        <div className="flex gap-3 flex-row-reverse mt-2">
          {video.status === 'pending_review' || video.status === 'trash' ? (
            <ModerationVoteButtons 
              approvals={video.approvals || []}
              rejections={video.rejections || []}
              onVote={(vote) => voteOnVideo(video.id, user?.id || "", vote, moderation)}
            />
          ) : video.status === 'published' ? (
            <Button 
              className="flex-1 bg-amber-600 hover:bg-amber-500 h-11 rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20" 
              onClick={() => handleStatusChange('pending_review')}
            >
              <RotateCcw className="mr-2 size-4" /> إعادة للمراجعة
            </Button>
          ) : null}
          
          <Button 
            variant="ghost" 
            className="text-red-400 hover:bg-red-500/10 h-11 rounded-xl group/del px-4" 
            onClick={handleDelete}
          >
            <Trash2 className="size-4 group-hover/del:scale-110 transition-transform" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
