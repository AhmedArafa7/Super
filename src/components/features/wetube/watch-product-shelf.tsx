
"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { MarketItem } from "@/lib/market/types";
import { getMarketItems } from "@/lib/market/items";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WatchProductShelfProps {
  authorId: string;
  productIds?: string[];
  displayMode?: 'none' | 'specific' | 'all';
}

export function WatchProductShelf({ authorId, productIds = [], displayMode = 'none' }: WatchProductShelfProps) {
  const [products, setProducts] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (displayMode === 'none') {
      setProducts([]);
      return;
    }

    async function fetchProducts() {
      setIsLoading(true);
      try {
        const { items } = await getMarketItems(50, undefined, 'all', 'all_subs', undefined, true);
        
        if (displayMode === 'all') {
          const authorProducts = items.filter(i => i.sellerId === authorId && i.status === 'active');
          setProducts(authorProducts);
        } else if (displayMode === 'specific' && productIds.length > 0) {
          const specificProducts = items.filter(i => productIds.includes(i.id) && i.status === 'active');
          // Sort to match productIds order
          specificProducts.sort((a, b) => productIds.indexOf(a.id) - productIds.indexOf(b.id));
          setProducts(specificProducts);
        }
      } catch (e) {
        console.error("Failed to fetch products for shelf", e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [authorId, productIds, displayMode]);

  if (displayMode === 'none' || (!isLoading && products.length === 0)) return null;

  return (
    <div className="mt-8 mb-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-primary" />
          <h2 className="text-lg font-bold text-white">منتجات متعلقة</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/5">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/5">
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[200px] h-[280px] bg-white/5 rounded-2xl animate-pulse border border-white/5" />
          ))
        ) : (
          products.map(product => (
            <div 
              key={product.id}
              className="min-w-[200px] max-w-[200px] group bg-[#1a1a1a]/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden hover:border-primary/50 transition-all duration-300"
            >
              <div className="aspect-square w-full bg-black/40 overflow-hidden relative">
                {product.imageUrl && (
                  <img 
                    src={product.imageUrl} 
                    className="size-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    alt={product.title} 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="p-3 text-right">
                <h3 className="text-sm font-bold text-white truncate mb-1">{product.title}</h3>
                <div className="flex items-center justify-between flex-row-reverse mb-3">
                  <span className="text-primary font-mono text-[13px] font-bold">{product.price} {product.currency}</span>
                  <span className="text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded-md">جديد</span>
                </div>
                
                <Button 
                  onClick={() => window.open(`/market?id=${product.id}`, '_blank')}
                  className="w-full h-8 bg-white/5 hover:bg-primary hover:text-white text-white text-[11px] font-bold rounded-lg border border-white/10 transition-all gap-1.5"
                >
                  عرض التفاصيل <ExternalLink className="size-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
