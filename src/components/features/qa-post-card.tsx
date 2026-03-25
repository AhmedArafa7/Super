import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Send, Clock, HelpCircle, FileQuestion, User, AlertCircle, Plus } from "lucide-react";
import { QAPost } from "@/lib/qa-store";
import { getRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export interface QAPostCardProps {
  post: QAPost;
  currentUser: any;
  isManagement: boolean;
  onEdit: (post: QAPost) => void;
  onDelete: (post: QAPost) => void;
  onAnswer: (post: QAPost) => void;
  onFollowUp: (post: QAPost) => void;
  onFollowUpAnswer: (post: QAPost) => void;
}

export const QAPostCard = React.memo(({ post, currentUser, isManagement, onEdit, onDelete, onAnswer, onFollowUp, onFollowUpAnswer }: QAPostCardProps) => {
  const isAuthor = currentUser?.id === post.authorId;

  return (
    <Card className="bg-slate-900/80 border-white/10 overflow-hidden backdrop-blur-xl transition-all hover:bg-slate-900/90" dir="rtl">
      <CardHeader className="p-5 pb-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {post.category === 'question' ? <HelpCircle className="size-5" /> : <FileQuestion className="size-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {post.isAnonymous 
                    ? (isAuthor || isManagement ? `${post.authorName} (مخفي)` : "مشارك بالقسم")
                    : (isAuthor || isManagement ? post.authorName : "مشارك بالقسم")
                  }
                </span>
                <Badge variant="outline" className="text-[10px] h-5 border-white/10 bg-white/5 text-muted-foreground gap-1.5 flex items-center">
                  {post.category === 'question' ? 'سؤال' : 'طلب'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Clock className="size-3" />
                {getRelativeTime(post.createdAt || new Date().toISOString())}
              </p>
            </div>
          </div>
          
          {/* User Actions: Edit / Delete */}
          {isAuthor && !post.answer && (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-white rounded-lg" onClick={() => onEdit(post)}>
                <Edit className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-400 rounded-lg" onClick={() => onDelete(post)}>
                <Trash className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{post.text}</p>
        
        {/* Admin Answer Block */}
        {post.answer && (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl relative">
            <div className="flex items-center gap-2 mb-2">
              <User className="size-4 text-primary" />
              <span className="text-primary font-bold text-xs">{post.answeredBy}</span>
              <span className="text-muted-foreground text-[10px] mr-auto">{getRelativeTime(post.answeredAt || new Date().toISOString())}</span>
            </div>
            <p className="text-primary/90 text-sm leading-relaxed whitespace-pre-wrap">{post.answer}</p>
            
            {post.answerAlert && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-in slide-in-from-bottom-2 duration-300">
                <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-amber-200/90 text-[11px] font-bold leading-relaxed">{post.answerAlert}</p>
              </div>
            )}
          </div>
        )}

        {/* Follow-up Section */}
        {post.answer && (
          <div className="mt-4 space-y-4">
            {post.followUpText && (
              <div className="mr-6 p-4 bg-white/5 border border-white/5 rounded-2xl relative">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="size-4 text-muted-foreground" />
                  <span className="text-white/70 font-bold text-xs">استفسار تكميلي</span>
                  <span className="text-muted-foreground text-[10px] mr-auto">{getRelativeTime(post.followUpAt || new Date().toISOString())}</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{post.followUpText}</p>
                
                {post.followUpAnswer && (
                  <div className="mt-4 p-4 bg-primary/5 border-r-2 border-primary/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="size-3.5 text-primary/70" />
                      <span className="text-primary/70 font-bold text-[10px]">{post.followUpAnswerBy}</span>
                      <span className="text-muted-foreground text-[10px] mr-auto">{getRelativeTime(post.followUpAnswerAt || new Date().toISOString())}</span>
                    </div>
                    <p className="text-primary/80 text-sm leading-relaxed whitespace-pre-wrap">{post.followUpAnswer}</p>
                  </div>
                )}

                {isManagement && !post.followUpAnswer && (
                  <Button variant="outline" size="sm" className="mt-3 h-8 text-[10px] font-bold border-primary/20 hover:bg-primary/10" onClick={() => onFollowUpAnswer(post)}>
                    الرد على الاستفسار
                  </Button>
                )}
              </div>
            )}

            {isAuthor && !post.followUpText && (
              <div className="mr-6">
                <Button variant="ghost" className="text-primary/60 hover:text-primary text-xs gap-2 p-0 h-auto font-bold" onClick={() => onFollowUp(post)}>
                  <Plus className="size-3" />
                  إضافة استفسار أو طلب تكميلي
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Admin Action: Answer / Edit Answer */}
        {isManagement && (
          <div className="mt-4 border-t border-white/5 pt-4">
            <Button 
              variant={post.answer ? "outline" : "default"} 
              size="sm" 
              className={cn(
                "rounded-xl h-10 font-bold text-xs gap-2 px-6 transition-all",
                !post.answer && "bg-gradient-to-r from-primary to-emerald-600 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
              )}
              onClick={() => onAnswer(post)}
            >
              {post.answer ? <Edit className="size-3" /> : <Send className="size-3" />}
              {post.answer ? 'تعديل الرد الإداري' : 'عرض الرد على المشاركة'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

QAPostCard.displayName = "QAPostCard";
