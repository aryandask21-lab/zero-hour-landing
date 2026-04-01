import { Wallet as WalletIcon, Clock, TrendingUp, PiggyBank } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import type { Wallet } from '@/types/esports';

interface WalletStatsProps {
  balance: number;
  frozenBalance: number;
  wallet: Wallet | null;
}

export function WalletStats({ balance, frozenBalance, wallet }: WalletStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
      <Card className="bg-gradient-to-br from-crimson/20 to-transparent border-crimson/30">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <WalletIcon className="h-4 w-4" /> Available Balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-heading text-4xl text-foreground">{balance.toLocaleString()}</p>
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
  );
}
