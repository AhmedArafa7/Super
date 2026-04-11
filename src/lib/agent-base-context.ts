
"use client";

/**
 * [STABILITY_ANCHOR: AGENT_BASE_CONTEXT_V1.0]
 * This file provides a 'Neural Base Context' for the Sandpack preview engine.
 * It contains the real, actual code of core layout components to ensure that
 * the IDE preview can render the full project structure even if these files
 * aren't currently active in the workspace store.
 */

export const BASE_PROJECT_CONTEXT: Record<string, string> = {
  "/src/components/layout/app-shell.tsx": `
'use client';
import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
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
      <div className="flex min-h-screen w-full bg-slate-950 text-white overflow-hidden relative">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} user={user} />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <AppHeader onTabChange={setActiveTab} />
          <main className="flex-1 overflow-y-auto bg-slate-900/20 p-6">
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
import { Bell, Search, Wallet, Layers } from "lucide-react";

export function AppHeader({ onTabChange }: any) {
  return (
    <header className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 z-20 flex-row-reverse shrink-0">
      <div className="flex items-center gap-4 flex-row-reverse">
        <h2 className="text-sm font-bold text-white">Neural Sandbox Preview</h2>
      </div>
    </header>
  );
}
`,
  "/src/components/layout/app-sidebar.tsx": `
import React from "react";
import { LayoutDashboard, MessageSquare, Cpu, Box } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppSidebar({ activeTab, onTabChange, user }: any) {
  const menu = [
    { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { id: "chat", label: "الدردشة", icon: MessageSquare },
  ];

  return (
    <aside className="w-64 border-l border-white/5 bg-slate-900/50 flex flex-col p-4 gap-4">
      <div className="flex items-center gap-3 justify-end mb-8">
        <h1 className="font-bold text-lg">Nexus Preview</h1>
        <Box className="text-primary" />
      </div>
      {menu.map(item => (
        <button 
          key={item.id}
          className={cn(
            "w-full p-3 rounded-xl flex items-center justify-end gap-3 transition-all",
            activeTab === item.id ? "bg-primary/20 text-primary border border-primary/20" : "text-slate-400 hover:bg-white/5"
          )}
          onClick={() => onTabChange(item.id)}
        >
          <span>{item.label}</span>
          <item.icon size={18} />
        </button>
      ))}
    </aside>
  );
}
`,
  "/src/components/ui/sidebar.tsx": `
import React, { createContext, useContext, useState } from "react";
const SidebarContext = createContext({ open: true, setOpen: (v: boolean) => {} });
export const SidebarProvider = ({ children }: any) => {
  const [open, setOpen] = useState(true);
  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>;
};
export const useSidebar = () => useContext(SidebarContext);
export const SidebarTrigger = () => <button>Toggle</button>;
`,
  "/src/components/ui/button.tsx": `
import React from "react";
import { cn } from "@/lib/utils";
export const Button = React.forwardRef(({ className, variant, size, ...props }: any, ref: any) => (
  <button ref={ref} className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2", className)} {...props} />
));
`,
  "/src/components/ui/input.tsx": `
import React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef(({ className, type, ...props }: any, ref: any) => (
  <input type={type} className={cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props} />
));
`,
  "/src/components/ui/badge.tsx": `
import React from "react";
import { cn } from "@/lib/utils";
export const Badge = ({ className, variant, ...props }: any) => (
  <div className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)} {...props} />
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
