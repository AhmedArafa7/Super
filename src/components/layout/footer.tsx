
"use client";

import React from "react";
import { Layers, Github, Twitter, Linkedin, Globe, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { title: "Protocol", items: ["Whitepaper", "Security Audit", "Open Source", "Node Specs"] },
    { title: "Ecosystem", items: ["TechMarket", "StreamHub", "Knowledge Hub", "AI Chat"] },
    { title: "Support", items: ["Documentation", "API Access", "Contact Support", "Status"] },
    { title: "Legal", items: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Neural License"] },
  ];

  return (
    <footer className="bg-slate-950/50 border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Layers className="text-white size-6" />
              </div>
              <h1 className="font-headline font-bold text-2xl tracking-tight text-white">NexusAI</h1>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-8">
              The next evolution in neural digital ecosystems. A secure, decentralized platform for intelligent interaction, content distribution, and technical asset acquisition.
            </p>
            <div className="flex gap-4">
              {[Github, Twitter, Linkedin, Globe].map((Icon, i) => (
                <a key={i} href="#" className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300">
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

          {links.map((group, i) => (
            <div key={i}>
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">{group.title}</h4>
              <ul className="space-y-4">
                {group.items.map((item, j) => (
                  <li key={j}>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-muted-foreground">
            © {currentYear} NexusAI Corporation. All neural links reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
              <Shield className="size-3 text-primary" />
              Quantum Encrypted
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
              <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              All Systems Operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
