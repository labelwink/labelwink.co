'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag, ChevronRight, Truck, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/lib/actions/order';
import { toast } from 'sonner';
import Script from 'next/script';
import { ProductImage } from '@/components/storefront/ProductImage';

export default function CheckoutPage() {
  const { items, getTotals, clearCart } = useCartStore();
  const { subtotal } = getTotals();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });

  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const result = await createOrder({
        userId: user?.id,
        items: items.map(item => ({
          variantId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal,
        address: formData,
        paymentMethod
      });

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      if (result.isCOD) {
        toast.success('Order placed successfully!');
        clearCart();
        router.push(`/checkout/success?orderId=${result.orderId}`);
        return;
      }

      // Handle Razorpay
      const options = {
        key: result.razorpayKeyId,
        amount: result.amount,
        currency: result.currency,
        name: "Label Wink",
        description: "Boutique Fashion Order",
        order_id: result.razorpayOrderId,
        handler: function (response: any) {
          toast.success('Payment successful!');
          clearCart();
          router.push(`/checkout/success?orderId=${result.orderId}&paymentId=${response.razorpay_payment_id}`);
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#016a6e" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-heading mb-6">Your cart is empty</h1>
        <Link href="/collections/all" className={buttonVariants({ className: "bg-teal text-cream h-12 px-8" })}>Discover Collection</Link>
      </div>
    );
  }

  return (
    <div className="bg-cream/30 min-h-screen">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="container mx-auto px-4 py-8 lg:py-16">
        <div className="flex flex-col-reverse md:flex-row gap-8 md:gap-12 lg:gap-20">
          
          <div className="space-y-10 md:w-3/5">
            <div>
              <h1 className="text-4xl font-heading font-semibold mb-6">Checkout</h1>
              <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-8">
                <Link href="/cart" className="hover:text-charcoal transition-colors">Cart</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-charcoal font-bold">Information</span>
                <ChevronRight className="w-3 h-3" />
                <span>Payment</span>
              </nav>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-12">
              <section className="space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-charcoal text-cream flex items-center justify-center font-sans text-xs">1</span>
                  Delivery Details
                </h2>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-bold uppercase text-charcoal/60">Email</Label>
                      <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required className="h-14 bg-white border-sage/20 text-base" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[10px] font-bold uppercase text-charcoal/60">Phone</Label>
                      <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} required className="h-14 bg-white border-sage/20 text-base" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-[10px] font-bold uppercase text-charcoal/60">Full Name</Label>
                    <Input id="fullName" value={formData.fullName} onChange={handleInputChange} required className="h-14 bg-white border-sage/20 text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-[10px] font-bold uppercase text-charcoal/60">Address</Label>
                    <Input id="address" value={formData.address} onChange={handleInputChange} required className="h-14 bg-white border-sage/20 text-base" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-[10px] font-bold uppercase text-charcoal/60">City</Label>
                      <Input id="city" value={formData.city} onChange={handleInputChange} required className="h-14 bg-white border-sage/20 text-base" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-[10px] font-bold uppercase text-charcoal/60">State</Label>
                      <Input id="state" value={formData.state} onChange={handleInputChange} required className="h-14 bg-white border-sage/20 text-base" />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label htmlFor="pincode" className="text-[10px] font-bold uppercase text-charcoal/60">Pincode</Label>
                      <Input id="pincode" value={formData.pincode} onChange={handleInputChange} required className="h-14 bg-white border-sage/20 text-base" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-charcoal text-cream flex items-center justify-center font-sans text-xs">2</span>
                  Payment Method
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`p-6 border-2 rounded-xl flex flex-col gap-3 text-left transition-all ${paymentMethod === 'razorpay' ? 'border-teal bg-teal/5' : 'border-sage/20 bg-white'}`}
                  >
                    <CreditCard className={paymentMethod === 'razorpay' ? 'text-teal' : 'text-charcoal/40'} />
                    <div>
                      <p className="font-bold text-sm text-charcoal uppercase tracking-wider">Online Payment</p>
                      <p className="text-[10px] text-muted-foreground mt-1">UPI, Cards, Netbanking via Razorpay</p>
                    </div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-6 border-2 rounded-xl flex flex-col gap-3 text-left transition-all ${paymentMethod === 'cod' ? 'border-teal bg-teal/5' : 'border-sage/20 bg-white'}`}
                  >
                    <Truck className={paymentMethod === 'cod' ? 'text-teal' : 'text-charcoal/40'} />
                    <div>
                      <p className="font-bold text-sm text-charcoal uppercase tracking-wider">Cash on Delivery</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Pay when your order is delivered</p>
                    </div>
                  </button>
                </div>
              </section>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-16 bg-charcoal text-cream text-sm font-bold tracking-[0.3em] uppercase rounded-none hover:bg-teal transition-all shadow-2xl"
              >
                {loading ? <Loader2 className="animate-spin" /> : `Complete Purchase • ₹${total.toLocaleString()}`}
              </Button>
            </form>
          </div>

          <div className="md:w-2/5 md:sticky md:top-24 h-fit bg-white border border-sage/20 p-6 md:p-8 rounded-xl shadow-sm">
            <h3 className="font-heading text-2xl font-semibold mb-8 flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-teal" />
              Order Summary
            </h3>
            <div className="space-y-6 mb-8">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-24 bg-sage/5 rounded-lg relative overflow-hidden flex-shrink-0">
                    <ProductImage publicId={item.publicId || ''} alt={item.name} width={80} height={100} className="w-full h-full object-cover" />
                    <span className="absolute -top-1 -right-1 bg-charcoal text-cream text-[10px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-charcoal text-sm">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{item.size} / {item.color}</p>
                    <p className="mt-2 font-bold text-teal">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-sage/10 pt-8 text-sm">
              <div className="flex justify-between text-charcoal/60 font-medium">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-charcoal/60 font-medium">
                <span>Shipping</span>
                <span className={shipping === 0 ? "text-teal" : ""}>
                  {shipping === 0 ? "FREE" : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-xl font-heading font-bold pt-4 border-t border-sage/10 text-charcoal">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center p-4 bg-sage/5 rounded-lg text-center">
                <ShieldCheck className="w-5 h-5 text-teal mb-2" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-charcoal/60">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-sage/5 rounded-lg text-center">
                <Truck className="w-5 h-5 text-teal mb-2" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-charcoal/60">Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
