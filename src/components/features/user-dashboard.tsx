
"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Package, Shield, Upload, Loader2, CheckCircle2, 
  ShoppingBag, History, CreditCard, MessageSquare, 
  Briefcase, Zap, Video, BookOpen, GraduationCap, 
  ArrowRight, Bell, Wallet as WalletIcon, Sparkles, ShieldAlert 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/auth-store";
import { getTransactions, Transaction, useWalletStore } from "@/lib/wallet-store";
import { getReceivedOffers } from "@/lib/market-store";
import { getNotifications } from "@/lib/notification-store";
import { EmptyState } from "@/components/ui/empty-state";
import { OffersReceived } from "./offers-received";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  onClick: () => void;
  color: string;
}

const QuickActionCard = ({ icon: Icon, title, desc, onClick, color }: QuickActionProps) => (
  <Card 
    className="group glass border-white/5 hover:border-primary/40 rounded-[2rem] overflow-hidden transition-all duration-500 cursor-pointer shadow-xl hover:shadow-primary/10"
    onClick={onClick}
  >
    <CardContent className="p-6">
      <div className={cn("size-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", color)}>
        <Icon className="size-6 text-white" />
      </div>
      <h3 dir="auto" className="text-lg font-bold text-white mb-1 text-right">{title}</h3>
      <p dir="auto" className="text-xs text-muted-foreground leading-relaxed text-right">{desc}</p>
      <div className="mt-4 flex items-center justify-end gap-2 text-primary font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        دخول الآن <ArrowRight className="size-3" />
      </div>
    </CardContent>
  </Card>
);

export function UserDashboard({ onNavigate }: { onNavigate?: (tab: any) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const wallet = useWalletStore(state => state.wallet);
  
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [pendingOffersCount, setPendingOffersCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadOrders();
      loadOffersCount();
      setUnreadNotifications(getNotifications(user.id).filter(n => !n.isRead).length);
    }
  }, [user?.id]);

  const loadOrders = async () => {
    if (!user?.id) return;
    setIsLoadingOrders(true);
    try {
      const allTx = await getTransactions(user.id);
      if (Array.isArray(allTx)) {
        const purchaseTxs = allTx.filter(tx => 
          tx.type === 'purchase_hold' || tx.type === 'purchase_release' || tx.type === 'purchase_refund'
        );
        setOrders(purchaseTxs);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to load orders", err);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadOffersCount = async () => {
    if (!user?.id) return;
    try {
      const offers = await getReceivedOffers(user.id);
      setPendingOffersCount(offers.filter(o => o.status === 'pending').length);
    } catch (err) {
      console.error("Failed to load offers count", err);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user?.id || !displayName.trim()) return;
    setIsUpdating(true);
    try {
      await updateUserProfile(user.id, { name: displayName });
      toast({ title: "Profile Updated", description: "Your neural identity has been synchronized." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-row-reverse">
          <div className="size-16 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl">
            <Sparkles className="size-8 text-primary animate-pulse" />
          </div>
          <div className="text-right">
            <h2 dir="auto" className="text-4xl font-headline font-bold text-white tracking-tight">
              أهلاً بك، {user?.name}
            </h2>
            <p className="text-muted-foreground mt-1">نظام NexusAI جاهز لتنفيذ أوامرك.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="border-indigo-500/30 text-indigo-400 rounded-xl font-bold gap-2"
            onClick={() => onNavigate?.("admin")}
          >
            <ShieldAlert className="size-4" />
            Neural Console
          </Button>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2 rounded-xl text-xs font-bold">
            <Zap className="size-3 mr-2 inline" /> Node Active
          </Badge>
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 flex flex-wrap h-auto gap-1 flex-row-reverse">
          <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary flex-1 sm:flex-none">
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary flex-1 sm:flex-none">
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="business" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary flex-1 sm:flex-none relative">
            مركز الأعمال
            {pendingOffersCount > 0 && (
              <Badge className="ml-2 bg-red-500 h-4 w-4 p-0 flex items-center justify-center text-[8px] rounded-full">
                {pendingOffersCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary flex-1 sm:flex-none">
            سجل العمليات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard 
              icon={MessageSquare} 
              title="الدردشة الذكية" 
              desc="تواصل مع المحرك العصبي لحل مشاكلك التقنية."
              color="bg-blue-600"
              onClick={() => onNavigate?.("chat")}
            />
            <QuickActionCard 
              icon={Video} 
              title="StreamHub" 
              desc="اكتشف أحدث البثوث والمقاطع التقنية اللامركزية."
              color="bg-indigo-600"
              onClick={() => onNavigate?.("stream")}
            />
            <QuickActionCard 
              icon={ShoppingBag} 
              title="TechMarket" 
              desc="استحوذ على أحدث الأدوات والحلول البرمجية."
              color="bg-amber-600"
              onClick={() => onNavigate?.("market")}
            />
            <QuickActionCard 
              icon={BookOpen} 
              title="عقدة الإيمان" 
              desc="أذكار، تسبيح، ومعرفة روحية في مكان واحد."
              color="bg-emerald-600"
              onClick={() => onNavigate?.("hisn")}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 glass border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 size-64 bg-primary/5 blur-[80px] -mr-32 -mt-32" />
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 justify-end">
                حالة المحفظة العصبية
                <WalletIcon className="text-primary" />
              </h3>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8 bg-white/5 p-8 rounded-[2rem] border border-white/5 flex-row-reverse">
                <div className="text-center sm:text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] mb-2">الرصيد المتاح</p>
                  <div className="flex items-baseline gap-2 justify-center sm:justify-end">
                    <span className="text-5xl font-black text-white tracking-tighter">{wallet?.balance.toLocaleString() || '0'}</span>
                    <span className="text-primary font-bold text-sm">Credits</span>
                  </div>
                </div>
                <div className="h-12 w-px bg-white/10 hidden sm:block" />
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <Button className="bg-primary rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20" onClick={() => onNavigate?.("wallet")}>
                    إدارة المحفظة
                  </Button>
                  <p className="text-[9px] text-muted-foreground text-center italic">تشفير E2EE نشط لجميع الحركات</p>
                </div>
              </div>
            </Card>

            <Card className="glass border-white/5 rounded-[2.5rem] p-8 flex flex-col text-right">
              <div className="flex items-center justify-between mb-6 flex-row-reverse">
                <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-row-reverse">
                  <Bell className="text-indigo-400" />
                  آخر التنبيهات
                </h3>
                {unreadNotifications > 0 && <Badge className="bg-indigo-500">{unreadNotifications}</Badge>}
              </div>
              <ScrollArea className="flex-1 max-h-[200px]">
                <div className="space-y-4">
                  {unreadNotifications === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8 italic">لا توجد تنبيهات جديدة في العقدة.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p dir="auto" className="text-xs text-white font-medium text-right">تمت ترقية البروتوكول إلى v4.2</p>
                        <span className="text-[9px] text-muted-foreground">منذ ساعة</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <Button variant="ghost" className="w-full mt-4 rounded-xl text-indigo-400 hover:bg-indigo-500/10 text-xs" onClick={() => onNavigate?.("notifications")}>
                عرض كل التنبيهات
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="glass border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center">
              <div className="relative group mb-6">
                <div className="size-32 rounded-[2.5rem] bg-indigo-500/10 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                  <User className="size-12 text-muted-foreground" />
                </div>
              </div>
              <h3 dir="auto" className="text-xl font-bold text-white">{user?.name}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">@{user?.username}</p>
              <Badge variant="outline" className="mt-4 border-indigo-500/30 text-indigo-400 capitalize">{user?.role} Node</Badge>
            </Card>

            <Card className="lg:col-span-2 glass border-white/5 rounded-[2.5rem] p-8">
              <CardHeader className="px-0 pt-0 text-right">
                <CardTitle>إعدادات الهوية</CardTitle>
                <CardDescription>تحديث معلومات العقدة العامة الخاصة بك.</CardDescription>
              </CardHeader>
              <div className="space-y-6 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName" className="text-right">الاسم المعروض</Label>
                  <Input 
                    id="displayName" 
                    dir="auto"
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-white/5 border-white/10 h-12 rounded-xl text-right"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username" className="text-right">معرف Nexus (Username)</Label>
                  <Input 
                    id="username" 
                    value={user?.username} 
                    disabled 
                    className="bg-white/5 border-white/10 h-12 rounded-xl opacity-50 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-muted-foreground italic text-right">لا يمكن تعديل معرفات Nexus بمجرد تثبيتها.</p>
                </div>
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isUpdating || displayName === user?.name}
                  className="bg-primary rounded-xl h-12 px-8 shadow-lg shadow-primary/20 w-full sm:w-auto"
                >
                  {isUpdating ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                  مزامنة البيانات
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business" className="animate-in fade-in duration-500">
           <OffersReceived />
        </TabsContent>

        <TabsContent value="orders">
          <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                سجل الاستحواذ
                <History className="size-5 text-indigo-400" />
              </CardTitle>
              <CardDescription>سجل موثق لجميع عمليات المزامنة في المتجر.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {isLoadingOrders ? (
                  <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
                ) : orders.length === 0 ? (
                  <EmptyState 
                    icon={ShoppingBag}
                    title="لا توجد عمليات استحواذ"
                    description="لم تقم بإجراء أي عمليات شراء أو تبادل في المتجر بعد."
                    className="py-20"
                  />
                ) : (
                  <div className="divide-y divide-white/5">
                    {orders.map((order) => (
                      <div key={order.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group flex-row-reverse">
                        <div className="text-right">
                          <p className="font-bold text-lg text-white">
                            {Math.abs(order.amount).toLocaleString()} <span className="text-[10px] text-muted-foreground uppercase">Credits</span>
                          </p>
                          <Badge variant="outline" className={cn(
                            "text-[9px] h-4 border-white/10",
                            order.type === 'purchase_hold' ? "text-amber-400" : "text-green-400"
                          )}>
                            {order.type === 'purchase_hold' ? 'إيداع تأمين' : 'مكتمل'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 flex-row-reverse">
                          <div className="text-right">
                            <p dir="auto" className="font-bold text-white text-sm">{order.description}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                              {formatDistanceToNow(new Date(order.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="size-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-white/5">
                            {order.type === 'purchase_hold' ? <ClockIcon className="size-4 text-amber-400" /> : <Package className="size-4 text-green-400" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
