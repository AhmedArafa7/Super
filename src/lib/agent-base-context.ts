
"use client";

/**
 * [STABILITY_ANCHOR: AGENT_BASE_CONTEXT_V2.0]
 * This file provides a 'Neural Base Context' for the Sandpack preview engine.
 * Improved with professional viewport control and responsive layout mocks.
 */

export const BASE_PROJECT_CONTEXT: Record<string, string> = {
  "/public/index.html": `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Nexus Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { margin: 0; padding: 0; overflow: hidden; background: #0f172a; }
      #root { height: 100vh; width: 100vw; }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
  "/src/components/layout/app-shell.tsx": `
'use client';
import React, { useState, useEffect } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/components/auth/auth-provider";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!isAuthenticated) return <div>Please Login (Simulated)</div>;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-950 text-white overflow-hidden relative">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} user={user} />
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <AppHeader onTabChange={setActiveTab} />
          <main className="flex-1 overflow-y-auto bg-slate-900/20 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
`,
  "/src/components/auth/auth-provider.tsx": `
'use client';
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState({ 
    id: "preview-user", 
    name: "مستخدم المعاينة", 
    username: "neural_user",
    role: "founder" 
  });
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: true, 
      login: async () => true, 
      logout: () => {} 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
`,
  "/src/components/layout/app-header.tsx": `
import React from "react";
import { Menu, Search, User } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function AppHeader({ onTabChange }: any) {
  const { open, setOpen } = useSidebar();
  
  return (
    <header className="h-14 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-4 z-20 flex-row-reverse shrink-0">
      <div className="flex items-center gap-3 flex-row-reverse">
        <button 
          onClick={() => setOpen(!open)}
          className="p-2 hover:bg-white/5 rounded-lg text-slate-400 block"
        >
          <Menu size={18} />
        </button>
        <h2 className="text-xs font-bold text-white truncate max-w-[120px]">Nexus Preview</h2>
      </div>
      <div className="flex items-center gap-2">
        <div className="size-8 bg-indigo-600/20 rounded-full flex items-center justify-center border border-indigo-500/20">
          <User size={14} className="text-indigo-400" />
        </div>
      </div>
    </header>
  );
}
`,
  "/src/components/layout/app-sidebar.tsx": `
import React from "react";
import { LayoutDashboard, MessageSquare, Cpu, Box, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar({ activeTab, onTabChange, user }: any) {
  const { open, setOpen } = useSidebar();
  const menu = [
    { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { id: "chat", label: "الدردشة", icon: MessageSquare },
  ];

  return (
    <aside 
      style={{ width: open ? '240px' : '0px' }}
      className={cn(
        "border-l border-white/5 bg-slate-900/50 flex flex-col gap-4 transition-all duration-300 overflow-hidden relative z-30",
        !open && "border-none"
      )}
    >
      <div className="p-4 flex items-center justify-between flex-row-reverse mb-4 shrink-0">
        <div className="flex items-center gap-2 justify-end">
           <span className="font-bold text-sm">Nexus AI</span>
           <Box className="text-indigo-500 size-4" />
        </div>
      </div>
      
      <div className="px-2 space-y-1 flex-1 overflow-y-auto">
        {menu.map(item => (
          <button 
            key={item.id}
            className={cn(
              "w-full p-3 rounded-xl flex items-center justify-end gap-3 transition-all",
              activeTab === item.id ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/10" : "text-slate-400 hover:bg-white/5"
            )}
            onClick={() => onTabChange(item.id)}
          >
            <span>{item.label}</span>
            <item.icon size={16} />
          </button>
        ))}
      </div>
    </aside>
  );
}
`,
  "/src/components/ui/sidebar.tsx": `
import React, { createContext, useContext, useState, useEffect } from "react";
const SidebarContext = createContext({ open: true, setOpen: (v: boolean) => {} });
export const SidebarProvider = ({ children }: any) => {
  // Auto-collapse on small screens
  const [open, setOpen] = useState(window.innerWidth > 600);
  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>;
};
export const useSidebar = () => useContext(SidebarContext);
`,
  "/src/components/ui/button.tsx": `
import React from "react";
import { cn } from "@/lib/utils";
export const Button = React.forwardRef(({ className, variant, size, ...props }: any, ref: any) => (
  <button ref={ref} className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white shadow hover:bg-indigo-700 h-9 px-4 py-2", className)} {...props} />
));
`,
  "/src/components/ui/input.tsx": `
import React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef(({ className, type, ...props }: any, ref: any) => (
  <input type={type} className={cn("flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props} />
));
`,
  "/src/components/ui/badge.tsx": `
import React from "react";
import { cn } from "@/lib/utils";
export const Badge = ({ className, variant, ...props }: any) => (
  <div className={cn("inline-flex items-center rounded-md border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)} {...props} />
);
`,
  "/src/components/ui/icon-safe.tsx": `
import React from "react";
export const IconSafe = ({ icon: Icon, className }: any) => Icon ? <Icon className={className} /> : null;
`,
  "/src/lib/utils.ts": `
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
`
};
