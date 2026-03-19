/**
 * Wallet Types & Selectors — extracted from wallet-store.ts for isolation.
 */

import { CurrencyCode } from './currency-store';

// ─── Types ───

export type TransactionType = 'deposit' | 'withdrawal' | 'purchase_hold' | 'purchase_release' | 'purchase_refund' | 'conversion';

export interface Transaction {
  id: string;
  userId?: string;
  amount: number;
  type: TransactionType;
  currency: CurrencyCode;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  timestamp: string;
  /** For conversion transactions */
  toCurrency?: CurrencyCode;
  toAmount?: number;
}

export interface PendingTransaction {
  id: string;
  title: string;
  price: number;
  currency: CurrencyCode;
  status: 'pending_sync' | 'failed_needs_action';
  timestamp: string;
  errorReason?: string;
}

export interface Wallet {
  /** Multi-currency balances */
  balances: Record<CurrencyCode, number>;
  /** Multi-currency frozen balances */
  frozenBalances: Record<CurrencyCode, number>;
  /** @deprecated Legacy single-currency field — auto-migrated on first read */
  balance?: number;
  /** @deprecated Legacy single-currency field — auto-migrated on first read */
  frozenBalance?: number;
  /** @deprecated Legacy field */
  currency?: string;
}

// ─── Selectors ───

export const selectTotalPendingDebt = (state: { pendingTransactions: PendingTransaction[] }) =>
  state.pendingTransactions.reduce((acc, curr) => acc + curr.price, 0);

/** Helper to get balance for a specific currency */
export const selectCurrencyBalance = (wallet: Wallet | null, currency: CurrencyCode): number =>
  wallet?.balances?.[currency] || 0;

/** Helper to get frozen balance for a specific currency */
export const selectCurrencyFrozen = (wallet: Wallet | null, currency: CurrencyCode): number =>
  wallet?.frozenBalances?.[currency] || 0;

/** Sum all real coin balances */
export const selectTotalRealBalance = (wallet: Wallet | null): number => {
  if (!wallet?.balances) return 0;
  return (['EGC', 'DLC', 'MDC', 'GMC', 'BKC'] as CurrencyCode[])
    .reduce((sum, code) => sum + (wallet.balances[code] || 0), 0);
};

/** Sum all fake coin balances */
export const selectTotalFakeBalance = (wallet: Wallet | null): number => {
  if (!wallet?.balances) return 0;
  return (['EGC_FAKE', 'DLC_FAKE', 'MDC_FAKE', 'GMC_FAKE', 'BKC_FAKE'] as CurrencyCode[])
    .reduce((sum, code) => sum + (wallet.balances[code] || 0), 0);
};
