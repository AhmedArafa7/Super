
"use client";

import React from "react";
import { ShoppingCart, Star, Zap, Cpu, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: string;
  rating: number;
  category: string;
  image: string;
  tag?: string;
}

const PRODUCTS: Product[] = [
  { id: "1", name: "Nexus Quantum Pro Headset", price: "$299.00", rating: 4.9, category: "Audio", image: PlaceHolderImages[6].imageUrl, tag: "Best Seller" },
  { id: "2", name: "AI Core Gen-X Processor", price: "$549.00", rating: 5.0, category: "Hardware", image: PlaceHolderImages[7].imageUrl, tag: "New" },
  { id: "3", name: "Mechanical Neural Keyboard", price: "$189.00", rating: 4.8, category: "Peripherals", image: PlaceHolderImages[8].imageUrl },
  { id: "4", name: "Neural Link Interface V2", price: "$1,299.00", rating: 4.7, category: "Futurism", image: PlaceHolderImages[9].imageUrl },
  { id: "5", name: "Solid State Graphene Battery", price: "$120.00", rating: 4.6, category: "Energy", image: PlaceHolderImages[10].imageUrl },
  { id: "6", name: "8K Holographic Projector", price: "$899.00", rating: 4.9, category: "Display", image: PlaceHolderImages[11].imageUrl, tag: "Popular" },
  { id: "7", name: "Smart Bio-Metric Ring", price: "$249.00", rating: 4.5, category: "Wearables", image: PlaceHolderImages[12].imageUrl },
  { id: "8", name: "Haptic VR Interaction Gloves", price: "$350.00", rating: 4.8, category: "Virtual Reality", image: PlaceHolderImages[13].imageUrl },
];

export function TechMarket({ onAddToCart }: { onAddToCart: () => void }) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6 bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2rem] relative overflow-hidden">
        <div className="relative z-10">
          <Badge className="bg-indigo-500 mb-4 px-3 py-1 text-[10px] uppercase tracking-wider font-bold">Tech Deals of the Week</Badge>
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight mb-4">The Nexus Marketplace</h2>
          <p className="text-indigo-200/70 max-w-md text-lg">Next-gen hardware, software, and biological interfaces at your fingertips.</p>
          <div className="flex gap-4 mt-8">
            <Button className="bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl px-6 font-bold">Explore All</Button>
            <Button variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-xl px-6">New Arrivals</Button>
          </div>
        </div>
        <div className="relative size-48 sm:size-64 hidden lg:block">
           <Cpu className="size-full text-indigo-500/20 absolute -right-10 -bottom-10" />
           <Image 
             src={PlaceHolderImages[6].imageUrl} 
             alt="Featured" 
             fill 
             className="object-contain drop-shadow-[0_20px_50px_rgba(99,102,241,0.5)] transform rotate-12"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {PRODUCTS.map((product) => (
          <div key={product.id} className="group flex flex-col glass rounded-3xl overflow-hidden border-white/5 hover:border-indigo-500/40 transition-all duration-300 transform hover:-translate-y-2 relative shadow-xl">
            {product.tag && (
              <Badge className="absolute top-4 left-4 z-10 bg-indigo-500/80 backdrop-blur-md text-white border-none text-[10px] py-0.5 px-2">
                {product.tag}
              </Badge>
            )}
            <button className="absolute top-4 right-4 z-10 size-8 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
               <Heart className="size-4" />
            </button>

            <div className="relative aspect-square overflow-hidden p-4">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 z-0" />
              <Image 
                src={product.image} 
                alt={product.name} 
                fill
                className="object-contain p-8 group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            <div className="p-5 flex flex-col flex-1 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">{product.category}</p>
                <div className="flex items-center gap-0.5">
                  <Star className="size-3 text-yellow-500 fill-yellow-500" />
                  <p className="text-[10px] font-bold text-white/70">{product.rating}</p>
                </div>
              </div>
              <h3 className="font-bold text-base text-white/90 group-hover:text-white transition-colors line-clamp-2 mb-4 h-12">{product.name}</h3>
              
              <div className="mt-auto flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-white">{product.price}</p>
                  <p className="text-[10px] text-green-400 flex items-center gap-1 font-medium mt-1">
                    <ShieldCheck className="size-3" />
                    In Stock
                  </p>
                </div>
                <Button 
                  onClick={onAddToCart}
                  size="icon" 
                  className="size-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-indigo-500 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all group/btn"
                >
                  <ShoppingCart className="size-4 group-hover/btn:scale-110" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Zap, title: "Next-Day Delivery", desc: "Available for all Pro members across 150 regions." },
          { icon: ShieldCheck, title: "Secured Transactions", desc: "Blockchain-powered escrow for total peace of mind." },
          { icon: Star, title: "Curated Excellence", desc: "Every product is vetted by the Nexus Hardware Committee." },
        ].map((feat, i) => (
          <div key={i} className="flex gap-4 p-6 glass rounded-2xl border-white/5">
             <div className="size-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <feat.icon className="size-6 text-indigo-400" />
             </div>
             <div>
                <h4 className="font-bold text-white mb-1">{feat.title}</h4>
                <p className="text-sm text-muted-foreground">{feat.desc}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
