"use client";

import React, { useState, useRef } from "react";
import { 
  Cpu, Files, CircuitBoard, Settings, Play, Blocks, PanelBottom, 
  PanelBottomClose, Code2, MonitorPlay, Link2, Link2Off, Radio, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMicroIDEStore } from "@/lib/micro-ide-store";
import { toast } from "@/hooks/use-toast";

// Modular Imports
import { webSerialEngine } from "@/lib/web-serial-engine";
import { SerialMonitor } from "@/components/shared/serial-monitor";

const BOARDS = [
  { id: "arduino-uno", name: "Arduino Uno", icon: "🇮🇹", mcu: "ATmega328P" },
  { id: "arduino-mega", name: "Arduino Mega", icon: "🎛️", mcu: "ATmega2560" },
  { id: "esp32", name: "ESP32 WiFi/BT", icon: "🌐", mcu: "Xtensa Core" },
  { id: "pi-pico", name: "Raspberry Pi Pico", icon: "🍓", mcu: "RP2040" },
];

export function MicrocontrollerLab() {
  const { 
    selectedBoardId, setSelectedBoardId, activeViewMode, setActiveViewMode,
    activeSidebarView, setActiveSidebarView, isTerminalOpen, toggleTerminal,
    codeContent, setCodeContent
  } = useMicroIDEStore();

  const [simKey, setSimKey] = useState(0);
  const [port, setPort] = useState<any>(null);
  const [serialLog, setSerialLog] = useState<string[]>([]);
  const isReadingRef = useRef(false);

  // Connection Management
  const handleConnect = async () => {
    try {
      const p = await webSerialEngine.requestPort();
      setPort(p);
      isReadingRef.current = true;
      toast({ title: "متصل بنجاح" });
      
      // Start background reading
      webSerialEngine.readStream(p, (data) => {
        setSerialLog(prev => [...prev.slice(-100), data]);
      }, { get isReading() { return isReadingRef.current } });
      
    } catch (e: any) {
      toast({ title: "فشل الاتصال", description: e.message, variant: "destructive" });
    }
  };

  const handleDisconnect = async () => {
    isReadingRef.current = false;
    await webSerialEngine.closePort(port);
    setPort(null);
    toast({ title: "تم قطع الاتصال" });
  };

  return (
    <div className="flex h-full w-full bg-[#1a1c22] overflow-hidden flex-row-reverse">
      {/* Activity Bar */}
      <div className="w-14 bg-[#0d0f12] border-l border-white/5 flex flex-col items-center py-4 gap-4 z-20 shrink-0">
        <div className="size-9 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-indigo-500/20"><Cpu className="size-5" /></div>
        <TooltipButton icon={<Files className="size-5" />} active={activeSidebarView === 'explorer'} onClick={() => setActiveSidebarView('explorer')} />
        <TooltipButton icon={<CircuitBoard className="size-5" />} active={activeSidebarView === 'boards'} onClick={() => setActiveSidebarView('boards')} />
        <TooltipButton icon={<Radio className="size-5" />} active={activeSidebarView === 'serial'} onClick={() => setActiveSidebarView('serial')} />
        <div className="mt-auto"><TooltipButton icon={<Settings className="size-5" />} active={activeSidebarView === 'settings'} onClick={() => setActiveSidebarView('settings')} /></div>
      </div>

      {/* Sidebar Panel */}
      {activeSidebarView && (
        <div className="w-72 bg-[#14161c] border-l border-white/5 flex flex-col font-sans shrink-0">
           <div className="h-12 flex items-center px-4 uppercase tracking-widest text-[10px] font-bold text-indigo-400 border-b border-white/5 justify-end">
              {activeSidebarView === 'boards' && 'لوحات التطوير'}
              {activeSidebarView === 'serial' && 'الاتصال المباشر'}
           </div>
           <div className="flex-1 p-4">
              {activeSidebarView === 'boards' && (
                <div className="space-y-2">
                  {BOARDS.map(b => (
                    <button key={b.id} onClick={() => setSelectedBoardId(b.id)} className={cn("w-full p-3 rounded-xl border text-right transition-all", selectedBoardId === b.id ? "bg-indigo-500/10 border-indigo-500/40" : "bg-white/5 border-transparent")}>
                      <span className="text-sm font-bold block">{b.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {activeSidebarView === 'serial' && (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                   <Button onClick={port ? handleDisconnect : handleConnect} className={cn("w-full h-11 rounded-xl gap-2", port ? "bg-red-600/20 text-red-400" : "bg-primary")}>
                      {port ? <Link2Off className="size-4" /> : <Link2 className="size-4" />}
                      {port ? "قطع الاتصال" : "اتصال بالجهاز"}
                   </Button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 bg-[#1a1c22] flex items-center border-b border-white/5 px-4 flex-row-reverse">
           <button onClick={() => setActiveViewMode('simulator')} className={cn("h-full px-4 text-xs font-bold border-t-2", activeViewMode === 'simulator' ? "text-indigo-400 border-indigo-500" : "text-slate-500 border-transparent")}>Wokwi Simulation</button>
           <button onClick={() => setActiveViewMode('editor')} className={cn("h-full px-4 text-xs font-bold border-t-2", activeViewMode === 'editor' ? "text-amber-500 border-amber-500" : "text-slate-500 border-transparent")}>main.ino</button>
           <div className="mr-auto flex items-center gap-3">
              <Button variant="ghost" size="sm" className="h-8 rounded-lg bg-indigo-500/10 text-indigo-400 gap-2 px-4"><Zap className="size-3.5" /> Flash</Button>
              <Button variant="ghost" size="icon" onClick={toggleTerminal} className="size-8 text-slate-500">{isTerminalOpen ? <PanelBottomClose className="size-5" /> : <PanelBottom className="size-5" />}</Button>
           </div>
        </header>
        
        <div className="flex-1 overflow-hidden relative bg-[#21252b]">
          {activeViewMode === 'simulator' ? (
            <iframe key={simKey} src={`https://wokwi.com/projects/new/${selectedBoardId}?embed=1`} className="absolute inset-0 w-full h-full border-none" />
          ) : (
            <textarea value={codeContent} onChange={(e) => setCodeContent(e.target.value)} className="w-full h-full bg-transparent text-slate-300 font-mono text-sm p-6 outline-none resize-none" spellCheck={false} />
          )}
        </div>

        {isTerminalOpen && (
          <div className="h-64 bg-[#0d0f12] border-t border-white/5 shrink-0 flex flex-col">
             <SerialMonitor logs={serialLog} onClear={() => setSerialLog([])} status={port ? 'connected' : 'disconnected'} />
          </div>
        )}
      </div>
    </div>
  );
}

function TooltipButton({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("rounded-xl size-10 flex items-center justify-center transition-all", active ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-white/5")}>
      {icon}
    </button>
  );
}
