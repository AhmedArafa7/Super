"use client";

import React, { useState } from "react";
import { 
  MessageCircle, 
  Send, 
  Instagram, 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  Loader2,
  Plus,
  ArrowRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  icon: any;
  color: string;
  isConnected: boolean;
  description: string;
}

const CHANNELS: Channel[] = [
  { 
    id: 'whatsapp', 
    name: 'WhatsApp', 
    icon: MessageCircle, 
    color: 'text-emerald-500', 
    isConnected: false,
    description: 'ربط حسابك الشخصي لمراسلة أصدقائك مباشرة.'
  },
  { 
    id: 'telegram', 
    name: 'Telegram', 
    icon: Send, 
    color: 'text-sky-500', 
    isConnected: false,
    description: 'مزامنة محادثات تليجرام الشخصية والقنوات.'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: Instagram, 
    color: 'text-pink-500', 
    isConnected: false,
    description: 'إدارة رسائل إنستقرام المباشرة (Direct).'
  }
];

export function ChannelManager() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState(1); // 1: Select, 2: Connect/Scan

  const channelInfo = CHANNELS.find(c => c.id === selectedChannel);

  const startConnection = () => {
    setIsConnecting(true);
    // محاكاة عملية الربط
    setTimeout(() => {
      setIsConnecting(false);
      setStep(2);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight">قنوات التواصل (Hub)</h2>
          <p className="text-slate-400 font-medium">اربط حساباتك الشخصية لمركزة جميع محادثاتك في مكان واحد.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CHANNELS.map((channel) => (
          <Card 
            key={channel.id}
            onClick={() => {
              setSelectedChannel(channel.id);
              setStep(1);
            }}
            className={cn(
              "p-6 bg-slate-900/40 border-white/5 rounded-[2rem] cursor-pointer transition-all hover:scale-105 active:scale-95 group",
              selectedChannel === channel.id ? "ring-2 ring-primary border-primary/20 bg-primary/5" : "hover:bg-slate-900/60"
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-4 rounded-2xl bg-white/5 transition-colors group-hover:bg-white/10", channel.color)}>
                <channel.icon className="size-6" />
              </div>
              {channel.isConnected ? (
                <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">متصل</div>
              ) : (
                <div className="bg-white/5 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">غير مربوط</div>
              )}
            </div>
            <h3 className="text-lg font-black text-white mb-2">{channel.name}</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{channel.description}</p>
          </Card>
        ))}
      </div>

      {selectedChannel && (
        <div className="flex-1 bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
          {selectedChannel === 'whatsapp' && step === 2 ? (
            <div className="space-y-8 max-w-md">
              <div className="bg-white p-4 rounded-[2rem] shadow-[0_0_50px_rgba(255,255,255,0.1)] inline-block relative group">
                <QrCode className="size-48 text-slate-900" />
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]">
                   <Button variant="ghost" size="sm" className="text-slate-900 font-bold">تحديث الرمز</Button>
                </div>
              </div>
              <div className="space-y-4">
                 <h3 className="text-2xl font-black text-white">امسح الرمز لربط الواتساب</h3>
                 <div className="text-right space-y-3 text-sm text-slate-400">
                    <div className="flex items-center gap-3 flex-row-reverse">
                       <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                       <p>افتح تطبيق واتساب على هاتفك</p>
                    </div>
                    <div className="flex items-center gap-3 flex-row-reverse">
                       <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">2</span>
                       <p>اضغط على القائمة (أو الإعدادات) واختر الأجهزة المرتبطة</p>
                    </div>
                    <div className="flex items-center gap-3 flex-row-reverse">
                       <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">3</span>
                       <p>اضغط على "ربط جهاز" ووجه الكاميرا لهذه الشاشة</p>
                    </div>
                 </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="border-white/10 text-slate-400 hover:text-white rounded-xl"
              >
                إلغاء العملية
              </Button>
            </div>
          ) : (
            <div className="max-w-xl space-y-6">
              <div className={cn("size-20 mx-auto rounded-3xl flex items-center justify-center bg-white/5", channelInfo?.color)}>
                {channelInfo && <channelInfo.icon className="size-10" />}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">تفعيل ربط {channelInfo?.name}</h3>
                <p className="text-slate-400 font-medium">عند التفعيل، ستتمكن من استقبال وإرسال الرسائل مباشرة من واجهة Nexus AI. نقوم بتشفير جميع البيانات لضمان خصوصيتك.</p>
              </div>
              <div className="flex items-center justify-center gap-4">
                 <Button 
                    onClick={startConnection}
                    disabled={isConnecting}
                    className="bg-primary hover:bg-primary/90 text-white font-black px-10 h-14 rounded-2xl gap-3 text-lg"
                 >
                    {isConnecting ? <Loader2 className="size-6 animate-spin" /> : <Smartphone className="size-6" />}
                    ابدأ عملية الربط
                 </Button>
                 <Button variant="ghost" className="h-14 px-8 rounded-2xl font-bold hover:bg-white/5">اقرأ المزيد</Button>
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 w-fit mx-auto px-4 py-2 rounded-full">
                 <Info className="size-3" />
                 لا نقوم بتخزين كلمات السر أو الرسائل الخاصة على سيرفراتنا
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
