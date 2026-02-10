'use client';

import { addNotification } from './notification-store';

export type ListingType = 'sell_offer' | 'buy_request';
export type PricingMode = 'fixed' | 'range' | 'negotiable';
export type MarketItemStatus = 'active' | 'sold' | 'archived';
export type OfferStatus = 'pending' | 'accepted' | 'rejected';

export interface MarketOffer {
  id: string;
  userId: string;
  userName: string;
  offerAmount: number;
  status: OfferStatus;
  message?: string;
  timestamp: string;
}

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  listingType: ListingType;
  pricingMode: PricingMode;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  currency: string;
  status: MarketItemStatus;
  offers: MarketOffer[];
  ownerId: string;
  ownerName: string;
  image?: string;
  createdAt: string;
}

const STORAGE_KEY = 'nexus_market_items';

export const getMarketItems = (): MarketItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveMarketItems = (items: MarketItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('market-update'));
};

export const addMarketItem = (item: Omit<MarketItem, 'id' | 'createdAt' | 'offers' | 'status'>) => {
  const items = getMarketItems();
  const newItem: MarketItem = {
    ...item,
    id: Math.random().toString(36).substring(2, 15),
    status: 'active',
    offers: [],
    createdAt: new Date().toISOString(),
  };
  saveMarketItems([newItem, ...items]);
  
  addNotification({
    type: 'market_restock',
    title: 'New Neural Asset',
    message: `${item.ownerName} listed a new ${item.listingType === 'sell_offer' ? 'item' : 'request'}: "${item.title}"`,
    priority: 'info'
  });
  
  return newItem;
};

export const addOffer = (itemId: string, offer: Omit<MarketOffer, 'id' | 'status' | 'timestamp'>) => {
  const items = getMarketItems();
  const updated = items.map(item => {
    if (item.id === itemId) {
      const newOffer: MarketOffer = {
        ...offer,
        id: Math.random().toString(36).substring(2, 9),
        status: 'pending',
        timestamp: new Date().toISOString(),
      };
      
      addNotification({
        type: 'market_restock',
        title: 'New Offer Received',
        message: `${offer.userName} offered ${offer.offerAmount} ${item.currency} for your listing "${item.title}"`,
        userId: item.ownerId,
        priority: 'info',
        metadata: { productId: item.id }
      });
      
      return { ...item, offers: [...item.offers, newOffer] };
    }
    return item;
  });
  saveMarketItems(updated);
};

export const updateOfferStatus = (itemId: string, offerId: string, status: OfferStatus) => {
  const items = getMarketItems();
  const updated = items.map(item => {
    if (item.id === itemId) {
      let targetUserId = '';
      const updatedOffers = item.offers.map(offer => {
        if (offer.id === offerId) {
          targetUserId = offer.userId;
          return { ...offer, status };
        }
        return offer;
      });

      addNotification({
        type: 'market_restock',
        title: status === 'accepted' ? 'Offer Accepted!' : 'Offer Declined',
        message: status === 'accepted' 
          ? `Your offer for "${item.title}" was accepted by ${item.ownerName}.` 
          : `Your offer for "${item.title}" was declined.`,
        userId: targetUserId,
        priority: status === 'accepted' ? 'info' : 'warning',
        metadata: { productId: item.id }
      });

      return { 
        ...item, 
        offers: updatedOffers,
        status: status === 'accepted' ? 'sold' : item.status 
      };
    }
    return item;
  });
  saveMarketItems(updated);
};

export const deleteMarketItem = (id: string) => {
  const items = getMarketItems();
  saveMarketItems(items.filter(i => i.id !== id));
};
