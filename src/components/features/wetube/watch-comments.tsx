"use client";

import React from "react";
import { UserCircle, ThumbsUp, ThumbsDown, MoreHorizontal } from "lucide-react";
import { YouTubeComment } from "@/lib/youtube-discovery-store";

interface WatchCommentsProps {
    comments: YouTubeComment[];
    user: any;
}

export function WatchComments({ comments, user }: WatchCommentsProps) {
    return (
        <div className="mb-10">
            <div className="flex items-center gap-6 mb-6">
                <h2 className="text-xl font-bold">{comments.length > 0 ? comments.length : "2,410"} التعليقات</h2>
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

            {/* YouTube Comments */}
            {(comments.length > 0 ? comments : [1, 2, 3, 4]).map((c: any, i) => (
                <div key={i} className="flex gap-4 mb-6 items-start">
                    <div className="size-10 rounded-full bg-[#272727] shrink-0 mt-1 overflow-hidden">
                        <img src={c.authorThumb || `https://picsum.photos/seed/commenter${i}/40/40`} className="size-full object-cover" alt="" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-foreground">{c.author || `@user-${i}x9`}</span>
                            <span className="text-xs text-muted-foreground">{c.time || `منذ ${i} أيام`}</span>
                        </div>
                        <p className="text-sm text-foreground mb-2 leading-relaxed">
                            {c.text || "هذا تعليق محاكاة يوضح كيف يبدو قسم التعليقات في تصميم يوتيوب. تم مراعاة الخطوط، المسافات، وأزرار التفاعل بالأسفل!"}
                        </p>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <button className="hover:text-white flex items-center justify-center p-1.5 rounded-full hover:bg-white/10"><ThumbsUp className="size-4" /></button>
                            <span className="text-xs -mr-2">{((i+1) * 11).toLocaleString()}</span>
                            <button className="hover:text-white flex items-center justify-center p-1.5 rounded-full hover:bg-white/10"><ThumbsDown className="size-4" /></button>
                            <button className="text-xs font-medium hover:bg-white/10 px-3 py-1.5 rounded-full">رد</button>
                        </div>
                    </div>
                    <button className="p-1 text-white/0 hover:text-white transition-colors group-hover:text-white/50"><MoreHorizontal className="size-4" /></button>
                </div>
            ))}
        </div>
    );
}
