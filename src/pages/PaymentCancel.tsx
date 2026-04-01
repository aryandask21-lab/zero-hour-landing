import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-24 flex flex-col items-center justify-center text-center">
        <div className="p-6 rounded-full bg-red-400/10 mb-6">
          <XCircle className="h-16 w-16 text-red-400" />
        </div>
        <h1 className="font-heading text-4xl text-foreground mb-2">Payment Cancelled</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Your payment was not completed. No charges were made. You can try again anytime.
        </p>
        <div className="flex gap-4">
          <Button className="bg-crimson hover:bg-crimson/90" onClick={() => navigate('/wallet')}>
            Back to Wallet
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
