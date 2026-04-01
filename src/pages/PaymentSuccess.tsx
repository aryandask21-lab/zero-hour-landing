import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // TODO: Verify payment with edge function using sessionId
    // supabase.functions.invoke('verify-payment', { body: { sessionId } })
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-24 flex flex-col items-center justify-center text-center">
        <div className="p-6 rounded-full bg-green-400/10 mb-6">
          <CheckCircle className="h-16 w-16 text-green-400" />
        </div>
        <h1 className="font-heading text-4xl text-foreground mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Your credits have been added to your wallet. You can now use them to enter tournaments and more.
        </p>
        <div className="flex gap-4">
          <Button className="bg-crimson hover:bg-crimson/90" onClick={() => navigate('/wallet')}>
            View Wallet
          </Button>
          <Button variant="outline" onClick={() => navigate('/tournaments')}>
            Browse Tournaments
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
