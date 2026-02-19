
'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tag, Loader2, Send, Repeat } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { MarketItem, addMarketOffer } from '@/lib/market-store';

interface MakeOfferModalProps {
  item: MarketItem;
  trigger?: React.ReactNode;
}

export function MakeOfferModal({ item, trigger }: MakeOfferModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offerType, setOfferType] = useState<'price' | 'trade'>('price');
  const [offerValue, setOfferValue] = useState<string>('');
  const [offerDetails, setOfferDetails] = useState<string>('');

  const handleSendOffer = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!user?.id) {
      toast({ variant: "destructive", title: "Identity Required", description: "Please sync your node first." });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const sellerId = item.sellerId || item.ownerId;
      if (!sellerId) throw new Error("Target Node ID missing.");

      const success = await addMarketOffer(item.id, sellerId, item.title, {
        buyerId: user.id,
        buyerName: user.name,
        type: offerType,
        value: offerType === 'price' ? Number(offerValue) : 0,
        details: offerType === 'trade' ? offerDetails : "Price Negotiation",
        status: 'pending'
      });

      if (success) {
        toast({
          title: "تم إرسال العرض",
          description: "طلبك قيد المزامنة الآن مع صندوق الرسائل للمالك."
        });
        setIsOpen(false);
        setOfferValue('');
        setOfferDetails('');
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "فشل الإرسال",
        description: err.message || "تعذر ربط العرض بالشبكة حالياً."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex-1 rounded-xl h-12 border-white/10 hover:bg-white/5 font-bold">
            <Repeat className="size-4 mr-2" /> Make Offer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-slate-900 border-white/10 rounded-[2.5rem] p-8 text-right" onPointerDown={e => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-white">بدء التفاوض العصبي</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            اقترح شروط استحواذ مخصصة لـ <span className="text-indigo-400 font-bold">{item.title}</span>.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="price" onValueChange={(v: any) => setOfferType(v)} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-xl border border-white/5 flex-row-reverse">
            <TabsTrigger value="price" className="rounded-lg data-[state=active]:bg-indigo-600">
              <Tag className="size-4 mr-2" /> عرض مالي
            </TabsTrigger>
            <TabsTrigger value="trade" className="rounded-lg data-[state=active]:bg-indigo-600">
              <Repeat className="size-4 mr-2" /> مقايضة عصبية
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="price" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="value" className="text-xs uppercase font-bold tracking-widest text-muted-foreground block text-right">السعر المقترح (Credits)</Label>
              <div className="relative">
                <Input 
                  id="value" 
                  type="number" 
                  placeholder="مثال: 4500"
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-indigo-500 pr-4 text-right"
                  value={offerValue}
                  onChange={(e) => setOfferValue(e.target.value)}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold uppercase">Credits</div>
              </div>
              <p className="text-[10px] text-muted-foreground italic text-right">السعر المطلوب: {item.price} {item.currency}</p>
            </div>
          </TabsContent>

          <TabsContent value="trade" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="details" className="text-xs uppercase font-bold tracking-widest text-muted-foreground block text-right">تفاصيل المقايضة</Label>
              <Textarea 
                id="details" 
                dir="auto"
                placeholder="صف الأصول أو الخدمات التي تعرضها مقابل هذا المنتج..." 
                className="bg-white/5 border-white/10 rounded-xl min-h-[120px] focus-visible:ring-indigo-500 text-right"
                value={offerDetails}
                onChange={(e) => setOfferDetails(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-8">
          <Button 
            onClick={handleSendOffer}
            disabled={isSubmitting || (offerType === 'price' ? !offerValue : !offerDetails)}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold shadow-lg shadow-indigo-600/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" />
                تأكيد وإرسال المقترح
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
