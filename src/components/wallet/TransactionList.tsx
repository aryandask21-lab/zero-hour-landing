import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
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

const isPositive = (type: Transaction['type']) =>
  ['deposit', 'prize', 'refund', 'admin_credit'].includes(type);

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  filter: string;
  onFilterChange: (f: string) => void;
}

export function TransactionList({ transactions, loading, filter, onFilterChange }: TransactionListProps) {
  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(tx => tx.type === filter);

  return (
    <>
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'deposit', 'withdrawal', 'prize', 'entry_fee', 'refund'].map((type) => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            className={filter === type ? 'bg-crimson' : ''}
            onClick={() => onFilterChange(type)}
          >
            {type === 'all' ? 'All' : type.replace('_', ' ')}
          </Button>
        ))}
      </div>

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
                        <p className="font-medium text-foreground capitalize">
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
    </>
  );
}
