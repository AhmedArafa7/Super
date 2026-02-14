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
  userId: w.user_id || w.userId,
  balance: w.balance || 0,
  frozenBalance: w.frozen_balance || w.frozenBalance || 0
});

const mapTransactionFromDB = (t: any): Transaction => ({
  id: t.id,
  userId: t.user_id || t.userId,
  amount: t.amount || 0,
  type: t.type,
  status: t.status,
  description: t.description || '',
  relatedId: t.related_id || t.relatedId,
  timestamp: t.created_at || t.timestamp
});

export const getWallet = async (userId: string): Promise<Wallet | null> => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching wallet:', error.message);
    return null;
  }

  if (!data) {
    // Auto-create wallet if doesn't exist
    const { data: newData, error: createError } = await supabase
      .from('wallets')
      .insert([{ user_id: userId, balance: 0, frozen_balance: 0 }])
      .select()
      .single();
    
    if (createError) return null;
    return mapWalletFromDB(newData);
  }

  return mapWalletFromDB(data);
};

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error.message);
    return [];
  }

  return (data || []).map(mapTransactionFromDB);
};

export const depositFunds = async (userId: string, amount: number) => {
  const wallet = await getWallet(userId);
  if (!wallet) return false;

  const newBalance = wallet.balance + amount;

  const { error: walletError } = await supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('user_id', userId);

  if (walletError) return false;

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
};

export const initiateEscrow = async (buyerId: string, sellerId: string, amount: number, itemId: string) => {
  const buyerWallet = await getWallet(buyerId);
  if (!buyerWallet || buyerWallet.balance < amount) return { success: false, error: 'Insufficient credits' };

  // 1. Deduct from buyer balance, add to buyer frozen
  const { error: buyerUpdateError } = await supabase
    .from('wallets')
    .update({ 
      balance: buyerWallet.balance - amount,
      frozen_balance: buyerWallet.frozenBalance + amount 
    })
    .eq('user_id', buyerId);

  if (buyerUpdateError) return { success: false, error: 'Internal sync error' };

  // 2. Log transaction for buyer
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
};

export const releaseEscrow = async (buyerId: string, sellerId: string, amount: number, itemId: string) => {
  const buyerWallet = await getWallet(buyerId);
  const sellerWallet = await getWallet(sellerId);

  if (!buyerWallet || !sellerWallet) return false;

  // 1. Remove from buyer frozen
  const { error: buyerError } = await supabase
    .from('wallets')
    .update({ frozen_balance: Math.max(0, buyerWallet.frozenBalance - amount) })
    .eq('user_id', buyerId);

  if (buyerError) return false;

  // 2. Add to seller available
  const { error: sellerError } = await supabase
    .from('wallets')
    .update({ balance: sellerWallet.balance + amount })
    .eq('user_id', sellerId);

  if (sellerError) return false;

  // 3. Log transactions
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
};
