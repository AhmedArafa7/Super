import React from "react";
import { ExternalLink, Tag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Ad } from "@/lib/ads-store";
import { useAdLogic } from "@/hooks/use-ad-logic";

interface NativeAdProps {
  type: 'sidebar' | 'home' | 'banner' | 'video' | 'image' | 'page';
  category?: string;
  className?: string;
}

const FALLBACK_AD: Ad = {
  id: "default-nexus",
  title: "Nexus Pro: ترقية ذكاء التجربة",
  description: "احصل على تلخيص ذكي لجميع فيديوهاتك ومساحة تخزين سحابية غير محدودة.",
  imageUrls: ["https://images.unsplash.com/photo-1620641788421-7a1c342f4ecb?q=80&w=800&auto=format&fit=crop"],
  linkUrl: "#",
  rewardAmount: 0,
  type: 'sidebar',
  targetCategories: ['Tech'],
  status: 'active',
  clicks: 0,
  impressions: 0,
  createdAt: new Date().toISOString(),
  authorId: 'system',
  authorName: 'Nexus AI',
  category: 'Tech'
};

/**
 * [STABILITY_ANCHOR: NEXUS_NATIVE_ADS_V2.0]
 * High-fidelity native ad component refactored for professional modularity.
 */
export function NexusNativeAds({ type, category, className }: NativeAdProps) {
  const { ad, isLoading, containerRef, handleAdClick } = useAdLogic({
    type, 
    category, 
    fallbackAd: FALLBACK_AD
  });

  if (isLoading) {
     return (
       <div className={cn("flex items-center justify-center p-8 bg-white/5 rounded-2xl border border-white/10 min-h-[100px]", className)}>
          <Loader2 className="size-5 text-primary animate-spin opacity-40" />
       </div>
     );
  }

  const adImage = ad.imageUrls?.[0] || FALLBACK_AD.imageUrls[0];
  const adCTA = (ad as any).cta || "اكتشف الآن";

  if (type === 'sidebar') {
    return (
      <div 
        ref={containerRef}
        className={cn("bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-6 group transition-all hover:border-primary/30", className)}
      >
        <div className="relative aspect-video">
          <img src={adImage} alt="Ad" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute top-2 right-2">
            <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase border border-white/10">
              ممول
            </div>
          </div>
        </div>
        <div className="p-4 pt-3 flex flex-col gap-2">
           <div className="flex items-center gap-2 text-primary">
              <Tag size={10} className="fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest">Nexus Ecosystem</span>
           </div>
           <h4 className="text-xs font-bold text-white leading-relaxed line-clamp-2">{ad.title}</h4>
           <p className="text-[10px] text-muted-foreground line-clamp-2">{ad.description}</p>
           <a 
              href={ad.linkUrl}
              onClick={handleAdClick}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 transition-all"
           >
              {adCTA}
              <ExternalLink size={10} />
           </a>
        </div>
      </div>
    );
  }

  if (type === 'home' || type === 'feed') {
    return (
      <div 
        ref={containerRef}
        className={cn("bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden group hover:border-primary/20 transition-all", className)}
      >
        <div className="relative aspect-video">
            <img src={adImage} alt="Nexus Ad" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 right-4 left-4 flex flex-col gap-1 items-end text-right">
                <span className="text-[8px] font-black text-primary uppercase">Sponsored by Nexus</span>
                <h4 className="text-sm font-bold text-white">{ad.title}</h4>
            </div>
        </div>
        <div className="p-5 flex flex-col gap-3">
            <p className="text-xs text-slate-400 text-right leading-relaxed">{ad.description}</p>
            <a 
              href={ad.linkUrl}
              onClick={handleAdClick}
              target="_blank"
              className="w-full py-3 border border-white/10 hover:bg-white/5 text-center text-white rounded-xl text-xs font-bold transition-all"
            >
                {adCTA}
            </a>
        </div>
      </div>
    );
  }

  // Horizontal Banner
  return (
    <div 
        ref={containerRef}
        className={cn("w-full bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between gap-4", className)}
    >
       <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl border border-indigo-500/20 overflow-hidden shrink-0">
             <img src={adImage} className="size-full object-cover" alt="icon" />
          </div>
          <div className="flex flex-col">
             <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Ecosystem Announcement</span>
             <h4 className="text-xs font-bold text-white">{ad.title}</h4>
          </div>
       </div>
       <a 
          href={ad.linkUrl}
          onClick={handleAdClick}
          target="_blank"
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold transition-all whitespace-nowrap"
       >
          {adCTA}
       </a>
    </div>
  );
}
