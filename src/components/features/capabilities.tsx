
"use client";

import React from "react";
import { Zap, Shield, Cpu, Cloud, Globe, Smartphone, BarChart3, Fingerprint } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { icon: Cpu, title: "Neural Processing", desc: "Powered by the latest GenAI models for instant, context-aware intelligence." },
  { icon: Shield, title: "E2E Encryption", desc: "Your data is encrypted at rest and in transit with post-quantum security." },
  { icon: Globe, title: "Edge Distributed", desc: "Global CDN presence ensures low-latency delivery of heavy streams." },
  { icon: Cloud, title: "Nexus Cloud Sync", desc: "Seamlessly switch between desktop and mobile with instant state persistence." },
  { icon: Smartphone, title: "Cross-Platform", desc: "Optimized for VR, mobile, and web with a single unified interface." },
  { icon: BarChart3, title: "Advanced Analytics", desc: "Gain deep insights into your digital footprint and AI interactions." },
  { icon: Fingerprint, title: "Bio-Metric Auth", desc: "Zero-knowledge authentication using decentralized identity protocols." },
  { icon: Zap, title: "Instant Scaling", desc: "From personal use to enterprise clusters, Nexus scales with you." },
];

export function Capabilities() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-4 py-1">Core Architecture</Badge>
        <h2 className="text-5xl font-headline font-bold text-white tracking-tight mb-6">Unleashing Tomorrow</h2>
        <p className="text-muted-foreground text-lg">Nexus is more than an app. It's an ecosystem built on the principles of speed, privacy, and limitless intelligence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {FEATURES.map((feat, i) => (
          <div key={i} className="group p-8 glass rounded-[2.5rem] border-white/5 hover:border-primary/40 transition-all duration-500 flex flex-col items-center text-center">
            <div className="size-16 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-xl group-hover:shadow-primary/20">
              <feat.icon className="size-8 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feat.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 glass rounded-[3rem] p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 size-96 bg-primary/10 blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 size-96 bg-blue-500/10 blur-[100px] -ml-48 -mb-48" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1">
            <h3 className="text-3xl font-headline font-bold text-white mb-6">Integration Network</h3>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              NexusAI connects directly with your existing developer stack. Whether it's GitHub, AWS, or local hardware, the integration is seamless and automatic.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {['API Direct Access', 'Webhooks v2', 'Custom Pipelines', 'Enterprise SSO'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-white/80 font-medium">
                  <div className="size-2 bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
                <Cpu className="size-8 text-white/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
