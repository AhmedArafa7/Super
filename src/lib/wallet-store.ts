
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabaseClient';
import { toast } from '@/hooks/use-toast';

export type TransactionType = 'deposit' | 'purchase_hold' | 'purchase_release' | 'purchase_refund';

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  relatedOrderId?: string;
  timestamp: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  frozenBalance: number;
  currency: string;
}

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  isLoading: boolean;
  fetchWallet: (userId: string) => Promise<void>;
  fetchTransactions: (userId: string) => Promise<void>;
  depositFunds: (userId: string, amount: number) => Promise<boolean>;
}

const mapWalletFromDB = (w: any): Wallet => ({
  userId: w.user_id,
  balance: Number(w.balance || 0),
  frozenBalance: Number(w.frozen_balance || 0),
  currency: w.currency || 'Credits'
});

const mapTransactionFromDB = (t: any): Transaction => ({
  id: t.id,
  walletId: t.wallet_id,
  amount: Number(t.amount || 0),
  type: t.type as TransactionType,
  status: (t.status as any) || 'failed',
  description: t.description || '',
  relatedOrderId: t.related_order_id,
  timestamp: t.created_at
});

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: null,
      transactions: [],
      isLoading: false,

      fetchWallet: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (error) throw error;
          if (!data) {
            const { data: newData } = await supabase
              .from('wallets')
              .insert([{ user_id: userId, balance: 0, frozen_balance: 0, currency: 'Credits' }])
              .select().single();
            if (newData) set({ wallet: mapWalletFromDB(newData) });
          } else {
            set({ wallet: mapWalletFromDB(data) });
          }
        } catch (err) {}
      },

      fetchTransactions: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('wallet_id', userId)
            .order('created_at', { ascending: false });

          if (!error) set({ transactions: (data || []).map(mapTransactionFromDB) });
        } catch (err) {}
      },

      depositFunds: async (userId, amount) => {
        try {
          const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('user_id, balance')
            .eq('user_id', userId)
            .maybeSingle();

          if (walletError || !wallet) return false;

          const newBalance = Number(wallet.balance || 0) + amount;
          
          const { error: updateError } = await supabase
            .from('wallets')
            .update({ balance: newBalance })
            .eq('user_id', userId);

          if (updateError) throw updateError;

          await supabase.from('transactions').insert([{
            wallet_id: userId,
            amount,
            type: 'deposit',
            status: 'completed',
            description: `Manual Node Deposit (+${amount})`
          }]);

          await get().fetchWallet(userId);
          return true;
        } catch (err) {
          console.error('Deposit error:', err);
          return false;
        }
      }
    }),
    { name: 'nexus-wallet-storage' }
  )
);

/**
 * Standalone helper to fetch a wallet
 */
export const getWallet = async (userId: string): Promise<Wallet | null> => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error || !data) return null;
    return mapWalletFromDB(data);
  } catch (e) {
    return null;
  }
};

/**
 * Standalone helper to fetch transactions
 */
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapTransactionFromDB);
  } catch (e) {
    console.error('Failed to get transactions:', e);
    return [];
  }
};

/**
 * Standalone helper to deposit funds
 */
export const depositFunds = async (userId: string, amount: number): Promise<boolean> => {
  return useWalletStore.getState().depositFunds(userId, amount);
};

export const selectTotalPendingDebt = (state: any) => 0;
export type PendingTransaction = any;
