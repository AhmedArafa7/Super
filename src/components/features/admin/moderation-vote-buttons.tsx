
'use client';

import React from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';

interface ModerationVoteButtonsProps {
  approvals: string[];
  rejections: string[];
  onVote: (vote: 'approve' | 'reject') => Promise<void>;
  variant?: 'minimal' | 'full';
}

/**
 * مكون تصويت موحد (The Universal Moderation Controller)
 * يستخدم في كافة أجزاء الموقع التي تتطلب رقابة جماعية لضمان التناسق والاحترافية.
 */
export function ModerationVoteButtons({ 
  approvals = [], 
  rejections = [], 
  onVote, 
  variant = 'full' 
}: ModerationVoteButtonsProps) {
  const { user } = useAuth();
  const moderation = useSettingsStore(state => state.settings.moderation);
  
  const hasApproved = approvals.includes(user?.id || "");
  const hasRejected = rejections.includes(user?.id || "");
  const [isCasting, setIsCasting] = React.useState(false);

  const handleVoteAction = async (vote: 'approve' | 'reject') => {
    if (isCasting) return;
    setIsCasting(true);
    try {
      await onVote(vote);
    } catch (e) {
      console.error("Moderation Vote Error:", e);
    } finally {
      setIsCasting(false);
    }
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-1.5 flex-row-reverse">
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "h-8 px-2 gap-1.5 text-[10px] font-black tracking-tighter rounded-lg transition-all",
            hasApproved ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 hover:text-emerald-400"
          )}
          onClick={() => handleVoteAction('approve')}
          disabled={isCasting}
        >
          {isCasting ? <Loader2 className="size-3 animate-spin" /> : <ThumbsUp className={cn("size-3", hasApproved && "fill-emerald-400")} />}
          {approvals.length}/{moderation.votesToApprove}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "h-8 px-2 gap-1.5 text-[10px] font-black tracking-tighter rounded-lg transition-all",
            hasRejected ? "text-red-400 bg-red-500/10" : "text-slate-500 hover:text-red-400"
          )}
          onClick={() => handleVoteAction('reject')}
          disabled={isCasting}
        >
          {isCasting ? <Loader2 className="size-3 animate-spin" /> : <ThumbsDown className={cn("size-3", hasRejected && "fill-red-400")} />}
          {rejections.length}/{moderation.votesToTrash}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-3 flex-row-reverse w-full">
      <Button 
        className={cn(
          "flex-1 h-11 rounded-xl px-1 text-[10px] font-black shadow-lg transition-all border",
          hasApproved 
            ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" 
            : "bg-emerald-600 hover:bg-emerald-500 text-white border-transparent shadow-emerald-600/20"
        )} 
        onClick={() => handleVoteAction('approve')}
        disabled={isCasting}
      >
        {isCasting ? <Loader2 className="size-4 animate-spin" /> : hasApproved ? "تم التأييد" : "تأييد"} ({approvals.length}/{moderation.votesToApprove})
      </Button>
      <Button 
        variant="outline"
        className={cn(
          "flex-1 h-11 rounded-xl px-1 text-[10px] font-black transition-all border",
          hasRejected 
            ? "bg-red-600/20 text-red-400 border-red-500/30" 
            : "border-white/10 hover:bg-red-500/10 text-red-500"
        )} 
        onClick={() => handleVoteAction('reject')}
        disabled={isCasting}
      >
        {isCasting ? <Loader2 className="size-4 animate-spin" /> : hasRejected ? "تم التحفظ" : "تحفظ"} ({rejections.length}/{moderation.votesToTrash})
      </Button>
    </div>
  );
}
