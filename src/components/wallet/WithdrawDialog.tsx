import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/hooks/useWallet';

interface WithdrawDialogProps {
  balance: number;
}

export function WithdrawDialog({ balance }: WithdrawDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { refetch } = useWallet();

  const handleWithdraw = async () => {
    const credits = parseInt(amount);
    if (!credits || credits < 500) {
      toast({ title: 'Invalid amount', description: 'Minimum withdrawal is 500 credits.', variant: 'destructive' });
      return;
    }
    if (credits > balance) {
      toast({ title: 'Insufficient balance', description: 'You don\'t have enough credits.', variant: 'destructive' });
      return;
    }

    setProcessing(true);

    const { data, error } = await supabase.functions.invoke('simulate-payment', {
      body: { action: 'withdraw', credits },
    });

    if (error || !data?.success) {
      toast({ title: 'Withdrawal failed', description: error?.message ?? 'Try again.', variant: 'destructive' });
    } else {
      toast({
        title: 'Withdrawal processed (DEMO)',
        description: `${credits.toLocaleString()} credits withdrawn.`,
      });
      await refetch();
      setOpen(false);
      setAmount('');
    }

    setProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-border gap-2">
          <ArrowUpRight className="h-4 w-4" /> Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Withdraw Credits</DialogTitle>
          <DialogDescription>Convert your credits back to real money</DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-lg bg-secondary/20 border border-border mt-4">
          <p className="text-sm text-muted-foreground">Available balance</p>
          <p className="font-heading text-3xl text-foreground">{balance.toLocaleString()} <span className="text-sm text-muted-foreground">credits</span></p>
        </div>

        <div className="mt-4 space-y-2">
          <Label className="text-muted-foreground">Amount to withdraw</Label>
          <Input
            type="number"
            placeholder="Min 500 credits"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-secondary/30 border-border"
          />
          {amount && parseInt(amount) >= 500 && (
            <p className="text-sm text-muted-foreground">
              You'll receive: <span className="text-foreground font-semibold">${(parseInt(amount) * 0.008).toFixed(2)}</span>
              <span className="text-xs ml-1">(after 20% platform fee)</span>
            </p>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-2 space-y-1">
          <p>• Minimum withdrawal: 500 credits</p>
          <p>• Processing time: 3-5 business days</p>
          <p>• Platform fee: 20%</p>
        </div>

        <Button
          className="w-full mt-4 bg-crimson hover:bg-crimson/90 font-heading h-12"
          onClick={handleWithdraw}
          disabled={processing || !amount}
        >
          {processing ? 'Processing...' : 'Request Withdrawal'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
