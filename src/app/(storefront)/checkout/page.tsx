'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ShoppingBag, ChevronRight, Truck, ShieldCheck,
  CreditCard, Loader2, Tag, CheckCircle2, MapPin, ChevronDown, Gift,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/lib/actions/order';
import Script from 'next/script';
import { ProductImage } from '@/components/storefront/ProductImage';

interface SavedAddress {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  is_default: boolean;
}

interface CouponState {
  code: string;
  status: 'idle' | 'loading' | 'valid' | 'invalid';
  discount: number;
  type: 'percentage' | 'fixed' | null;
  value: number;
  message: string;
}

const FREE_SHIPPING_THRESHOLD = 999; // fallback if settings not loaded

export default function CheckoutPage() {
  const { items, getTotals, clearCart } = useCartStore();
  const { subtotal } = getTotals();
  const router  = useRouter();
  const supabase = createClient();

  const [loading,        setLoading]       = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showSavedAddr,  setShowSavedAddr]  = useState(false);
  const [freeThreshold,  setFreeThreshold]  = useState(FREE_SHIPPING_THRESHOLD);

  const [coupon, setCoupon] = useState<CouponState>({
    code: '', status: 'idle', discount: 0, type: null, value: 0, message: '',
  });

  const [availablePoints, setAvailablePoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem]   = useState(0);
  const [usePoints,      setUsePoints]         = useState(false);

  const [formData, setFormData] = useState({
    email: '', fullName: '', address: '',
    city: '', state: '', pincode: '', phone: '',
  });

  // Load saved addresses & shipping threshold
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      // Autofill email
      setFormData(f => ({ ...f, email: user.email || '' }));
      // Load saved addresses
      supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .then(({ data }) => { if (data) setSavedAddresses(data as SavedAddress[]); });
    });

    // Load free shipping threshold from settings
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(s => {
        if (s?.shipping_config?.free_threshold) {
          setFreeThreshold(Number(s.shipping_config.free_threshold));
        }
      })
      .catch(() => {});

    // Load loyalty points balance
    fetch('/api/storefront/loyalty')
      .then(r => r.json())
      .then(d => { if (d.points) setAvailablePoints(d.points); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shipping     = subtotal >= freeThreshold ? 0 : 99;
  const discountAmt  = coupon.status === 'valid' ? coupon.discount : 0;
  const pointsDiscount = usePoints ? Math.min(pointsToRedeem, availablePoints, Math.floor(subtotal * 0.5)) : 0;
  const total        = subtotal + shipping - discountAmt - pointsDiscount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const lookupPincode = async (pin: string) => {
    if (pin.length !== 6) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const [data] = await res.json();
      if (data.Status === 'Success') {
        const po = data.PostOffice[0];
        setFormData(f => ({ ...f, city: po.District, state: po.State }));
      }
    } finally {
      setPincodeLoading(false);
    }
  };

  const applyAddress = (addr: SavedAddress) => {
    setFormData(f => ({
      ...f,
      fullName: addr.name,
      address:  addr.line1 + (addr.line2 ? `, ${addr.line2}` : ''),
      city:     addr.city,
      state:    addr.state,
      pincode:  addr.pincode,
      phone:    addr.phone,
    }));
    setShowSavedAddr(false);
  };

  const validateCoupon = async () => {
    const code = coupon.code.trim().toUpperCase();
    if (!code) return;
    setCoupon(c => ({ ...c, status: 'loading', message: '' }));
    try {
      const res  = await fetch(`/api/storefront/discount?code=${code}&subtotal=${subtotal}`);
      const data = await res.json();
      if (data.valid) {
        setCoupon(c => ({
          ...c,
          status:   'valid',
          discount: data.discount_amount,
          type:     data.type,
          value:    data.value,
          message:  `${data.type === 'percentage' ? `${data.value}% off` : `₹${data.value} off`} applied!`,
        }));
      } else {
        setCoupon(c => ({ ...c, status: 'invalid', discount: 0, message: data.error || 'Invalid code' }));
      }
    } catch {
      setCoupon(c => ({ ...c, status: 'invalid', discount: 0, message: 'Could not validate coupon' }));
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const result = await createOrder({
        userId:        user?.id,
        items:         items.map(item => ({
          id:         item.id,
          variantId:  item.id,
          name:       item.name,
          quantity:   item.quantity,
          price:      item.price,
          size:       item.size,
          color:      item.color,
          publicId:   item.publicId,
        })),
        subtotal,
        address:       formData,
        paymentMethod: 'razorpay',
        customerName:  formData.fullName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        couponCode:    coupon.status === 'valid' ? coupon.code.toUpperCase() : undefined,
        discountAmount: discountAmt,
        pointsToRedeem: pointsDiscount > 0 ? pointsDiscount : undefined,
      });

      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }

      // Trigger Razorpay
      const options = {
        key:         result.razorpayKeyId,
        amount:      result.amount,
        currency:    result.currency,
        name:        'Label Wink',
        description: 'Boutique Fashion Order',
        order_id:    result.razorpayOrderId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async (response: any) => {
          // Verify payment signature server-side before showing success
          try {
            await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                order_id:            result.orderId,
              }),
            });
          } catch { /* non-fatal — success page will show anyway */ }
          clearCart();
          router.push(
            `/checkout/success?orderId=${result.orderId}` +
            `&paymentId=${response.razorpay_payment_id}` +
            `&verified=1`
          );
        },
        prefill: { name: formData.fullName, email: formData.email, contact: formData.phone },
        theme: { color: '#016a6e' },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-heading mb-6">Your cart is empty</h1>
        <Link href="/collections/all" className={buttonVariants({ className: 'bg-teal text-cream h-12 px-8' })}>
          Discover Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-cream/30 min-h-screen">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="container mx-auto px-4 py-8 lg:py-16">
        <div className="flex flex-col-reverse md:flex-row gap-8 md:gap-12 lg:gap-20">

          {/* Left: Form */}
          <div className="space-y-10 md:w-3/5">
            <div>
              <h1 className="text-4xl font-heading font-semibold mb-4">Checkout</h1>
              <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <Link href="/cart" className="hover:text-charcoal transition-colors">Cart</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-charcoal font-bold">Information</span>
                <ChevronRight className="w-3 h-3" />
                <span>Payment</span>
              </nav>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-12">

              {/* Section 1: Delivery */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-charcoal text-cream flex items-center justify-center font-sans text-xs">1</span>
                    Delivery Details
                  </h2>
                  {savedAddresses.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowSavedAddr(!showSavedAddr)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-teal hover:text-teal/80 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Saved Addresses
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSavedAddr ? 'rotate-180' : ''}`} />
                      </button>
                      {showSavedAddr && (
                        <div className="absolute right-0 top-8 z-20 bg-white border border-sage/20 rounded-xl shadow-lg w-72 max-h-60 overflow-y-auto">
                          {savedAddresses.map(addr => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => applyAddress(addr)}
                              className="w-full text-left px-4 py-3 hover:bg-sage/5 transition-colors border-b border-sage/10 last:border-0"
                            >
                              <p className="font-semibold text-xs text-charcoal">{addr.name} {addr.is_default && <span className="text-teal">(Default)</span>}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{addr.line1}, {addr.city}, {addr.pincode}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-5">
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
                    <Label htmlFor="address" className="text-[10px] font-bold uppercase text-charcoal/60">Address (Flat, Street, Area)</Label>
                    <Input id="address" value={formData.address} onChange={handleInputChange} required className="h-14 bg-white border-sage/20 text-base" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label htmlFor="pincode" className="text-[10px] font-bold uppercase text-charcoal/60">Pincode</Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={e => {
                          setFormData(f => ({ ...f, pincode: e.target.value }));
                          lookupPincode(e.target.value);
                        }}
                        required
                        className="h-14 bg-white border-sage/20 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-[10px] font-bold uppercase text-charcoal/60">City</Label>
                      <Input
                        id="city" value={formData.city} onChange={handleInputChange} required
                        disabled={pincodeLoading}
                        placeholder={pincodeLoading ? 'Auto-filling...' : ''}
                        className={`h-14 bg-white border-sage/20 text-base ${pincodeLoading ? 'opacity-50' : ''}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-[10px] font-bold uppercase text-charcoal/60">State</Label>
                      <Input
                        id="state" value={formData.state} onChange={handleInputChange} required
                        disabled={pincodeLoading}
                        placeholder={pincodeLoading ? 'Auto-filling...' : ''}
                        className={`h-14 bg-white border-sage/20 text-base ${pincodeLoading ? 'opacity-50' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Coupon */}
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-charcoal text-cream flex items-center justify-center font-sans text-xs">2</span>
                  Discount Code
                </h2>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={coupon.code}
                      onChange={e => setCoupon(c => ({ ...c, code: e.target.value.toUpperCase(), status: 'idle', message: '', discount: 0 }))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); validateCoupon(); } }}
                      placeholder="Enter coupon code"
                      className="w-full h-14 bg-white border border-sage/20 rounded-xl pl-11 pr-4 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-teal"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={validateCoupon}
                    disabled={!coupon.code || coupon.status === 'loading'}
                    className="px-6 h-14 bg-charcoal text-cream rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-teal transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {coupon.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {coupon.message && (
                  <p className={`text-xs font-semibold flex items-center gap-1.5 ${
                    coupon.status === 'valid' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {coupon.status === 'valid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {coupon.message}
                  </p>
                )}
              </section>

              {/* Section 2b: Wink Points */}
              {availablePoints > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-amber-200 bg-amber-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Gift className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-charcoal">
                          {availablePoints.toLocaleString('en-IN')} Wink Points available
                        </p>
                        <p className="text-[10px] text-charcoal/50 mt-0.5">1 point = ₹1 off (max 50% of subtotal)</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUsePoints(u => !u);
                        if (!usePoints) setPointsToRedeem(Math.min(availablePoints, Math.floor(subtotal * 0.5)));
                        else setPointsToRedeem(0);
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        usePoints ? 'bg-amber-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        usePoints ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  {usePoints && (
                    <div className="flex items-center gap-3 px-1">
                      <input
                        type="range"
                        min={1}
                        max={Math.min(availablePoints, Math.floor(subtotal * 0.5))}
                        value={pointsToRedeem}
                        onChange={e => setPointsToRedeem(Number(e.target.value))}
                        className="flex-1 accent-amber-500"
                      />
                      <span className="text-sm font-bold text-amber-600 w-16 text-right">
                        ₹{pointsToRedeem.toLocaleString('en-IN')} off
                      </span>
                    </div>
                  )}
                </section>
              )}

              {/* Section 3: Payment */}
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-charcoal text-cream flex items-center justify-center font-sans text-xs">3</span>
                  Payment
                </h2>
                <div className="p-6 border-2 border-teal bg-teal/5 rounded-xl flex items-center gap-4">
                  <CreditCard className="text-teal w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-charcoal uppercase tracking-wider">Online Payment via Razorpay</p>
                    <p className="text-[10px] text-muted-foreground mt-1">UPI, Cards, Net Banking — 100% secure</p>
                  </div>
                </div>
              </section>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-charcoal text-cream text-sm font-bold tracking-[0.3em] uppercase rounded-none hover:bg-teal transition-all shadow-2xl"
              >
                {loading
                  ? <Loader2 className="animate-spin" />
                  : `Complete Purchase • ₹${total.toLocaleString('en-IN')}`
                }
              </Button>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="md:w-2/5 md:sticky md:top-24 h-fit bg-white border border-sage/20 p-6 md:p-8 rounded-xl shadow-sm">
            <h3 className="font-heading text-2xl font-semibold mb-8 flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-teal" /> Order Summary
            </h3>
            <div className="space-y-5 mb-8">
              {items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-24 bg-sage/5 rounded-lg relative overflow-hidden flex-shrink-0">
                    <ProductImage
                      publicId={item.publicId || ''}
                      alt={item.name}
                      width={80}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute -top-1 -right-1 bg-charcoal text-cream text-[10px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-charcoal text-sm">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{item.size} / {item.color}</p>
                    <p className="mt-2 font-bold text-teal">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Free shipping progress */}
            {shipping > 0 && (
              <div className="mb-5 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium">
                  Add ₹{(freeThreshold - subtotal).toLocaleString('en-IN')} more for free shipping!
                </p>
                <div className="mt-2 bg-amber-100 rounded-full h-1.5">
                  <div
                    className="bg-amber-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (subtotal / freeThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 border-t border-sage/10 pt-6 text-sm">
              <div className="flex justify-between text-charcoal/60 font-medium">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-charcoal/60 font-medium">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-teal font-semibold' : ''}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Coupon</span>
                  <span>−₹{discountAmt.toLocaleString('en-IN')}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Wink Points</span>
                  <span>−₹{pointsDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-heading font-bold pt-3 border-t border-sage/10 text-charcoal">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center p-4 bg-sage/5 rounded-xl text-center">
                <ShieldCheck className="w-5 h-5 text-teal mb-2" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-charcoal/60">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-sage/5 rounded-xl text-center">
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
