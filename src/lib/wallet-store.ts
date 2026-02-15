
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export interface PendingOfflineTransaction {
  id: string;
  amount: number;
  description: string;
  timestamp: string;
  itemId?: string;
  sellerId?: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  frozenBalance: number;
}

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  pendingOfflineTransactions: PendingOfflineTransaction[];
  isLoading: boolean;
  
  // Actions
  fetchWallet: (userId: string) => Promise<void>;
  fetchTransactions: (userId: string) => Promise<void>;
  processOfflinePurchase: (amount: number, description: string, itemId?: string, sellerId?: string) => void;
  syncOfflineTransactions: (userId: string) => Promise<void>;
  initiateEscrow: (buyerId: string, itemId: string, itemName: string) => Promise<{ success: boolean; newBalance?: number }>;
  depositFunds: (userId: string, amount: number) => Promise<boolean>;
}

const mapWalletFromDB = (w: any): Wallet => ({
  userId: w?.user_id ?? w?.userId ?? '',
  balance: Number(w?.balance ?? 0),
  frozenBalance: Number(w?.frozen_balance ?? w?.frozenBalance ?? 0)
});

const mapTransactionFromDB = (t: any): Transaction => ({
  id: String(t?.id ?? ''),
  userId: t?.user_id ?? t?.userId ?? '',
  amount: Number(t?.amount ?? 0),
  type: (t?.type as TransactionType) ?? 'deposit',
  status: (t?.status as 'pending' | 'completed' | 'failed') ?? 'failed',
  description: t?.description ?? 'Neural transaction',
  relatedId: t?.related_id ?? t?.relatedId ?? undefined,
  timestamp: t?.created_at ?? t?.timestamp ?? new Date().toISOString()
});

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: null,
      transactions: [],
      pendingOfflineTransactions: [],
      isLoading: false,

      fetchWallet: async (userId) => {
        if (!userId) return;
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
            set({ wallet: mapWalletFromDB(newData) });
          } else {
            set({ wallet: mapWalletFromDB(data) });
          }
        } catch (err: any) {
          console.error('Wallet sync failure:', err.message);
          set({ wallet: { userId, balance: 0, frozenBalance: 0 } });
        }
      },

      fetchTransactions: async (userId) => {
        if (!userId) return;
        try {
          const { data: txs, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (txError) throw txError;
          set({ transactions: (txs || []).map(mapTransactionFromDB) });
        } catch (err: any) {
          console.error('Transaction fetch failure:', err.message);
        }
      },

      processOfflinePurchase: (amount, description, itemId, sellerId) => {
        const newPending = {
          id: Math.random().toString(36).substring(2, 15),
          amount,
          description,
          timestamp: new Date().toISOString(),
          itemId,
          sellerId
        };
        
        set(state => ({
          pendingOfflineTransactions: [...state.pendingOfflineTransactions, newPending]
        }));
        
        toast({
          title: "Node Offline",
          description: "No neural link. Transaction queued for synchronization."
        });
      },

      syncOfflineTransactions: async (userId) => {
        const { pendingOfflineTransactions } = get();
        if (pendingOfflineTransactions.length === 0) return;

        toast({ title: "Syncing Ledger", description: "Transmitting offline payloads to Nexus." });

        for (const tx of pendingOfflineTransactions) {
          try {
            // Re-use RPC for each queued item
            const { data, error } = await supabase.rpc('secure_purchase_item', {
              p_buyer_id: userId,
              p_product_id: tx.itemId
            });

            if (error) throw error;
            if (data.success) {
              set(state => ({
                pendingOfflineTransactions: state.pendingOfflineTransactions.filter(p => p.id !== tx.id)
              }));
            }
          } catch (err) {
            console.error('Failed to sync offline transaction:', err);
          }
        }
        
        await get().fetchWallet(userId);
        await get().fetchTransactions(userId);
      },

      initiateEscrow: async (buyerId, itemId, itemName) => {
        set({ isLoading: true });
        
        if (!navigator.onLine) {
          // Note: In a real app we'd need to fetch price before going offline or 
          // allow the sync to fail later if balance is insufficient.
          get().processOfflinePurchase(0, itemName, itemId); 
          set({ isLoading: false });
          return { success: true };
        }

        try {
          // ATOMIC SECURE TRANSACTION VIA RPC
          const { data, error } = await supabase.rpc('secure_purchase_item', {
            p_buyer_id: buyerId,
            p_product_id: itemId
          });

          if (error) throw error;

          if (data.success === false) {
            toast({ 
              variant: 'destructive', 
              title: 'Acquisition Refused', 
              description: data.error || 'Server rejected the transaction.' 
            });
            set({ isLoading: false });
            return { success: false };
          }

          // Update truth from server response
          if (get().wallet) {
            set(state => ({
              wallet: state.wallet ? { ...state.wallet, balance: data.new_balance } : null
            }));
          }
          
          await get().fetchTransactions(buyerId);
          
          toast({ 
            title: "Acquisition Initialized", 
            description: `Funds for "${itemName}" moved to Secure Escrow.` 
          });

          set({ isLoading: false });
          return { success: true, newBalance: data.new_balance };
        } catch (err: any) {
          toast({ 
            variant: 'destructive', 
            title: 'Neural Link Error', 
            description: 'Failed to communicate with the transaction node.' 
          });
          set({ isLoading: false });
          return { success: false };
        }
      },

      depositFunds: async (userId, amount) => {
        if (!userId || amount <= 0) return false;
        set({ isLoading: true });
        try {
          // For deposits, we still update manually in this demo, but could also be RPC
          const { data: walletData } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();
          const newBalance = (walletData?.balance || 0) + amount;

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
            message: `A neural deposit of ${amount} credits was synchronized.`,
            userId,
            priority: 'info'
          });

          await get().fetchWallet(userId);
          set({ isLoading: false });
          return true;
        } catch (err: any) {
          toast({ variant: 'destructive', title: 'Deposit Failed', description: err.message });
          set({ isLoading: false });
          return false;
        }
      }
    }),
    {
      name: 'nexus-wallet-storage',
      partialize: (state) => ({ pendingOfflineTransactions: state.pendingOfflineTransactions }),
    }
  )
);

// Derived helper
export const selectTotalPendingDebt = (state: WalletState) => 
  state.pendingOfflineTransactions.reduce((acc, tx) => acc + tx.amount, 0);

// Compatibility exports
export const getWallet = async (userId: string) => {
  const store = useWalletStore.getState();
  await store.fetchWallet(userId);
  return store.wallet!;
};

export const getTransactions = async (userId: string) => {
  const store = useWalletStore.getState();
  await store.fetchTransactions(userId);
  return store.transactions;
};

export const initiateEscrow = (buyerId: string, itemId: string, itemName: string) => 
  useWalletStore.getState().initiateEscrow(buyerId, itemId, itemName);

export const depositFunds = (userId: string, amount: number) => 
  useWalletStore.getState().depositFunds(userId, amount);

export const releaseEscrow = async (buyerId: string, sellerId: string, amount: number, itemId: string) => {
  try {
    const { data: bWallet } = await supabase.from('wallets').select('frozen_balance').eq('user_id', buyerId).single();
    const { data: sWallet } = await supabase.from('wallets').select('balance').eq('user_id', sellerId).single();

    const { error: bError } = await supabase
      .from('wallets')
      .update({ frozen_balance: Math.max(0, (bWallet?.frozen_balance || 0) - amount) })
      .eq('user_id', buyerId);
    if (bError) throw bError;

    const { error: sError } = await supabase
      .from('wallets')
      .update({ balance: (sWallet?.balance || 0) + amount })
      .eq('user_id', sellerId);
    if (sError) throw sError;

    await supabase.from('transactions').insert([
      { user_id: buyerId, amount: 0, type: 'purchase_release', status: 'completed', related_id: itemId, description: `Payment released from Escrow` },
      { user_id: sellerId, amount: amount, type: 'deposit', status: 'completed', related_id: itemId, description: `Payment received for asset sync` }
    ]);

    await useWalletStore.getState().fetchWallet(buyerId);
    return true;
  } catch (err: any) {
    toast({ variant: 'destructive', title: 'Sync Error', description: 'Failed to release funds.' });
    return false;
  }
};
