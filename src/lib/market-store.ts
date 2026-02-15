
'use client';

import { supabase } from './supabaseClient';
import { addNotification } from './notification-store';

export type ListingType = 'sell_offer' | 'buy_request';
export type PricingMode = 'fixed' | 'range' | 'negotiable';
export type MarketItemStatus = 'active' | 'sold' | 'reserved' | 'archived';
export type OfferStatus = 'pending' | 'accepted' | 'rejected';
export type MarketCategory = 'all' | 'ai_tools' | 'hardware' | 'services' | 'digital_assets';

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
  buyerId?: string;
  image?: string;
  quantity: number;
  category: MarketCategory;
  createdAt: string;
}

const mapItemFromDB = (m: any): MarketItem => ({
  id: m.id,
  title: m.title || 'Untitled',
  description: m.description || '',
  listingType: (m.listing_type || m.listingType || 'sell_offer') as ListingType,
  pricingMode: (m.pricing_mode || m.pricingMode || 'fixed') as PricingMode,
  price: m.price || 0,
  minPrice: m.min_price || m.minPrice || 0,
  maxPrice: m.max_price || m.maxPrice || 0,
  currency: m.currency || 'Credits',
  status: (m.status || 'active') as MarketItemStatus,
  offers: m.offers || [],
  ownerId: m.owner_id || m.ownerId || '',
  ownerName: m.owner_name || m.ownerName || 'Unknown',
  buyerId: m.buyer_id || m.buyerId || undefined,
  image: m.image || '',
  quantity: m.quantity ?? 1,
  category: (m.category || 'digital_assets') as MarketCategory,
  createdAt: m.created_at || m.createdAt || new Date().toISOString(),
});

export const getMarketItems = async (
  from = 0, 
  to = 11, 
  search?: string, 
  category?: MarketCategory
): Promise<{ items: MarketItem[], hasMore: boolean }> => {
  try {
    let query = supabase
      .from('market_items')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const items = (data || []).map(mapItemFromDB);
    const hasMore = count ? to < count - 1 : false;
    
    return { items, hasMore };
  } catch (err) {
    console.error('Market fetch failure:', err);
    return { items: [], hasMore: false };
  }
};

export const addMarketItem = async (item: Omit<MarketItem, 'id' | 'createdAt' | 'offers' | 'status'>) => {
  try {
    const payload = {
      title: item.title,
      description: item.description,
      listing_type: item.listingType,
      pricing_mode: item.pricingMode,
      price: item.price,
      min_price: item.minPrice,
      max_price: item.maxPrice,
      currency: item.currency,
      owner_id: item.ownerId,
      owner_name: item.ownerName,
      image: item.image,
      quantity: item.quantity,
      category: item.category,
      status: 'active'
    };

    const { data, error } = await supabase.from('market_items').insert([payload]).select().single();
    if (error) throw error;

    addNotification({
      type: 'market_restock',
      title: 'New Neural Asset',
      message: `${item.ownerName} listed "${item.title}"`,
      priority: 'info'
    });

    return mapItemFromDB(data);
  } catch (err) {
    console.error('Add item failure:', err);
    throw err;
  }
};

export const updateItemStatus = async (itemId: string, status: MarketItemStatus, buyerId?: string) => {
  try {
    await supabase.from('market_items').update({ status, buyer_id: buyerId }).eq('id', itemId);
  } catch (err) {
    console.error('Update status failure:', err);
  }
};

export const addOffer = async (itemId: string, offer: Omit<MarketOffer, 'id' | 'status' | 'timestamp'>) => {
  try {
    const { data: itemData } = await supabase.from('market_items').select('offers, owner_id, title, currency').eq('id', itemId).single();
    if (!itemData) return;

    const newOffer: MarketOffer = {
      ...offer,
      id: Math.random().toString(36).substring(2, 9),
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    const updatedOffers = [...(itemData.offers || []), newOffer];
    await supabase.from('market_items').update({ offers: updatedOffers }).eq('id', itemId);

    addNotification({
      type: 'market_restock',
      title: 'New Offer Received',
      message: `${offer.userName} offered ${offer.offerAmount} ${itemData.currency} for "${itemData.title}"`,
      userId: itemData.owner_id,
      priority: 'info'
    });
  } catch (err) {
    console.error('Add offer failure:', err);
  }
};

export const updateOfferStatus = async (itemId: string, offerId: string, status: OfferStatus) => {
  try {
    const { data: itemData } = await supabase.from('market_items').select('*').eq('id', itemId).single();
    if (!itemData) return;

    let targetUserId = '';
    const updatedOffers = (itemData.offers || []).map((o: any) => {
      if (o.id === offerId) {
        targetUserId = o.userId;
        return { ...o, status };
      }
      return o;
    });

    await supabase.from('market_items').update({ 
      offers: updatedOffers,
      status: status === 'accepted' ? 'reserved' : itemData.status,
      buyer_id: status === 'accepted' ? targetUserId : itemData.buyer_id
    }).eq('id', itemId);

    addNotification({
      type: 'market_restock',
      title: status === 'accepted' ? 'Offer Accepted!' : 'Offer Declined',
      message: status === 'accepted' ? `Your offer for "${itemData.title}" was accepted.` : `Your offer was declined.`,
      userId: targetUserId,
      priority: status === 'accepted' ? 'info' : 'warning'
    });
  } catch (err) {
    console.error('Update offer failure:', err);
  }
};

export const updateItemQuantity = async (itemId: string, quantity: number) => {
  try {
    await supabase.from('market_items').update({ quantity }).eq('id', itemId);
  } catch (err) {
    console.error('Update quantity failure:', err);
  }
};

export const deleteMarketItem = async (id: string) => {
  try {
    await supabase.from('market_items').delete().eq('id', id);
  } catch (err) {
    console.error('Delete item failure:', err);
  }
};
