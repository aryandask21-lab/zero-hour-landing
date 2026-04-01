import { useState } from 'react';
import { CreditCard, Zap, Sparkles, Crown } from 'lucide-react';
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

const CREDIT_PACKS = [
  { amount: 500, price: 4.99, icon: Zap, label: 'Starter', popular: false },
  { amount: 1200, price: 9.99, icon: Sparkles, label: 'Popular', popular: true },
  { amount: 3000, price: 19.99, icon: Crown, label: 'Pro', popular: false },
  { amount: 7500, price: 39.99, icon: Crown, label: 'Elite', popular: false },
];

export function DepositDialog() {
  const [open, setOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    const credits = selectedPack !== null ? CREDIT_PACKS[selectedPack].amount : parseInt(customAmount);
    if (!credits || credits < 100) {
      toast({ title: 'Invalid amount', description: 'Minimum deposit is 100 credits.', variant: 'destructive' });
      return;
    }

    setProcessing(true);

    // TODO: Replace with actual Stripe checkout session creation
    // This would call your edge function: /functions/v1/create-checkout
    // const { data, error } = await supabase.functions.invoke('create-checkout', {
    //   body: { credits, priceInCents: Math.round(credits * 0.01 * 100) }
    // });
    // if (data?.url) window.location.href = data.url;

    toast({
      title: 'Payment gateway not configured',
      description: 'Stripe integration pending. Add your API key to enable real payments.',
    });

    setProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-crimson hover:bg-crimson/90 gap-2">
          <CreditCard className="h-4 w-4" /> Add Credits
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Purchase Credits</DialogTitle>
          <DialogDescription>Choose a credit pack or enter a custom amount</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {CREDIT_PACKS.map((pack, i) => {
            const Icon = pack.icon;
            return (
              <button
                key={i}
                onClick={() => { setSelectedPack(i); setCustomAmount(''); }}
                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                  selectedPack === i
                    ? 'border-crimson bg-crimson/10'
                    : 'border-border bg-secondary/20 hover:border-muted-foreground/50'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-2 right-2 text-[10px] font-bold bg-crimson text-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Best Value
                  </span>
                )}
                <Icon className="h-5 w-5 text-crimson mb-2" />
                <p className="font-heading text-xl text-foreground">{pack.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">credits</p>
                <p className="text-sm font-semibold text-foreground mt-1">${pack.price}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          <Label className="text-muted-foreground">Or enter custom amount</Label>
          <Input
            type="number"
            placeholder="Min 100 credits"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setSelectedPack(null); }}
            className="bg-secondary/30 border-border"
          />
          {customAmount && parseInt(customAmount) >= 100 && (
            <p className="text-sm text-muted-foreground">
              Estimated cost: <span className="text-foreground font-semibold">${(parseInt(customAmount) * 0.01).toFixed(2)}</span>
            </p>
          )}
        </div>

        <Button
          className="w-full mt-6 bg-crimson hover:bg-crimson/90 font-heading text-lg h-12"
          onClick={handleCheckout}
          disabled={processing || (selectedPack === null && !customAmount)}
        >
          {processing ? 'Processing...' : 'Proceed to Payment'}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-2">
          Secured by Stripe. You will be redirected to complete payment.
        </p>
      </DialogContent>
    </Dialog>
  );
}
