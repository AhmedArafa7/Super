"use client";

import React from "react";
import { UserCircle, ThumbsUp, ThumbsDown, MoreHorizontal } from "lucide-react";
import { YouTubeComment } from "@/lib/youtube-discovery-store";

interface WatchCommentsProps {
    comments: YouTubeComment[];
    user: any;
    isLoading?: boolean;
}

export function WatchComments({ comments, user, isLoading }: WatchCommentsProps) {
    return (
        <div className="mb-10 min-h-[400px]">

            <div className="flex items-center gap-6 mb-6">
                <h2 className="text-xl font-bold">
                    {isLoading ? "..." : (comments.length > 0 ? comments.length.toLocaleString() : "0")} التعليقات
                </h2>
                {!isLoading && (
                    <button className="flex items-center gap-2 text-sm font-medium hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors">
                        <span className="tracking-wide">≡ الترتيب حسب</span>
                    </button>
                )}
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

            {/* Loading Skeleton or Real Comments */}
            {isLoading ? (
                <div className="flex flex-col gap-6">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="flex gap-4 items-start animate-pulse">
                            <div className="size-10 rounded-full bg-white/5 shrink-0" />
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="h-4 bg-white/5 rounded w-1/4" />
                                <div className="h-4 bg-white/5 rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : comments.length > 0 ? (
                comments.map((c: any, i) => (
                    <div key={i} className="flex gap-4 mb-6 items-start group">
                        <div className="size-10 rounded-full bg-[#272727] shrink-0 mt-1 overflow-hidden flex items-center justify-center">
                            {c.authorThumb ? (
                                <img src={c.authorThumb} className="size-full object-cover" alt="" />
                            ) : (
                                <UserCircle className="size-6 text-white/20" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm text-foreground">{c.author}</span>
                                <span className="text-xs text-muted-foreground">{c.time}</span>
                            </div>
                            <p className="text-sm text-foreground mb-2 leading-relaxed whitespace-pre-wrap">
                                {c.text}
                            </p>
                            <div className="flex items-center gap-4 text-muted-foreground">
                                <button className="hover:text-white flex items-center justify-center p-1.5 rounded-full hover:bg-white/10 transition-colors">
                                    <ThumbsUp className="size-4" />
                                </button>
                                <span className="text-xs -mr-2">{c.likes || 0}</span>
                                <button className="hover:text-white flex items-center justify-center p-1.5 rounded-full hover:bg-white/10 transition-colors">
                                    <ThumbsDown className="size-4" />
                                </button>
                                <button className="text-xs font-medium hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors">رد</button>
                            </div>
                        </div>
                        <button className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-white transition-all"><MoreHorizontal className="size-4" /></button>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                    <p className="text-sm">لا توجد تعليقات متاحة لهذا الفيديو حالياً.</p>
                </div>
            )}

        </div>
    );
}
