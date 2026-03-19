"use client";

import React, { useState } from "react";
import { 
  Cpu, Terminal, Files, CircuitBoard, Settings, Play, Blocks, Layers, ShieldCheck, 
  Plug, Zap, Share2, PanelBottom, PanelBottomClose, Code2, MonitorPlay
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMicroIDEStore } from "@/lib/micro-ide-store";

// Board Definitions
const BOARDS = [
  { id: "arduino-uno", name: "Arduino Uno", icon: "🇮🇹", mcu: "ATmega328P" },
  { id: "arduino-mega", name: "Arduino Mega", icon: "🎛️", mcu: "ATmega2560" },
  { id: "esp32", name: "ESP32 WiFi/BT", icon: "🌐", mcu: "Xtensa Core" },
  { id: "pi-pico", name: "Raspberry Pi Pico", icon: "🍓", mcu: "RP2040" },
];

export function MicrocontrollerLab() {
  const { 
    selectedBoardId, 
    setSelectedBoardId,
    activeViewMode,
    setActiveViewMode,
    activeSidebarView,
    setActiveSidebarView,
    isTerminalOpen,
    toggleTerminal,
    codeContent,
    setCodeContent
  } = useMicroIDEStore();

  const [simKey, setSimKey] = useState(0);

  const getEmbedUrl = () => {
    return `https://wokwi.com/projects/new/${selectedBoardId}?embed=1`;
  };

  const selectedBoardDetails = BOARDS.find(b => b.id === selectedBoardId);

  // Layout Components
  const ActivityBar = () => (
    <div className="w-14 bg-[#111317] border-l border-white/5 flex flex-col items-center py-4 gap-4 z-20 shrink-0">
      <div className="size-8 bg-indigo-500 rounded-lg flex items-center justify-center mb-4 text-white shadow-lg shadow-indigo-500/20">
        <Cpu className="size-5" />
      </div>
      
      {/* Activity Icons */}
      <TooltipButton icon={<Files className="size-5" />} tooltip="المفات (Explorer)" active={activeSidebarView === 'explorer'} onClick={() => setActiveSidebarView(activeSidebarView === 'explorer' ? null : 'explorer')} />
      <TooltipButton icon={<CircuitBoard className="size-5" />} tooltip="لوحات التطوير (Boards)" active={activeSidebarView === 'boards'} onClick={() => setActiveSidebarView(activeSidebarView === 'boards' ? null : 'boards')} />
      <TooltipButton icon={<Blocks className="size-5" />} tooltip="المكتبات (Libraries)" active={activeSidebarView === 'extensions'} onClick={() => setActiveSidebarView(activeSidebarView === 'extensions' ? null : 'extensions')} />
      
      <div className="mt-auto flex flex-col gap-4">
        <TooltipButton icon={<Settings className="size-5" />} tooltip="الإعدادات (Settings)" active={activeSidebarView === 'settings'} onClick={() => setActiveSidebarView(activeSidebarView === 'settings' ? null : 'settings')} />
      </div>
    </div>
  );

  const SidebarPanel = () => {
    if (!activeSidebarView) return null;

    return (
      <div className="w-64 bg-[#181a1f] border-l border-white/5 flex flex-col font-sans shrink-0">
        <div className="h-12 flex items-center px-4 uppercase tracking-widest text-[10px] font-bold text-slate-400 border-b border-white/5 justify-end">
          {activeSidebarView === 'explorer' && 'مدير الملفات'}
          {activeSidebarView === 'boards' && 'لوحات التطوير'}
          {activeSidebarView === 'extensions' && 'المكتبات'}
          {activeSidebarView === 'settings' && 'الإعدادات'}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeSidebarView === 'boards' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground text-right mb-4">اختر البوردة المراد العمل عليها. سيتم تحديث المحاكي فوراً.</p>
              {BOARDS.map(board => (
                 <button
                   key={board.id}
                   onClick={() => { setSelectedBoardId(board.id); setSimKey(simKey + 1); }}
                   className={cn(
                      "w-full flex flex-col gap-2 p-3 rounded-xl transition-all border text-right",
                      selectedBoardId === board.id 
                         ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300" 
                         : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                   )}
                 >
                   <div className="flex justify-between items-center w-full">
                     <span className="text-lg">{board.icon}</span>
                     <span className="font-bold text-sm text-slate-200">{board.name}</span>
                   </div>
                   <span className="text-[10px] text-muted-foreground uppercase">{board.mcu}</span>
                 </button>
              ))}
            </div>
          )}

          {activeSidebarView === 'explorer' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
              <Files className="size-8 opacity-20" />
              <p className="text-xs text-center px-4">سيتم ربط مدير الملفات بـ Vault قريباً.</p>
            </div>
          )}

          {activeSidebarView === 'extensions' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
              <Blocks className="size-8 opacity-20" />
              <p className="text-xs text-center px-4">مدير المكتبات (Library Manager) قيد التطوير.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const MainEditorTabs = () => (
    <div className="h-10 bg-[#1e2129] flex items-center border-b border-white/5 gap-1 px-2 shrink-0 flex-row-reverse overflow-x-auto">
      <button 
        onClick={() => setActiveViewMode('simulator')}
        className={cn(
          "h-full px-5 flex items-center gap-2 text-xs font-medium font-sans border-t-2 transition-colors",
          activeViewMode === 'simulator' ? "bg-[#282c34] text-white border-indigo-500" : "text-slate-500 border-transparent hover:bg-white/5"
        )}
      >
        <MonitorPlay className="size-3.5 text-emerald-400" />
        Wokwi Simulator
      </button>

      <button 
        onClick={() => setActiveViewMode('editor')}
        className={cn(
          "h-full px-5 flex items-center gap-2 text-xs font-medium font-sans border-t-2 transition-colors",
          activeViewMode === 'editor' ? "bg-[#282c34] text-white border-amber-500" : "text-slate-500 border-transparent hover:bg-white/5"
        )}
      >
        <Code2 className="size-3.5 text-amber-500" />
        main.ino
      </button>

      <div className="ml-auto mr-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTerminal} className="size-7 text-slate-400 hover:text-white rounded flex-row-reverse">
          {isTerminalOpen ? <PanelBottomClose className="size-4" /> : <PanelBottom className="size-4" />}
        </Button>
      </div>
    </div>
  );

  const EditorView = () => (
    <div className="flex flex-col h-full bg-[#282c34] relative">
      {/* Code Editor Placeholder (Monaco Editor to be added) */}
      <textarea 
        value={codeContent}
        onChange={(e) => setCodeContent(e.target.value)}
        className="w-full h-full bg-transparent text-slate-300 font-mono text-sm p-4 outline-none resize-none leading-relaxed"
        spellCheck={false}
      />
      
      {/* Absolute Header Overlay representing future actions */}
      <div className="absolute top-4 left-4 flex gap-2">
         <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg h-9 rounded-lg text-xs gap-2 px-4 shadow-emerald-500/20 font-bold">
           Run Setup <Play className="size-3.5" />
         </Button>
      </div>
    </div>
  );

  const SimulatorView = () => (
    <div className="flex-1 w-full bg-[#0a0a0f] relative overflow-hidden">
      <iframe 
        key={simKey}
        src={getEmbedUrl()}
        className="absolute inset-0 w-full h-full border-none"
        title="Microcontroller IDE Simulator"
        allow="clipboard-write"
      />
    </div>
  );

  const BottomTerminal = () => {
    if (!isTerminalOpen) return null;

    return (
      <div className="h-48 bg-[#181a1f] border-t border-white/5 border-l shrink-0 flex flex-col font-sans">
        <div className="h-9 flex items-center px-4 border-b border-white/5 gap-6 flex-row-reverse text-xs font-medium">
          <button className="h-full border-b-2 border-indigo-500 text-white">SERIAL MONITOR</button>
          <button className="h-full border-b-2 border-transparent text-slate-500 hover:text-slate-300">TERMINAL</button>
          <button className="h-full border-b-2 border-transparent text-slate-500 hover:text-slate-300">PROBLEMS</button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto text-xs font-mono text-emerald-400 bg-black/40 text-left">
          <p>Nexus Serial Port Handler [v1.0.0]</p>
          <p>Waiting for connection...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full bg-[#1e2129] overflow-hidden flex-row-reverse">
      <ActivityBar />
      <SidebarPanel />

      <div className="flex-1 flex flex-col min-w-0">
        <MainEditorTabs />
        
        <div className="flex-1 overflow-hidden flex flex-col relative border-l border-white/5 bg-[#282c34]">
          {activeViewMode === 'simulator' ? <SimulatorView /> : <EditorView />}
        </div>

        <BottomTerminal />
      </div>
    </div>
  );
}

// Simple internal helper component
function TooltipButton({ icon, tooltip, active, onClick }: { icon: React.ReactNode, tooltip: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      title={tooltip}
      className={cn(
        "relative rounded-lg size-11 flex items-center justify-center transition-all",
        active ? "text-white" : "text-slate-500 hover:text-slate-300"
      )}
    >
      {icon}
      {active && <div className="absolute top-2 bottom-2 right-[-1px] w-[3px] bg-indigo-500 rounded-l-full" />}
    </button>
  );
}
