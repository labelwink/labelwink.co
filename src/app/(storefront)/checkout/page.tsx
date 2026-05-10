'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag, ChevronRight, CheckCircle2, MapPin, Tag, Gift, Loader2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
// Mapping for CheckoutButton props:
// items -> items
// totalAmount -> total
// subtotal -> subtotal
// shippingFee -> shippingCharge
// discountAmount -> discountAmt
// couponCode -> coupon.status === 'valid' ? coupon.code : undefined
// shippingAddress -> selected saved address object mapped from addresses and selectedAddressId
// customerName -> user?.email
// customerEmail -> user?.email
// customerPhone -> user?.phone
import CheckoutButton from '@/components/CheckoutButton';
import { toast } from 'sonner';
import { ProductImage } from '@/components/storefront/ProductImage';
import OTPLoginModal from '@/components/auth/OTPLoginModal';

const DIGITS_ONLY = new RegExp('[^0-9]', 'g');

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
];

interface SavedAddress {
  id: string;
  label: string;
  first_name: string;
  last_name: string | null;
  phone: string;
  alt_phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface ShopSettings {
  store_name: string;
  logo_url: string;
  free_shipping_threshold: number;
  standard_shipping_charge: number;
  express_shipping_charge: number;
  loyalty_enabled: boolean;
  loyalty_redemption_ratio: number;
}

interface CouponState {
  code: string;
  status: 'idle' | 'loading' | 'valid' | 'invalid';
  discount: number;
  message: string;
}

export default function CheckoutPage() {
  const { items, getTotals, clearCart } = useCartStore();
  const { subtotal } = getTotals();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [availablePoints, setAvailablePoints] = useState(0);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    first_name: '', last_name: '', phone: '', alt_phone: '', label: 'Home',
    line1: '', line2: '', city: '', state: '', pincode: '', is_default: false
  });
  const [pincodeStatus, setPincodeStatus] = useState<'idle'|'checking'|'available'|'unavailable'>('idle');
  const [pincodeMessage, setPincodeMessage] = useState('');

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  const [coupon, setCoupon] = useState<CouponState>({ code: '', status: 'idle', discount: 0, message: '' });
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  useEffect(() => {
    checkUser();
    fetchSettings();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      fetchAddresses();
      fetchLoyaltyPoints();
    } else {
      setShowAuthModal(true);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data) {
        setShopSettings({
          store_name: data.store_name || 'LabelWink',
          logo_url: data.logo_url || '',
          free_shipping_threshold: Number(data.free_shipping_threshold) || 999,
          standard_shipping_charge: Number(data.standard_shipping_charge) || 79,
          express_shipping_charge: Number(data.express_shipping_charge) || 149,
          loyalty_enabled: Boolean(data.loyalty_enabled),
          loyalty_redemption_ratio: Number(data.loyalty_redemption_ratio) || 100,
        });
      }
    } catch {
      setShopSettings({
        store_name: 'LabelWink', logo_url: '', free_shipping_threshold: 999,
        standard_shipping_charge: 79, express_shipping_charge: 149,
        loyalty_enabled: true, loyalty_redemption_ratio: 100
      });
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/storefront/addresses');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAddresses(data);
        const def = data.find((a: SavedAddress) => a.is_default);
        if (def) setSelectedAddressId(def.id);
        else if (data.length > 0) setSelectedAddressId(data[0].id);
        else setShowNewAddress(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLoyaltyPoints = async () => {
    try {
      const res = await fetch('/api/storefront/loyalty');
      const data = await res.json();
      if (data && data.points) setAvailablePoints(data.points);
    } catch {
      console.error('Could not fetch points');
    }
  };

  const handlePincodeChange = async (pin: string) => {
    setNewAddress(prev => ({ ...prev, pincode: pin }));
    if (pin.length === 6) {
      setPincodeStatus('checking');
      try {
        const res = await fetch(`/api/storefront/check-pincode?pincode=${pin}`);
        const data = await res.json();
        if (res.ok && data.available !== false) {
          setPincodeStatus('available');
          setPincodeMessage(`Delivery available. Expected by ${data.expected_date || '3-5 days'}`);
          if (data.city) setNewAddress(prev => ({ ...prev, city: data.city, state: data.state }));
        } else {
          setPincodeStatus('unavailable');
          setPincodeMessage('Sorry, delivery not available to this pincode');
        }
      } catch {
        setPincodeStatus('available');
        setPincodeMessage('Delivery available. Expected by 3-5 days');
      }
    } else {
      setPincodeStatus('idle');
      setPincodeMessage('');
    }
  };

  const handleSaveAddress = async (e: FormEvent) => {
    e.preventDefault();
    if (pincodeStatus === 'unavailable') {
      toast.error('Cannot deliver to this pincode');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/storefront/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress)
      });
      if (res.ok) {
        await fetchAddresses();
        setShowNewAddress(false);
        toast.success('Address saved');
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to save address');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const continueToShipping = () => {
    if (!selectedAddressId && !showNewAddress) {
      toast.error('Please select or add an address');
      return;
    }
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setStep(2);
    
    if (shopSettings && subtotal >= shopSettings.free_shipping_threshold) {
      setShippingMethod('standard');
    }
  };

  const validateCoupon = async () => {
    if (!coupon.code) return;
    setCoupon(prev => ({ ...prev, status: 'loading', message: '' }));
    try {
      const res = await fetch('/api/storefront/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon.code, cart_total: subtotal, user_id: user?.id })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setCoupon({ code: data.code || coupon.code, status: 'valid', discount: data.discount_amount, message: `✅ ${data.code || coupon.code} applied — ₹${data.discount_amount} off` });
      } else {
        setCoupon(prev => ({ ...prev, status: 'invalid', discount: 0, message: `❌ ${data.error || 'Invalid coupon'}` }));
      }
    } catch {
      setCoupon(prev => ({ ...prev, status: 'invalid', discount: 0, message: '❌ Validation failed' }));
    }
  };

  const isFreeShipping = shopSettings && subtotal >= shopSettings.free_shipping_threshold;
  const shippingCharge = isFreeShipping 
    ? 0 
    : (shippingMethod === 'express' ? (shopSettings?.express_shipping_charge || 0) : (shopSettings?.standard_shipping_charge || 0));
  
  const discountAmt = coupon.status === 'valid' ? coupon.discount : 0;
  
  const ratio = shopSettings?.loyalty_redemption_ratio || 100;
  const maxPoints = Math.min(availablePoints, Math.floor(subtotal * 0.5 * ratio));
  const pointsDiscount = usePoints ? Math.floor(pointsToRedeem / ratio) : 0;

  const total = Math.max(0, subtotal + shippingCharge - discountAmt - pointsDiscount);

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId) ?? null;
  const shippingAddress = selectedAddress
    ? {
        name: `${selectedAddress.first_name} ${selectedAddress.last_name || ''}`.trim(),
        line1: selectedAddress.line1,
        line2: selectedAddress.line2,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        country: 'India',
      }
    : null;
  const customerName = user?.user_metadata?.full_name || user?.email || '';
  const customerEmail = user?.email || '';
  const customerPhone = user?.phone || '';

  if (items.length === 0 && step !== 4) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-heading mb-6 text-[#ffffff]">Your cart is empty</h1>
        <Link href="/collections/all">
          <Button className="bg-[#c9a84c] text-[#ffffff] hover:bg-[#b8973d] h-12 px-8">
            Discover Collection
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#faf7f2] min-h-screen text-[#ffffff]">
      <OTPLoginModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => { setShowAuthModal(false); checkUser(); }} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Progress Bar */}
          {[ {num:1, label:'Address'}, {num:2, label:'Shipping'}, {num:3, label:'Payment'}, {num:4, label:'Confirm'} ].map(s => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  isActive ? 'bg-[#c9a84c] text-[#ffffff]' : 
                  isCompleted ? 'bg-[#c9a84c] text-[#ffffff]' : 'bg-gray-300 text-[#9aab9e]'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span className={`hidden md:inline font-bold text-sm uppercase tracking-wider ${
                  isActive ? 'text-[#c9a84c]' : isCompleted ? 'text-[#ffffff]' : 'text-[#5a7060]'
                }`}>
                  {s.label}
                </span>
                {s.num !== 4 && <ChevronRight className="w-4 h-4 text-[#5a7060] hidden md:block ml-4" />}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col-reverse md:flex-row gap-8 lg:gap-16">
          {/* Left Column */}
          <div className="w-full md:w-[60%]">
            {step === 1 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-heading font-bold">1. Select Delivery Address</h2>
                
                {addresses.length > 0 && !showNewAddress && (
                  <div className="grid gap-4">
                    {addresses.map(addr => (
                      <label key={addr.id} className={`block relative border rounded-xl p-4 cursor-pointer transition-colors ${
                        selectedAddressId === addr.id ? 'border-[#c9a84c] bg-[#c9a84c]/5' : 'border-[#ffffff]/10 hover:border-[#ffffff]/30'
                      }`}>
                        <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="sr-only" />
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-white text-[#faf7f2] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                              {addr.label}
                            </span>
                            {addr.is_default && <span className="bg-[#c9a84c] text-[#ffffff] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">Default</span>}
                          </div>
                          {selectedAddressId === addr.id && <CheckCircle2 className="w-5 h-5 text-[#c9a84c]" />}
                        </div>
                        <p className="font-bold">{addr.first_name} {addr.last_name}</p>
                        <p className="text-sm mt-1">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                        <p className="text-sm">{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-sm mt-2 text-[#ffffff]/70">📱 +91 {addr.phone}</p>
                      </label>
                    ))}
                    
                    <Button variant="outline" onClick={() => setShowNewAddress(true)} className="w-full mt-2 border-[#ffffff]/20 text-[#ffffff]">
                      + Add New Address
                    </Button>
                  </div>
                )}

                {(showNewAddress || addresses.length === 0) && (
                  <form onSubmit={handleSaveAddress} className="border border-[#ffffff]/10 bg-white p-6 rounded-xl space-y-4">
                    <h3 className="font-bold mb-4 text-lg">Add New Address</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        <Input required value={newAddress.first_name} onChange={e => setNewAddress({...newAddress, first_name: e.target.value})} className="border-[#ffffff]/20" />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input value={newAddress.last_name} onChange={e => setNewAddress({...newAddress, last_name: e.target.value})} className="border-[#ffffff]/20" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Phone</Label>
                        <Input required type="tel" maxLength={10} value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value.replace(DIGITS_ONLY, '')})} className="border-[#ffffff]/20" />
                      </div>
                      <div>
                        <Label>Alt Phone (Optional)</Label>
                        <Input type="tel" maxLength={10} value={newAddress.alt_phone} onChange={e => setNewAddress({...newAddress, alt_phone: e.target.value.replace(DIGITS_ONLY, '')})} className="border-[#ffffff]/20" />
                      </div>
                    </div>
                    <div>
                      <Label>Label</Label>
                      <select value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value})} className="w-full h-10 px-3 rounded-md border border-[#ffffff]/20 bg-background text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]">
                        <option value="Home">Home</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label>Address Line 1</Label>
                      <Input required value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} className="border-[#ffffff]/20" />
                    </div>
                    <div>
                      <Label>Address Line 2 (Optional)</Label>
                      <Input value={newAddress.line2} onChange={e => setNewAddress({...newAddress, line2: e.target.value})} className="border-[#ffffff]/20" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Pincode</Label>
                        <Input required maxLength={6} value={newAddress.pincode} onChange={e => handlePincodeChange(e.target.value.replace(DIGITS_ONLY, ''))} className="border-[#ffffff]/20" />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="border-[#ffffff]/20" />
                      </div>
                      <div>
                        <Label>State</Label>
                        <select required value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full h-10 px-3 rounded-md border border-[#ffffff]/20 bg-background text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]">
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    {pincodeMessage && (
                      <div className={`text-sm font-semibold mt-2 ${pincodeStatus === 'available' ? 'text-green-600' : pincodeStatus === 'unavailable' ? 'text-red-500' : 'text-[#9aab9e]'}`}>
                        {pincodeStatus === 'available' ? '✅' : pincodeStatus === 'unavailable' ? '❌' : '⏳'} {pincodeMessage}
                      </div>
                    )}

                    <label className="flex items-center gap-2 mt-4 cursor-pointer">
                      <input type="checkbox" checked={newAddress.is_default} onChange={e => setNewAddress({...newAddress, is_default: e.target.checked})} className="rounded border-gray-300 text-[#c9a84c] focus:ring-[#c9a84c]" />
                      <span className="text-sm">Set as default address</span>
                    </label>

                    <div className="flex gap-4 mt-6">
                      {addresses.length > 0 && <Button type="button" variant="outline" onClick={() => setShowNewAddress(false)} className="border-[#ffffff]/20 text-[#ffffff]">Cancel</Button>}
                      <Button type="submit" disabled={loading || pincodeStatus === 'unavailable'} className="bg-[#c9a84c] text-[#ffffff] hover:bg-[#b8973d] px-8 font-bold">Save Address</Button>
                    </div>
                  </form>
                )}

                {!showNewAddress && addresses.length > 0 && (
                  <Button onClick={continueToShipping} disabled={pincodeStatus === 'unavailable' && showNewAddress} className="w-full mt-6 bg-[#c9a84c] text-[#ffffff] font-bold py-6 text-lg hover:bg-[#b8973d]">
                    Continue to Shipping →
                  </Button>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-heading font-bold">2. Shipping Method</h2>
                
                {isFreeShipping ? (
                  <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-green-800 text-lg">🎉 Shipping charges waived!</h3>
                      <p className="text-green-600 mt-1">Standard Delivery (5-7 working days)</p>
                    </div>
                    <span className="font-bold text-green-800 text-xl">FREE</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className={`block relative border rounded-xl p-6 cursor-pointer transition-colors ${shippingMethod === 'standard' ? 'border-[#c9a84c] bg-[#c9a84c]/5' : 'border-[#ffffff]/10 hover:border-[#ffffff]/30'}`}>
                      <input type="radio" name="shipping" checked={shippingMethod === 'standard'} onChange={() => setShippingMethod('standard')} className="sr-only" />
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">Standard Delivery</span>
                        <span className="font-bold text-lg">₹{shopSettings?.standard_shipping_charge || 79}</span>
                      </div>
                      <p className="text-[#ffffff]/70">5–7 working days</p>
                      <p className="text-sm mt-2 text-[#c9a84c] font-semibold">Estimated delivery: {new Date(Date.now() + 6 * 24*60*60*1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                    </label>

                    <label className={`block relative border rounded-xl p-6 cursor-pointer transition-colors ${shippingMethod === 'express' ? 'border-[#c9a84c] bg-[#c9a84c]/5' : 'border-[#ffffff]/10 hover:border-[#ffffff]/30'}`}>
                      <input type="radio" name="shipping" checked={shippingMethod === 'express'} onChange={() => setShippingMethod('express')} className="sr-only" />
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">Express Delivery</span>
                        <span className="font-bold text-lg">₹{shopSettings?.express_shipping_charge || 149}</span>
                      </div>
                      <p className="text-[#ffffff]/70">2–3 working days</p>
                      <p className="text-sm mt-2 text-[#c9a84c] font-semibold">Estimated delivery: {new Date(Date.now() + 2 * 24*60*60*1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                    </label>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="py-6 border-[#ffffff]/20 text-[#ffffff]">← Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1 bg-[#c9a84c] text-[#ffffff] font-bold py-6 text-lg hover:bg-[#b8973d]">
                    Continue to Payment →
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-heading font-bold">3. Payment & Offers</h2>
                
                <div className="border border-[#ffffff]/10 p-6 rounded-xl bg-white">
                  <details className="group">
                    <summary className="flex justify-between items-center font-bold cursor-pointer list-none">
                      <span className="flex items-center gap-2"><Tag className="w-5 h-5 text-[#c9a84c]"/> Have a coupon code?</span>
                      <span className="transition group-open:rotate-180">
                        <svg fill="none" height="24" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                      </span>
                    </summary>
                    <div className="pt-4 mt-4 border-t border-[#ffffff]/10">
                      <div className="flex gap-2">
                        <Input value={coupon.code} onChange={e => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} placeholder="Enter code" className="uppercase border-[#ffffff]/20" />
                        <Button onClick={validateCoupon} disabled={coupon.status === 'loading'} className="bg-white text-white hover:bg-white">Apply</Button>
                      </div>
                      {coupon.message && (
                        <div className={`mt-3 text-sm font-semibold flex justify-between items-center ${coupon.status === 'valid' ? 'text-green-600' : 'text-red-500'}`}>
                          {coupon.message}
                          {coupon.status === 'valid' && <button onClick={() => setCoupon({ code: '', status: 'idle', discount: 0, message: '' })} className="text-[#5a7060] hover:text-[#ffffff]">×</button>}
                        </div>
                      )}
                    </div>
                  </details>
                </div>

                {shopSettings?.loyalty_enabled && availablePoints > 0 && (
                  <div className="border border-[#ffffff]/10 p-6 rounded-xl bg-white flex justify-between items-center">
                    <div className="flex items-start gap-3">
                      <Gift className="w-6 h-6 text-[#c9a84c] mt-1" />
                      <div>
                        <p className="font-bold">Wink Points</p>
                        <p className="text-sm text-[#ffffff]/70">You have {availablePoints} points</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-semibold">Use {maxPoints} pts (save ₹{Math.floor(maxPoints / ratio)})</span>
                      <input type="checkbox" checked={usePoints} onChange={e => {
                        setUsePoints(e.target.checked);
                        if (e.target.checked) setPointsToRedeem(maxPoints);
                        else setPointsToRedeem(0);
                      }} className="w-5 h-5 rounded border-gray-300 text-[#c9a84c] focus:ring-[#c9a84c]" />
                    </label>
                  </div>
                )}

                <div className="border border-[#ffffff]/10 p-6 rounded-xl bg-white text-center">
                  <CreditCard className="w-10 h-10 mx-auto text-[#ffffff] mb-4" />
                  <h3 className="font-bold text-lg mb-1">Pay Securely with Razorpay</h3>
                  <p className="text-sm text-[#ffffff]/70 mb-4">UPI • Cards • Net Banking • EMI • Wallets</p>
                  <div className="flex justify-center gap-3">
                    <span className="bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-bold rounded">UPI</span>
                    <span className="bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-bold rounded">VISA</span>
                    <span className="bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-bold rounded">MasterCard</span>
                    <span className="bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-bold rounded">RuPay</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="py-6 border-[#ffffff]/20 text-[#ffffff]">← Back</Button>
                  <CheckoutButton
                    items={items}
                    totalAmount={total}
                    subtotal={subtotal}
                    shippingFee={shippingCharge}
                    discountAmount={discountAmt}
                    couponCode={coupon.status === 'valid' ? coupon.code : undefined}
                    shippingAddress={shippingAddress}
                    customerName={customerName}
                    customerEmail={customerEmail}
                    customerPhone={customerPhone}
                    onSuccess={() => {
                      clearCart();
                      router.push('/account/orders');
                    }}
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-24">
                <Loader2 className="w-16 h-16 animate-spin text-[#c9a84c] mx-auto mb-6" />
                <h2 className="text-3xl font-heading font-bold mb-2">Processing Payment...</h2>
                <p className="text-[#ffffff]/70">Please do not close this window or click back.</p>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-full md:w-[40%]">
            <div className="bg-white border border-[#ffffff]/10 rounded-xl p-6 md:p-8 sticky top-24 shadow-sm">
              <h2 className="text-xl font-heading font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg relative overflow-hidden flex-shrink-0 border border-gray-200">
                      <ProductImage publicId={item.publicId || ''} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                      <span className="absolute -top-2 -right-2 bg-white text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-bold">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.name}</p>
                      <p className="text-xs text-[#ffffff]/60 uppercase">{item.size} {item.color ? `/ ${item.color}` : ''}</p>
                    </div>
                    <div className="font-bold text-sm whitespace-nowrap">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-[#ffffff]/10 pt-6 text-sm">
                <div className="flex justify-between font-medium">
                  <span className="text-[#ffffff]/70">Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between font-medium">
                  <span className="text-[#ffffff]/70">Shipping</span>
                  {shippingCharge === 0 ? (
                    <span className="text-green-600 font-bold">FREE 🎉</span>
                  ) : (
                    <span>₹{shippingCharge.toLocaleString('en-IN')}</span>
                  )}
                </div>

                {discountAmt > 0 && (
                  <div className="flex justify-between font-semibold text-green-600">
                    <span>Discount</span>
                    <span>-₹{discountAmt.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div className="flex justify-between font-semibold text-green-600">
                    <span>Wink Points</span>
                    <span>-₹{pointsDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-2xl font-heading font-bold pt-4 border-t border-[#ffffff]/10 text-[#c9a84c]">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
}
