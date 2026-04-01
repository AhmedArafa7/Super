"use client";

import React, { useState, useEffect } from "react";
import { DownloadCloud, HardDrive, Layers, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DeploymentOptions } from "./downloads/deployment-options";
import { StorageManagement } from "./downloads/storage-management";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * [STABILITY_ANCHOR: DOWNLOAD_CENTER_V2.0]
 * المنسق الرئيسي لمركز التحميل — Nexus V2
 */
export function DownloadCenter() {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'deployment' | 'storage'>('deployment');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast({ 
        title: "التطبيق مثبت بالفعل", 
        description: "يمكنك فتح NexusAI مباشرة من قائمة تطبيقاتك أو سطح المكتب." 
      });
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      toast({ title: "بدأ التثبيت", description: "يتم الآن إضافة نكسوس إلى جهازك." });
    }
  };

  const VIEWS = [
    { id: 'deployment' as const, label: 'خيارات التثبيت', icon: Layers },
    { id: 'storage' as const, label: 'إدارة الذاكرة', icon: Database },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 font-sans text-right">
      
      {/* ═══ V2 HEADER ═══ */}
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-row-reverse">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
              <DownloadCloud className="size-3 text-primary" />
              <span className="text-[10px] uppercase font-black text-primary tracking-widest">Sovereign Asset Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
              مركز التحميل والذاكرة
              <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-2xl shadow-primary/30">
                <HardDrive className="size-7 text-white" />
              </div>
            </h1>
            <p className="text-muted-foreground text-base max-w-2xl">
              اختر المنصة المناسبة لتشغيل نكسوس، وراقب المساحة المخصصة لكل قطاع في عقدتك.
            </p>
          </div>

          {/* Toggle */}
          <div className="bg-white/5 border border-white/10 p-1 rounded-2xl flex gap-1 shadow-xl shrink-0">
            {VIEWS.map((view) => (
              <Button
                key={view.id}
                variant={activeView === view.id ? 'default' : 'ghost'}
                onClick={() => setActiveView(view.id)}
                className="rounded-xl px-5 h-10 font-bold text-sm gap-2"
              >
                <view.icon className="size-4" />
                {view.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </header>

      {/* ═══ CONTENT ═══ */}
      {activeView === 'deployment' ? (
        <DeploymentOptions
          onInstallPWA={handleInstallPWA}
          onDownloadApk={() => {}}
          deferredPrompt={deferredPrompt}
        />
      ) : (
        <StorageManagement />
      )}
    </div>
  );
}
