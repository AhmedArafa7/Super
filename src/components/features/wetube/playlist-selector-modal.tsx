"use client";

import React, { useEffect, useState } from "react";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Check, ListMusic } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { listMyPlaylists, addToPlaylist, createPlaylist } from "@/lib/youtube-sync-service";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface PlaylistSelectorModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    videoId: string;
}

export function PlaylistSelectorModal({ isOpen, onOpenChange, videoId }: PlaylistSelectorModalProps) {
    const { youtubeToken } = useAuth();
    const { toast } = useToast();
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [addingToId, setAddingToId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
    const [isCreateLoading, setIsCreateLoading] = useState(false);

    useEffect(() => {
        if (isOpen && youtubeToken) {
            loadPlaylists();
        }
    }, [isOpen, youtubeToken]);

    const loadPlaylists = async () => {
        setIsLoading(true);
        try {
            const data = await listMyPlaylists(youtubeToken!);
            setPlaylists(data);
        } catch (err) {
            console.error(err);
            toast({ variant: "destructive", title: "فشل تحميل قوائم التشغيل" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (playlistId: string) => {
        if (!youtubeToken) return;
        setAddingToId(playlistId);
        try {
            await addToPlaylist(playlistId, videoId, youtubeToken);
            toast({ title: "تمت الإضافة", description: "تمت إضافة الفيديو لقائمة التشغيل بنجاح." });
            onOpenChange(false);
        } catch (err) {
            console.error(err);
            toast({ variant: "destructive", title: "فشل الإضافة", description: "حدث خطأ أثناء محاولة الإضافة." });
        } finally {
            setAddingToId(null);
        }
    };

    const handleCreate = async () => {
        if (!youtubeToken || !newPlaylistTitle.trim()) return;
        setIsCreateLoading(true);
        try {
            const playlistId = await createPlaylist(newPlaylistTitle, 'private', youtubeToken);
            await addToPlaylist(playlistId, videoId, youtubeToken);
            toast({ title: "تم إنشاء القائمة والحفظ", description: "تم إنشاء قائمة التشغيل الجديدة وإضافة الفيديو إليها." });
            onOpenChange(false);
            setNewPlaylistTitle("");
            setIsCreating(false);
        } catch (err) {
            console.error(err);
            toast({ variant: "destructive", title: "فشل الإنشاء", description: (err as Error).message });
        } finally {
            setIsCreateLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-[#212121] border-white/10 text-white rounded-3xl p-6 rtl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-right text-xl font-bold flex items-center gap-3 justify-end">
                        <span className="flex-1">حفظ في قائمة تشغيل</span>
                        <ListMusic className="size-6 text-indigo-400" />
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar py-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <Loader2 className="size-8 animate-spin text-indigo-500" />
                            <p className="text-sm text-muted-foreground">جاري تحميل قوائمك...</p>
                        </div>
                    ) : playlists.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <p>ليس لديك قوائم تشغيل حالياً</p>
                        </div>
                    ) : (
                        playlists.map((pl) => (
                            <button
                                key={pl.id}
                                onClick={() => handleAdd(pl.id)}
                                disabled={!!addingToId}
                                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                        {pl.thumbnail ? (
                                            <img src={pl.thumbnail} className="size-full object-cover" />
                                        ) : (
                                            <ListMusic className="size-5 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm line-clamp-1">{pl.title}</p>
                                        <p className="text-[10px] text-muted-foreground">{pl.itemCount} فيديو</p>
                                    </div>
                                </div>
                                {addingToId === pl.id ? (
                                    <Loader2 className="size-4 animate-spin text-indigo-500" />
                                ) : (
                                    <Plus className="size-5 text-muted-foreground group-hover:text-white transition-colors" />
                                )}
                            </button>
                        ))
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                    {isCreating ? (
                        <div className="space-y-3">
                            <Input 
                                placeholder="اسم قائمة التشغيل الجديدة..." 
                                value={newPlaylistTitle}
                                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                                className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-indigo-500"
                            />
                            <div className="flex gap-2">
                                <Button 
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                                    onClick={handleCreate}
                                    disabled={isCreateLoading || !newPlaylistTitle.trim()}
                                >
                                    {isCreateLoading ? <Loader2 className="size-4 animate-spin" /> : "إنشاء وحفظ"}
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    className="px-4 rounded-xl border border-white/10"
                                    onClick={() => setIsCreating(false)}
                                >
                                    إلغاء
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button 
                            variant="ghost" 
                            className="w-full rounded-2xl h-12 gap-3 text-indigo-400 hover:bg-indigo-500/10"
                            onClick={() => setIsCreating(true)}
                        >
                            <Plus className="size-5" />
                            إنشاء قائمة تشغيل جديدة
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
