
"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, Check, Plus, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MarketItem } from "@/lib/market/types";
import { getMarketItems } from "@/lib/market/items";
import { cn } from "@/lib/utils";

interface VideoProductSelectorProps {
  userId: string;
  selectedProductIds: string[];
  displayMode: 'none' | 'specific' | 'all';
  onChange: (data: { selectedProductIds: string[], displayMode: 'none' | 'specific' | 'all' }) => void;
}

export function VideoProductSelector({ userId, selectedProductIds, displayMode, onChange }: VideoProductSelectorProps) {
  const [myProducts, setMyProducts] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const { items } = await getMarketItems(50, undefined, 'all', 'all_subs', undefined, true);
        const myItems = items.filter(item => item.sellerId === userId);
        setMyProducts(myItems);
      } catch (e) {
        console.error("Failed to load user products", e);
      } finally {
        setIsLoading(false);
      }
    }
    if (userId) loadProducts();
  }, [userId]);

  const toggleProduct = (productId: string) => {
    const newSelection = selectedProductIds.includes(productId)
      ? selectedProductIds.filter(id => id !== productId)
      : [...selectedProductIds, productId];
    onChange({ selectedProductIds: newSelection, displayMode });
  };

  return (
    <div className="space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <ShoppingBag className="size-5 text-primary" />
        <h3 className="text-sm font-bold text-white">ترويج المنتجات مع الفيديو</h3>
      </div>
      
      <RadioGroup 
        value={displayMode} 
        onValueChange={(val: any) => onChange({ selectedProductIds, displayMode: val })}
        className="grid gap-3"
      >
        <div className="flex items-center space-x-2 space-x-reverse justify-end bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
          <Label htmlFor="mode-none" className="flex-1 text-right text-xs cursor-pointer">
            <span className="font-bold text-white block">عدم عرض منتجات</span>
            <span className="text-muted-foreground">لن تظهر أي منتجات أسفل هذا الفيديو.</span>
          </Label>
          <RadioGroupItem value="none" id="mode-none" />
        </div>

        <div className="flex items-center space-x-2 space-x-reverse justify-end bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
          <Label htmlFor="mode-all" className="flex-1 text-right text-xs cursor-pointer">
            <span className="font-bold text-white block">كل منتجاتي النشطة</span>
            <span className="text-muted-foreground">سيتم عرض جميع المنتجات التي طرحتها في المتجر.</span>
          </Label>
          <RadioGroupItem value="all" id="mode-all" />
        </div>

        <div className="flex items-center space-x-2 space-x-reverse justify-end bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
          <Label htmlFor="mode-specific" className="flex-1 text-right text-xs cursor-pointer">
            <span className="font-bold text-white block">منتجات محددة لهذا الفيديو</span>
            <span className="text-muted-foreground">اختر منتجات معينة لعرضها في "رف المنتجات".</span>
          </Label>
          <RadioGroupItem value="specific" id="mode-specific" />
        </div>
      </RadioGroup>

      {displayMode === 'specific' && (
        <div className="pt-4 border-t border-white/10 mt-4">
          <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-4 text-right">اختر المنتجات ({selectedProductIds.length})</Label>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 text-primary animate-spin" />
            </div>
          ) : myProducts.length === 0 ? (
            <div className="text-center py-8 bg-black/20 rounded-xl border border-dashed border-white/10">
              <Info className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground font-medium">ليس لديك منتجات نشطة في المتجر حالياً.</p>
              <Button variant="link" className="text-primary text-xs mt-2" onClick={() => window.open('/market', '_blank')}>انتقل للمتجر لإضافة منتجات</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto no-scrollbar pr-1">
              {myProducts.map(product => {
                const isSelected = selectedProductIds.includes(product.id);
                return (
                  <div 
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={cn(
                      "relative p-2 rounded-xl border transition-all cursor-pointer group flex flex-row-reverse items-center gap-3",
                      isSelected ? "bg-primary/20 border-primary" : "bg-white/5 border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="size-12 rounded-lg bg-black/40 overflow-hidden shrink-0">
                      {product.imageUrl && <img src={product.imageUrl} className="size-full object-cover" alt="" />}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-[11px] font-bold text-white truncate">{product.title}</p>
                      <p className="text-[10px] text-primary font-mono">{product.price} {product.currency}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 left-1 bg-primary text-white p-0.5 rounded-full">
                        <Check className="size-2.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
