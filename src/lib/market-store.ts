
'use client';

import { supabase } from './supabaseClient';

export type ListingType = 'sell_offer' | 'buy_request';
export type PricingMode = 'fixed' | 'range' | 'negotiable';
export type MarketItemStatus = 'active' | 'sold' | 'reserved' | 'archived';
export type OfferStatus = 'pending' | 'accepted' | 'rejected';
export type MarketCategory = 'all' | 'ai_tools' | 'hardware' | 'services' | 'digital_assets';
export type OfferType = 'price' | 'trade';

export interface MarketOffer {
  id: string;
  itemId: string;
  itemTitle?: string;
  buyerId: string;
  buyerName?: string;
  sellerId: string;
  type: OfferType;
  value?: number;
  details?: string;
  status: OfferStatus;
  timestamp: string;
}

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price?: number;
  sellerId: string;
  imageUrl?: string;
  category: MarketCategory;
  stockQuantity: number;
  status: MarketItemStatus;
  createdAt: string;
}

const mapItemFromDB = (m: any): MarketItem => ({
  id: m.id,
  title: m.title || 'Untitled',
  description: m.description || '',
  price: m.price || 0,
  sellerId: m.seller_id || '',
  imageUrl: m.image_url || '',
  category: (m.category || 'digital_assets') as MarketCategory,
  stockQuantity: m.stock_quantity ?? 1,
  status: (m.status || 'active') as MarketItemStatus,
  createdAt: m.created_at || new Date().toISOString(),
});

const mapOfferFromDB = (o: any): MarketOffer => ({
  id: o.id,
  itemId: o.product_id,
  itemTitle: o.products?.title || 'Unknown Item',
  buyerId: o.buyer_id,
  buyerName: o.users?.full_name || 'Anonymous Node',
  sellerId: o.seller_id,
  type: (o.offer_type || 'price') as OfferType,
  value: o.offer_value || 0,
  details: o.offer_details || '',
  status: (o.status || 'pending') as OfferStatus,
  timestamp: o.created_at
});

export const getMarketItems = async (
  from = 0, 
  to = 11, 
  search?: string, 
  category?: MarketCategory
): Promise<{ items: MarketItem[], hasMore: boolean }> => {
  try {
    let query = supabase.from('products').select('*', { count: 'exact' });
    if (search) query = query.ilike('title', `%${search}%`);
    if (category && category !== 'all') query = query.eq('category', category);

    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { items: (data || []).map(mapItemFromDB), hasMore: count ? to < count - 1 : false };
  } catch (err) {
    return { items: [], hasMore: false };
  }
};

export const addMarketItem = async (item: Omit<MarketItem, 'id' | 'createdAt' | 'status'>) => {
  const payload = {
    title: item.title,
    description: item.description,
    price: item.price,
    seller_id: item.sellerId,
    image_url: item.imageUrl,
    category: item.category,
    stock_quantity: item.stockQuantity,
    status: 'active'
  };
  const { data, error } = await supabase.from('products').insert([payload]).select().single();
  if (error) throw error;
  return mapItemFromDB(data);
};

export const addMarketOffer = async (itemId: string, sellerId: string, offer: Omit<MarketOffer, 'id' | 'status' | 'timestamp' | 'itemId' | 'sellerId'>) => {
  const payload = {
    product_id: itemId,
    buyer_id: offer.buyerId,
    seller_id: sellerId,
    offer_type: offer.type,
    offer_value: offer.value || null,
    offer_details: offer.details || null,
    status: 'pending'
  };
  const { error } = await supabase.from('offers').insert([payload]);
  return !error;
};

export const getReceivedOffers = async (userId: string): Promise<MarketOffer[]> => {
  const { data, error } = await supabase
    .from('offers')
    .select(`*, products(title), users!buyer_id(full_name)`)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return (data || []).map(mapOfferFromDB);
};

export const respondToOffer = async (offerId: string, status: OfferStatus) => {
  const { error } = await supabase.from('offers').update({ status }).eq('id', offerId);
  return !error;
};
