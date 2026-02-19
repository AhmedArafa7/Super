
"use client";

import React from "react";
import { 
  MessageSquare, Video, ShoppingBag, BookOpen, 
  ArrowRight, Wallet as WalletIcon, Sparkles, HardDrive, Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export function DashboardOverview({ user, wallet, usedSpace, storageLimitMB, storagePercentage, cachedAssets, onNavigate }: any) {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickActionCard icon={MessageSquare} title="الدردشة الذكية" desc="تواصل مع المحرك العصبي لحل مشاكلك التقنية." color="bg-blue-600" onClick={() => onNavigate?.("chat")} />
        <QuickActionCard icon={Video} title="StreamHub" desc="اكتشف أحدث البثوث والمقاطع التقنية اللامركزية." color="bg-indigo-600" onClick={() => onNavigate?.("stream")} />
        <QuickActionCard icon={ShoppingBag} title="TechMarket" desc="استحوذ على أحدث الأدوات والحلول البرمجية." color="bg-amber-600" onClick={() => onNavigate?.("market")} />
        <QuickActionCard icon={BookOpen} title="عقدة الإيمان" desc="أذكار، تسبيح، ومعرفة روحية في مكان واحد." color="bg-emerald-600" onClick={() => onNavigate?.("hisn")} />
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
              <HardDrive className="text-indigo-400" />
              الذاكرة المحلية
            </h3>
            <Badge className="bg-indigo-500">{storagePercentage}%</Badge>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                <span>{usedSpace.toFixed(1)} MB</span>
                <span>المساحة المستخدمة</span>
              </div>
              <Progress value={storagePercentage} className="h-1.5 bg-white/5" />
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] text-muted-foreground mb-2">آخر الأصول المزامنة:</p>
              <ScrollArea className="h-20">
                <div className="space-y-2">
                  {cachedAssets.slice(-3).reverse().map((a: any) => (
                    <div key={a.id} className="flex justify-between items-center flex-row-reverse">
                      <span className="text-[10px] text-white font-bold truncate max-w-[120px]">{a.title}</span>
                      <span className="text-[8px] text-indigo-400 uppercase">{a.type}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <Button variant="ghost" className="w-full mt-4 rounded-xl text-indigo-400 hover:bg-indigo-500/10 text-xs" onClick={() => onNavigate?.("hisn")}>
            إدارة الذاكرة العصبية
          </Button>
        </Card>
      </div>
    </div>
  );
}
