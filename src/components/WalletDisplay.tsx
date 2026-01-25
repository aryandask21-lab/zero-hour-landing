import { Wallet, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWallet } from '@/hooks/useWallet';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
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
  deposit: 'text-green-400',
  withdrawal: 'text-red-400',
  entry_fee: 'text-orange-400',
  prize: 'text-yellow-400',
  refund: 'text-blue-400',
  admin_credit: 'text-green-400',
  admin_debit: 'text-red-400',
};

export function WalletDisplay() {
  const { balance, frozenBalance, transactions } = useWallet();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-crimson/50 hover:border-crimson">
          <Wallet className="h-4 w-4 text-crimson" />
          <span className="font-heading text-white">{balance.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">Credits</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-card border-border">
        <div className="p-3 border-b border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground text-sm">Available</span>
            <span className="font-heading text-xl text-white">{balance.toLocaleString()}</span>
          </div>
          {frozenBalance > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" /> In escrow
              </span>
              <span className="text-sm text-yellow-400">{frozenBalance.toLocaleString()}</span>
            </div>
          )}
        </div>
        
        <div className="p-2">
          <span className="text-xs text-muted-foreground px-2">Recent Activity</span>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No transactions yet
          </div>
        ) : (
          transactions.slice(0, 5).map((tx) => {
            const Icon = transactionIcons[tx.type];
            const colorClass = transactionColors[tx.type];
            const isPositive = ['deposit', 'prize', 'refund', 'admin_credit'].includes(tx.type);
            
            return (
              <DropdownMenuItem key={tx.id} className="flex justify-between p-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${colorClass} bg-current/10`}>
                    <Icon className={`h-3 w-3 ${colorClass}`} />
                  </div>
                  <div>
                    <p className="text-sm text-white capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <span className={`font-mono text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
                </span>
              </DropdownMenuItem>
            );
          })
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center text-crimson text-sm justify-center"
          onClick={() => navigate('/wallet')}
        >
          View wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
