
"use client";

import React, { useEffect, useState } from "react";
import { Bell, ArrowRight, History, Edit3, MessageCircle, Clock, Info, AlertTriangle, ShieldAlert, Video, ShoppingBag, GraduationCap, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNotifications, AppNotification, markNotificationAsRead } from "@/lib/notification-store";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/auth-provider";

interface NotificationsViewProps {
  onSmartRoute: (notification: AppNotification) => void;
}

export function NotificationsView({ onSmartRoute }: NotificationsViewProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedBroadcast, setSelectedBroadcast] = useState<AppNotification | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = () => {
      setNotifications(getNotifications(user.id));
    };
    load();
    window.addEventListener('notifications-update', load);
    return () => window.removeEventListener('notifications-update', load);
  }, [user]);

  const getTypeIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'chat_correction': return <Edit3 className="size-4" />;
      case 'system_broadcast': return <Info className="size-4" />;
      case 'content_new': return <Video className="size-4" />;
      case 'market_restock': return <ShoppingBag className="size-4" />;
      case 'learning_reminder': return <GraduationCap className="size-4" />;
      default: return <Bell className="size-4" />;
    }
  };

  const getPriorityStyles = (notification: AppNotification) => {
    if (notification.type !== 'system_broadcast') return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    switch (notification.priority) {
      case 'critical': return "bg-red-500/10 text-red-400 border-red-500/20";
      case 'warning': return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const handleAction = (n: AppNotification) => {
    markNotificationAsRead(n.id);
    if (n.type === 'system_broadcast') {
      setSelectedBroadcast(n);
    } else {
      onSmartRoute(n);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
            <Bell className="text-indigo-400" />
            Neural Hub
          </h2>
          <p className="text-muted-foreground mt-2">Centralized alerts, updates, and neural notifications.</p>
        </div>
        <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 px-4 py-1">
          {notifications.length} Total
        </Badge>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-4 pb-10">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl opacity-50 border-dashed border-2">
              <History className="size-12 mb-4" />
              <p className="text-lg">No notifications in the hub.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={cn(
                  "group p-6 glass border-white/5 hover:border-indigo-500/30 rounded-[2rem] transition-all duration-300 shadow-xl relative",
                  !n.isRead && "border-indigo-500/20 bg-indigo-500/5"
                )}
              >
                {!n.isRead && (
                  <div className="absolute top-6 right-6 size-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,1)]" />
                )}
                
                <div className="flex items-start gap-4 mb-4">
                  <div className={cn("size-10 rounded-2xl flex items-center justify-center border", getPriorityStyles(n))}>
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-sm">{n.title}</h3>
                      <Badge variant="outline" className="text-[9px] h-4 border-white/10 opacity-60 uppercase">{n.type.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2 opacity-60">
                      <Clock className="size-3" />
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleAction(n)}
                  variant="ghost"
                  className="w-full mt-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl transition-all"
                >
                  {n.type === 'system_broadcast' ? 'View Details' : 'Smart Jump'}
                  <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Broadcast Modal */}
      <Dialog open={!!selectedBroadcast} onOpenChange={() => setSelectedBroadcast(null)}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 rounded-3xl">
          <DialogHeader>
            <div className={cn(
              "size-12 rounded-2xl flex items-center justify-center border mb-4",
              selectedBroadcast ? getPriorityStyles(selectedBroadcast) : ""
            )}>
              <ShieldAlert className="size-6" />
            </div>
            <DialogTitle className="text-2xl font-bold">{selectedBroadcast?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              System Broadcast • {selectedBroadcast && formatDistanceToNow(new Date(selectedBroadcast.timestamp), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <p className="text-white/80 leading-relaxed whitespace-pre-wrap bg-white/5 p-6 rounded-2xl border border-white/5 italic">
              "{selectedBroadcast?.message}"
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectedBroadcast(null)} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl">Dismiss Acknowledged</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
