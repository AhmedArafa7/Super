
'use client';

import { supabase } from './supabaseClient';
import { addNotification } from './notification-store';

export type TransactionType = 'deposit' | 'purchase_hold' | 'purchase_release' | 'purchase_refund';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  relatedId?: string; // Product ID or Order ID
  timestamp: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  frozenBalance: number;
}

const mapWalletFromDB = (w: any): Wallet => ({
  userId: w?.user_id ?? w?.userId ?? '',
  balance: w?.balance ?? 0,
  frozenBalance: w?.frozen_balance ?? w?.frozenBalance ?? 0
});

const mapTransactionFromDB = (t: any): Transaction => ({
  id: t?.id ?? '',
  userId: t?.user_id ?? t?.userId ?? '',
  amount: t?.amount ?? 0,
  type: (t?.type as TransactionType) ?? 'deposit',
  status: (t?.status as 'pending' | 'completed' | 'failed') ?? 'failed',
  description: t?.description ?? '',
  relatedId: t?.related_id ?? t?.relatedId ?? undefined,
  timestamp: t?.created_at ?? t?.timestamp ?? new Date().toISOString()
});

export const getWallet = async (userId: string): Promise<Wallet | null> => {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const { data: newData, error: createError } = await supabase
        .from('wallets')
        .insert([{ user_id: userId, balance: 0, frozen_balance: 0 }])
        .select()
        .single();
      
      if (createError) throw createError;
      return mapWalletFromDB(newData);
    }

    return mapWalletFromDB(data);
  } catch (err) {
    console.error('Wallet fetch crashed:', err);
    return null;
  }
};

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapTransactionFromDB);
  } catch (err) {
    console.error('Transaction log fetch failed:', err);
    return [];
  }
};

export const depositFunds = async (userId: string, amount: number) => {
  if (!userId || amount <= 0) return false;
  try {
    const wallet = await getWallet(userId);
    if (!wallet) return false;

    const newBalance = wallet.balance + amount;

    const { error: walletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (walletError) throw walletError;

    await supabase.from('transactions').insert([{
      user_id: userId,
      amount,
      type: 'deposit',
      status: 'completed',
      description: `Manual Neural Deposit (+${amount})`
    }]);

    addNotification({
      type: 'market_restock',
      title: 'Credits Received',
      message: `A neural deposit of ${amount} credits was synchronized to your node.`,
      userId,
      priority: 'info'
    });

    return true;
  } catch (err) {
    console.error('Deposit process failed:', err);
    return false;
  }
};

export const initiateEscrow = async (buyerId: string, sellerId: string, amount: number, itemId: string) => {
  if (!buyerId || !sellerId || !itemId) return { success: false, error: 'Invalid transaction parameters' };
  
  try {
    const buyerWallet = await getWallet(buyerId);
    if (!buyerWallet) return { success: false, error: 'Buyer wallet not found' };
    if (buyerWallet.balance < amount) return { success: false, error: 'Insufficient credits in available balance' };

    // Atomicity check
    const { error: buyerUpdateError } = await supabase
      .from('wallets')
      .update({ 
        balance: buyerWallet.balance - amount,
        frozen_balance: buyerWallet.frozenBalance + amount 
      })
      .eq('user_id', buyerId);

    if (buyerUpdateError) throw buyerUpdateError;

    await supabase.from('transactions').insert([{
      user_id: buyerId,
      amount: -amount,
      type: 'purchase_hold',
      status: 'completed',
      related_id: itemId,
      description: `Funds reserved for item acquisition (Escrow Hold)`
    }]);

    addNotification({
      type: 'market_restock',
      title: 'Purchase Initialized',
      message: `Escrow hold activated for ${amount} credits. Funds reserved until you confirm delivery.`,
      userId: buyerId
    });

    return { success: true };
  } catch (err) {
    console.error('Escrow initialization failed:', err);
    return { success: false, error: 'Neural link synchronization failure' };
  }
};

export const releaseEscrow = async (buyerId: string, sellerId: string, amount: number, itemId: string) => {
  if (!buyerId || !sellerId || !itemId) return false;
  
  try {
    const [buyerWallet, sellerWallet] = await Promise.all([
      getWallet(buyerId),
      getWallet(sellerId)
    ]);

    if (!buyerWallet || !sellerWallet) throw new Error('Wallet node missing');

    const { error: buyerError } = await supabase
      .from('wallets')
      .update({ frozen_balance: Math.max(0, (buyerWallet?.frozenBalance ?? 0) - amount) })
      .eq('user_id', buyerId);

    if (buyerError) throw buyerError;

    const { error: sellerError } = await supabase
      .from('wallets')
      .update({ balance: (sellerWallet?.balance ?? 0) + amount })
      .eq('user_id', sellerId);

    if (sellerError) throw sellerError;

    await supabase.from('transactions').insert([
      {
        user_id: buyerId,
        amount: 0,
        type: 'purchase_release',
        status: 'completed',
        related_id: itemId,
        description: `Payment released from Escrow`
      },
      {
        user_id: sellerId,
        amount: amount,
        type: 'deposit',
        status: 'completed',
        related_id: itemId,
        description: `Payment received for asset synchronization`
      }
    ]);

    addNotification({
      type: 'market_restock',
      title: 'Credits Transferred',
      message: `You received ${amount} credits for the acquisition of your asset.`,
      userId: sellerId,
      priority: 'info'
    });

    return true;
  } catch (err) {
    console.error('Escrow release failed:', err);
    return false;
  }
};
