'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Clock, ShoppingBag, 
  Tag, MessageSquare, User, Loader2, ArrowRight, Repeat
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/auth/auth-provider';
import { getReceivedOffers, respondToOffer, MarketOffer, OfferStatus } from '@/lib/market-store';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

export function OffersInbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<MarketOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadOffers = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const data = await getReceivedOffers(user.id);
    setOffers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOffers();
  }, [user?.id]);

  const handleAction = async (offer: MarketOffer, status: OfferStatus) => {
    if (!offer.id) return;
    setProcessingId(offer.id);
    try {
      const success = await respondToOffer(offer.id, status, offer.buyerId, offer.itemTitle || 'Item');
      if (success) {
        toast({
          title: status === 'accepted' ? "Proposal Accepted" : "Proposal Declined",
          description: `The negotiation for "${offer.itemTitle}" has been finalized.`
        });
        loadOffers();
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Sync Failure",
        description: "Failed to transmit status update to the network."
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="text-indigo-400" />
            Negotiation Stream
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">Manage incoming acquisition proposals from the network.</p>
        </div>
        <Button variant="ghost" className="rounded-xl border border-white/10 h-11" onClick={loadOffers}>
          Refresh Stream
        </Button>
      </div>

      <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-white/5 bg-white/5 p-8">
          <CardTitle className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <Clock className="size-4" />
            Pending Proposals ({offers.filter(o => o.status === 'pending').length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-24"><Loader2 className="size-10 animate-spin text-primary" /></div>
            ) : offers.length === 0 ? (
              <EmptyState 
                icon={Repeat}
                title="Neural Stream Clear"
                description="No active negotiation requests have been detected for your assets."
                className="py-24"
              />
            ) : (
              <div className="divide-y divide-white/5">
                {offers.map((offer) => (
                  <div key={offer.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-white/5 transition-colors group">
                    <div className="flex items-start gap-6 flex-1">
                      <div className="size-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
                        {offer.type === 'price' ? <Tag className="size-6 text-indigo-400" /> : <Repeat className="size-6 text-amber-400" />}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-white">{offer.itemTitle}</h3>
                          <Badge variant="outline" className="text-[9px] h-4 border-indigo-500/30 text-indigo-400 uppercase tracking-tighter">{offer.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Proposer: <span className="text-white font-medium">@{offer.buyerName}</span>
                        </p>
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5 mt-4 max-w-lg">
                          {offer.type === 'price' ? (
                            <p className="text-xl font-bold text-indigo-400">
                              {offer.value?.toLocaleString()} 
                              <span className="text-xs uppercase font-normal text-muted-foreground ml-2">Credits Proposed</span>
                            </p>
                          ) : (
                            <p className="text-sm italic text-white/80 leading-relaxed font-serif">"{offer.details}"</p>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-4">
                          Synchronized {formatDistanceToNow(new Date(offer.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                      {offer.status === 'pending' ? (
                        <>
                          <Button 
                            onClick={() => handleAction(offer, 'accepted')}
                            disabled={processingId === offer.id}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-green-600/20"
                          >
                            {processingId === offer.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4 mr-2" />}
                            Accept
                          </Button>
                          <Button 
                            onClick={() => handleAction(offer, 'rejected')}
                            disabled={processingId === offer.id}
                            variant="ghost" 
                            className="w-full sm:w-auto text-red-400 hover:bg-red-500/10 rounded-xl h-12 px-8"
                          >
                            {processingId === offer.id ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4 mr-2" />}
                            Decline
                          </Button>
                        </>
                      ) : (
                        <Badge className={cn(
                          "px-4 py-1 rounded-lg text-xs font-bold",
                          offer.status === 'accepted' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {offer.status.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
