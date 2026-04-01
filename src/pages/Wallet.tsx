import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';
import { WalletStats } from '@/components/wallet/WalletStats';
import { TransactionList } from '@/components/wallet/TransactionList';
import { DepositDialog } from '@/components/wallet/DepositDialog';
import { WithdrawDialog } from '@/components/wallet/WithdrawDialog';

export default function WalletPage() {
  const { user } = useAuth();
  const { wallet, transactions, loading, balance, frozenBalance } = useWallet();
  const [filter, setFilter] = useState('all');

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-24">
        <div className="mb-12">
          <span className="text-crimson font-heading text-sm tracking-[0.3em] uppercase">Finance</span>
          <h1 className="font-heading text-5xl lg:text-6xl text-foreground mt-4">
            YOUR <span className="text-crimson">WALLET</span>
          </h1>
        </div>

        <WalletStats balance={balance} frozenBalance={frozenBalance} wallet={wallet} />

        <div className="flex gap-4 mb-8">
          <DepositDialog />
          <WithdrawDialog balance={balance} />
          <Button variant="outline" className="border-border gap-2">
            <History className="h-4 w-4" /> Export History
          </Button>
        </div>

        <TransactionList
          transactions={transactions}
          loading={loading}
          filter={filter}
          onFilterChange={setFilter}
        />
      </main>

      <Footer />
    </div>
  );
}
