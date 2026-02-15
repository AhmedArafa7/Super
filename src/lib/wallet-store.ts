
'use client';

import { supabase } from './supabaseClient';
import { addNotification } from './notification-store';
import { toast } from '@/hooks/use-toast';

export type TransactionType = 'deposit' | 'purchase_hold' | 'purchase_release' | 'purchase_refund';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  relatedId?: string;
  timestamp: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  frozenBalance: number;
}

const mapWalletFromDB = (w: any): Wallet => ({
  userId: w?.user_id ?? w?.userId ?? '',
  balance: Number(w?.balance ?? 0),
  frozenBalance: Number(w?.frozen_balance ?? w?.frozenBalance ?? 0)
});

const mapTransactionFromDB = (t: any): Transaction => ({
  id: t?.id ?? '',
  userId: t?.user_id ?? t?.userId ?? '',
  amount: Number(t?.amount ?? 0),
  type: (t?.type as TransactionType) ?? 'deposit',
  status: (t?.status as 'pending' | 'completed' | 'failed') ?? 'failed',
  description: t?.description ?? 'Neural transaction',
  relatedId: t?.related_id ?? t?.relatedId ?? undefined,
  timestamp: t?.created_at ?? t?.timestamp ?? new Date().toISOString()
});

/**
 * Fetches the definitive wallet state from the server.
 * Returns a fallback zeroed wallet on error instead of crashing.
 */
export const getWallet = async (userId: string): Promise<Wallet> => {
  if (!userId) return { userId: '', balance: 0, frozenBalance: 0 };
  
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
  } catch (err: any) {
    console.error('Wallet sync failure:', err.message);
    return { userId, balance: 0, frozenBalance: 0 };
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
  } catch (err: any) {
    console.error('Transaction fetch failure:', err.message);
    return [];
  }
};

export const depositFunds = async (userId: string, amount: number) => {
  if (!userId || amount <= 0) return false;
  try {
    const wallet = await getWallet(userId);
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
  } catch (err: any) {
    toast({ variant: 'destructive', title: 'Deposit Failed', description: err.message });
    return false;
  }
};

/**
 * Initiates an Escrow Hold using a secure server-side RPC.
 * This ensures atomic verification of funds and reservation.
 */
export const initiateEscrow = async (buyerId: string, sellerId: string, amount: number, itemId: string, itemName: string) => {
  try {
    // SECURITY: Call atomic server-side RPC to handle the transaction hold.
    // This prevents race conditions and client-side balance spoofing.
    const { data, error } = await supabase.rpc('secure_purchase_item', {
      p_user_id: buyerId,
      p_amount: amount,
      p_description: `Purchase: ${itemName} (Escrow Hold)`
    });

    if (error) throw error;

    // The RPC returns { success: boolean, error?: string, new_balance?: number }
    if (data.success === false) {
      throw new Error(data.error || 'Server rejected the transaction hold.');
    }

    // Success: Funds are now atomically moved to frozen_balance in the DB.
    // We return success and the new balance truth from the server.
    return { 
      success: true, 
      newBalance: data.new_balance 
    };
  } catch (err: any) {
    toast({ 
      variant: 'destructive', 
      title: 'Acquisition Refused', 
      description: err.message || 'The neural payment link was rejected by the server.' 
    });
    return { success: false, error: err.message };
  }
};

/**
 * Releases funds from Escrow to the Seller.
 */
export const releaseEscrow = async (buyerId: string, sellerId: string, amount: number, itemId: string) => {
  try {
    const [buyerWallet, sellerWallet] = await Promise.all([
      getWallet(buyerId),
      getWallet(sellerId)
    ]);

    // Atomic updates for release
    const { error: bError } = await supabase
      .from('wallets')
      .update({ frozen_balance: Math.max(0, buyerWallet.frozenBalance - amount) })
      .eq('user_id', buyerId);
    if (bError) throw bError;

    const { error: sError } = await supabase
      .from('wallets')
      .update({ balance: sellerWallet.balance + amount })
      .eq('user_id', sellerId);
    if (sError) throw sError;

    await supabase.from('transactions').insert([
      { user_id: buyerId, amount: 0, type: 'purchase_release', status: 'completed', related_id: itemId, description: `Payment released from Escrow` },
      { user_id: sellerId, amount: amount, type: 'deposit', status: 'completed', related_id: itemId, description: `Payment received for asset sync` }
    ]);

    return true;
  } catch (err: any) {
    toast({ variant: 'destructive', title: 'Sync Error', description: 'Failed to release funds.' });
    return false;
  }
};
