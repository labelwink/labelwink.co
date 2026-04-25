'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { CheckCircle2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
      <div className="flex justify-center mb-8">
        <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-teal" />
        </div>
      </div>
      
      <h1 className="font-heading text-4xl md:text-5xl font-semibold mb-4">Order Placed!</h1>
      <p className="text-muted-foreground text-lg mb-8">
        Thank you for shopping with Label Wink. Your order <span className="font-semibold text-charcoal">#{orderId?.slice(-6).toUpperCase()}</span> has been received and is being processed.
      </p>

      <div className="bg-sage/5 border border-sage/20 rounded-md p-6 mb-12 text-left space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Truck className="w-4 h-4 text-teal" />
          What Happens Next?
        </h3>
        <ul className="text-sm text-charcoal/80 space-y-2 list-disc list-inside">
          <li>You will receive an order confirmation email shortly.</li>
          <li>Our team will verify your address and prepare your package.</li>
          <li>Once shipped, we'll send you a tracking link via SMS/WhatsApp.</li>
          <li>For COD orders, please keep the exact change ready for delivery.</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/collections/all" className={buttonVariants({ className: "bg-charcoal hover:bg-charcoal/90 text-cream h-12 px-8 rounded-none uppercase tracking-widest font-semibold" })}>Continue Shopping</Link>
        <Link href="/account" className={buttonVariants({ variant: "outline", className: "h-12 px-8 border-sage/40 hover:bg-sage/10 rounded-none uppercase tracking-widest font-semibold gap-2 inline-flex items-center" })}>
          View My Orders <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="mt-16 pt-8 border-t border-sage/20 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShoppingBag className="w-3 h-3" />
        Label Wink Store
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
