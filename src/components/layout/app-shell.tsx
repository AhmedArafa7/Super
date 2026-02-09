
"use client";

import React, { useState } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { MessageSquare, Video, ShoppingBag, Zap, Github, Twitter, Layers, LogOut, Search, Bell, ShoppingCart, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIChat } from "@/components/features/ai-chat";
import { StreamHub } from "@/components/features/stream-hub";
import { TechMarket } from "@/components/features/tech-market";
import { Capabilities } from "@/components/features/capabilities";

type NavItem = "chat" | "stream" | "market" | "features";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<NavItem>("chat");
  const [cartCount, setCartCount] = useState(0);

  const navItems = [
    { id: "chat", label: "AI Chat", icon: MessageSquare },
    { id: "stream", label: "StreamHub", icon: Video },
    { id: "market", label: "TechMarket", icon: ShoppingBag },
    { id: "features", label: "Capabilities", icon: Zap },
  ];

  const handleAddToCart = () => setCartCount((prev) => prev + 1);

  const renderContent = () => {
    switch (activeTab) {
      case "chat": return <AIChat />;
      case "stream": return <StreamHub />;
      case "market": return <TechMarket onAddToCart={handleAddToCart} />;
      case "features": return <Capabilities />;
      default: return <AIChat />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background hero-gradient overflow-hidden">
        <Sidebar className="border-r border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Layers className="text-white size-6" />
              </div>
              <div>
                <h1 className="font-headline font-bold text-xl tracking-tight text-white">NexusAI</h1>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Super App</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3">
            <SidebarMenu className="gap-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id as NavItem)}
                    className={`h-12 gap-4 px-4 rounded-xl transition-all duration-300 ${
                      activeTab === item.id 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                    tooltip={item.label}
                  >
                    <item.icon className="size-5 shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 mt-auto">
            <div className="p-4 rounded-2xl glass mb-4">
              <p className="text-xs text-muted-foreground mb-2">Nexus Pro Plan</p>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                <div className="h-full w-2/3 bg-primary" />
              </div>
              <Button variant="outline" size="sm" className="w-full text-[10px] h-7 border-white/10 hover:bg-white/5">Upgrade Now</Button>
            </div>
            <div className="flex items-center gap-3 px-2">
              <div className="size-8 rounded-full bg-indigo-900/50 border border-white/10 overflow-hidden">
                <img src="https://picsum.photos/seed/user1/32/32" alt="User" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Alex Rivera</p>
                <p className="text-[10px] text-muted-foreground truncate">alex@nexus.ai</p>
              </div>
              <LogOut className="size-4 text-muted-foreground cursor-pointer hover:text-white" />
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 z-20 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search Nexus..." 
                  className="w-64 pl-9 h-9 bg-white/5 border-white/10 focus-visible:ring-primary rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white relative">
                <Bell className="size-5" />
                <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-slate-900" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white relative">
                <ShoppingCart className="size-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-[10px]">
                    {cartCount}
                  </Badge>
                )}
              </Button>
              <div className="h-8 w-px bg-white/10 mx-2" />
              <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-lg shadow-md shadow-primary/10">
                <Zap className="mr-2 size-4 fill-white" />
                Connect
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-slate-900/20">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
