import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Wallet, Transaction } from '@/types/esports';

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWallet(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetchWallet = async () => {
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletData) {
        setWallet(walletData as Wallet);
      }

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (txData) {
        setTransactions(txData as Transaction[]);
      }

      setLoading(false);
    };

    fetchWallet();
  }, [user]);

  const refetch = async () => {
    if (!user) return;
    
    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (walletData) {
      setWallet(walletData as Wallet);
    }

    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txData) {
      setTransactions(txData as Transaction[]);
    }
  };

  return {
    wallet,
    transactions,
    loading,
    refetch,
    balance: wallet?.balance ?? 0,
    frozenBalance: wallet?.frozen_balance ?? 0,
  };
}
