import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  TrendingUp,
  CreditCard,
  History,
  PiggyBank
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { Navigate } from 'react-router-dom';
import type { Transaction } from '@/types/esports';

const transactionIcons: Record<Transaction['type'], React.ComponentType<{ className?: string }>> = {
  deposit: ArrowDownRight,
  withdrawal: ArrowUpRight,
  entry_fee: ArrowUpRight,
  prize: ArrowDownRight,
  refund: ArrowDownRight,
  admin_credit: ArrowDownRight,
  admin_debit: ArrowUpRight,
};

const transactionColors: Record<Transaction['type'], string> = {
  deposit: 'text-green-400 bg-green-400/10',
  withdrawal: 'text-red-400 bg-red-400/10',
  entry_fee: 'text-orange-400 bg-orange-400/10',
  prize: 'text-yellow-400 bg-yellow-400/10',
  refund: 'text-blue-400 bg-blue-400/10',
  admin_credit: 'text-green-400 bg-green-400/10',
  admin_debit: 'text-red-400 bg-red-400/10',
};

export default function WalletPage() {
  const { user } = useAuth();
  const { wallet, transactions, loading, balance, frozenBalance } = useWallet();
  const [filter, setFilter] = useState<string>('all');

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === filter);

  const isPositive = (type: Transaction['type']) => 
    ['deposit', 'prize', 'refund', 'admin_credit'].includes(type);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-12">
          <span className="text-crimson font-heading text-sm tracking-[0.3em] uppercase">Finance</span>
          <h1 className="font-heading text-5xl lg:text-6xl text-white mt-4">
            YOUR <span className="text-crimson">WALLET</span>
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-crimson/20 to-transparent border-crimson/30">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <WalletIcon className="h-4 w-4" /> Available Balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl text-white">{balance.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Credits</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> In Escrow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl text-yellow-400">{frozenBalance.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Frozen for tournaments</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Lifetime Earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl text-green-400">
                {wallet?.lifetime_earnings?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total earned</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4" /> Lifetime Spent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl text-muted-foreground">
                {wallet?.lifetime_spent?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">Entry fees & more</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <Button className="bg-crimson hover:bg-crimson/90 gap-2">
            <CreditCard className="h-4 w-4" /> Add Credits
          </Button>
          <Button variant="outline" className="border-border gap-2">
            <History className="h-4 w-4" /> Export History
          </Button>
        </div>

        {/* Transaction Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'deposit', 'prize', 'entry_fee', 'refund'].map((type) => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              className={filter === type ? 'bg-crimson' : ''}
              onClick={() => setFilter(type)}
            >
              {type === 'all' ? 'All' : type.replace('_', ' ')}
            </Button>
          ))}
        </div>

        {/* Transaction History */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="font-heading">Transaction History</CardTitle>
            <CardDescription>Your recent wallet activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No transactions found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((tx) => {
                  const Icon = transactionIcons[tx.type];
                  const colorClass = transactionColors[tx.type];
                  const positive = isPositive(tx.type);

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white capitalize">
                            {tx.type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {tx.description || 'No description'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(tx.created_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono text-lg ${positive ? 'text-green-400' : 'text-red-400'}`}>
                          {positive ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: {tx.balance_after.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
