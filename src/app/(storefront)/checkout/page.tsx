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
          free_shipping_threshold: Number(data.free_shipping_threshold) || 3499,
          standard_shipping_charge: Number(data.standard_shipping_charge) || 79,
          express_shipping_charge: Number(data.express_shipping_charge) || 149,
          loyalty_enabled: Boolean(data.loyalty_enabled),
          loyalty_redemption_ratio: Number(data.loyalty_redemption_ratio) || 100,
        });
      }
    } catch {
      setShopSettings({
        store_name: 'LabelWink', logo_url: '', free_shipping_threshold: 3499,
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

  const shippingCharge = shippingMethod === 'express' ? (shopSettings?.express_shipping_charge || 0) : (shopSettings?.standard_shipping_charge || 0);
  
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
        <h1 className="text-3xl font-heading mb-6 text-[#1A1A1A]">Your cart is empty</h1>
        <Link href="/collections/all">
          <Button className="bg-[#c9a84c] text-[#ffffff] hover:bg-[#b8973d] h-12 px-8">
            Discover Collection
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 px-4">
      <OTPLoginModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => { setShowAuthModal(false); checkUser(); }} />
      
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Checkout</h1>
        {/* Progress Bar */}
        <div className="flex flex-wrap items-center gap-y-4 mb-8">
          {[ {num:1, label:'Address'}, {num:2, label:'Shipping'}, {num:3, label:'Payment'}, {num:4, label:'Confirm'} ].map(s => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2 mr-6 last:mr-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-200 ${
                  isActive ? 'bg-[#1B3A2D] text-white' : 
                  isCompleted ? 'bg-[#1B3A2D] text-white' : 'bg-[#E8E2D9] text-[#5a7060]'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className={`hidden sm:inline text-xs font-semibold uppercase tracking-wider ${
                  isActive ? 'text-[#1B3A2D]' : isCompleted ? 'text-[#1A1A1A]' : 'text-[#5a7060]'
                }`}>
                  {s.label}
                </span>
                {s.num !== 4 && <ChevronRight className="w-3 h-3 text-[#E8E2D9] hidden sm:block ml-2" />}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-start">
          <div className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-[#1A1A1A] font-semibold text-base mb-4">1. Select Delivery Address</h2>
                
                {addresses.length > 0 && !showNewAddress && (
                  <div className="grid gap-4">
                    {addresses.map(addr => (
                      <label key={addr.id} className={`border rounded-xl p-4 cursor-pointer transition-colors duration-150 ${
                        selectedAddressId === addr.id ? 'border-[#1B3A2D] bg-[#F0F7F4]' : 'border-[#E8E2D9] hover:bg-[#FAF8F5]'
                      }`}>
                        <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="sr-only" />
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-[#1B3A2D] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg">
                              {addr.label}
                            </span>
                            {addr.is_default && <span className="bg-[#1B3A2D] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">Default</span>}
                          </div>
                          {selectedAddressId === addr.id && <CheckCircle2 className="w-5 h-5 text-[#1B3A2D]" />}
                        </div>
                        <p className="font-medium text-[#1A1A1A] text-sm">{addr.first_name} {addr.last_name}</p>
                        <p className="text-xs text-[#5a7060] mt-1 leading-relaxed">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                        <p className="text-xs text-[#5a7060] leading-relaxed">{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-xs mt-2 text-[#5a7060]">📱 +91 {addr.phone}</p>
                      </label>
                    ))}
                    
                    <button 
                      onClick={() => setShowNewAddress(true)} 
                      className="w-full mt-2 border border-[#1B3A2D] text-[#1B3A2D] bg-transparent hover:bg-[#F0ECE6] px-4 py-2 rounded-lg text-sm transition-colors duration-150"
                    >
                      + Add New Address
                    </button>
                  </div>
                )}

                {(showNewAddress || addresses.length === 0) && (
                  <form onSubmit={handleSaveAddress} className="bg-white rounded-xl border border-[#E8E2D9] p-6 shadow-sm mb-4 space-y-4">
                    <h3 className="text-[#1A1A1A] font-semibold text-base mb-4">Add New Address</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-[#333] mb-1 block">First Name</label>
                        <input required value={newAddress.first_name} onChange={e => setNewAddress({...newAddress, first_name: e.target.value})} className="w-full border border-[#E8E2D9] rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#aaa] bg-white focus:outline-none focus:border-[#1B3A2D] focus:ring-2 focus:ring-[#1B3A2D]/20 text-sm" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#333] mb-1 block">Last Name</label>
                        <input value={newAddress.last_name} onChange={e => setNewAddress({...newAddress, last_name: e.target.value})} className="w-full border border-[#E8E2D9] rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#aaa] bg-white focus:outline-none focus:border-[#1B3A2D] focus:ring-2 focus:ring-[#1B3A2D]/20 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-[#333] mb-1 block">Phone</label>
                        <input required type="tel" maxLength={10} value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value.replace(DIGITS_ONLY, '')})} className="w-full border border-[#E8E2D9] rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#aaa] bg-white focus:outline-none focus:border-[#1B3A2D] focus:ring-2 focus:ring-[#1B3A2D]/20 text-sm" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#333] mb-1 block">Alt Phone (Optional)</label>
                        <input type="tel" maxLength={10} value={newAddress.alt_phone} onChange={e => setNewAddress({...newAddress, alt_phone: e.target.value.replace(DIGITS_ONLY, '')})} className="w-full border border-[#E8E2D9] rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#aaa] bg-white focus:outline-none focus:border-[#1B3A2D] focus:ring-2 focus:ring-[#1B3A2D]/20 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#333] mb-1 block">Label</label>
                      <select value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value})} className="w-full border border-[#E8E2D9] rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#aaa] bg-white focus:outline-none focus:border-[#1B3A2D] focus:ring-2 focus:ring-[#1B3A2D]/20 text-sm">
                        <option value="Home">Home</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#333] mb-1 block">Address Line 1</label>
                      <input required value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} className="w-full border border-[#E8E2D9] rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#aaa] bg-white focus:outline-none focus:border-[#1B3A2D] focus:ring-2 focus:ring-[#1B3A2D]/20 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#333] mb-1 block">Address Line 2 (Optional)</label>
                      <input value={newAddress.line2} onChange={e => setNewAddress({...newAddress, line2: e.target.value})} className="w-full border border-[#E8E2D9] rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#aaa] bg-white focus:outline-none focus:border-[#1B3A2D] focus:ring-2 focus:ring-[#1B3A2D]/20 text-sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-[#333] mb-1 block">Pincode</label>
                        <input required maxLength={6} value={newAddress.pincode} onChange={e => handlePincodeChange(e.target.value.replace(DIGITS_ONLY, ''))} className="w-full border border-[#E8E2D9] rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#aaa] bg-white focus:outline-none focus:border-[#1B3A2D] focus:ring-2 focus:ring-[#1B3A2D]/20 text-sm" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#333] mb-1 block">City</label>
                        <input required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full border border-[#E8E2D9] rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#aaa] bg-white focus:outline-none focus:border-[#1B3A2D] focus:ring-2 focus:ring-[#1B3A2D]/20 text-sm" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#333] mb-1 block">State</label>
                        <select required value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full border border-[#E8E2D9] rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#aaa] bg-white focus:outline-none focus:border-[#1B3A2D] focus:ring-2 focus:ring-[#1B3A2D]/20 text-sm">
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
                      {addresses.length > 0 && <Button type="button" variant="outline" onClick={() => setShowNewAddress(false)} className="border-[#E8E2D9] text-[#1A1A1A]">Cancel</Button>}
                      <Button type="submit" disabled={loading || pincodeStatus === 'unavailable'} className="bg-[#1B3A2D] text-[#ffffff] hover:bg-[#173129] px-8 font-bold">Save Address</Button>
                    </div>
                  </form>
                )}

                {!showNewAddress && addresses.length > 0 && (
                  <Button onClick={continueToShipping} disabled={pincodeStatus === 'unavailable' && showNewAddress} className="w-full mt-6 bg-[#1B3A2D] text-[#ffffff] font-bold py-6 text-lg hover:bg-[#173129]">
                    Continue to Shipping →
                  </Button>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-[#1A1A1A] font-semibold text-base mb-4">2. Shipping Method</h2>
                
                <div className="space-y-3">
                    <label className={`border rounded-xl p-4 cursor-pointer transition-colors duration-150 block ${shippingMethod === 'standard' ? 'border-[#1B3A2D] bg-[#F0F7F4]' : 'border-[#E8E2D9] hover:bg-[#FAF8F5]'}`}>
                      <input type="radio" name="shipping" checked={shippingMethod === 'standard'} onChange={() => setShippingMethod('standard')} className="sr-only" />
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-[#1A1A1A] text-sm">Standard Delivery</span>
                        <span className="font-semibold text-[#1B3A2D]">₹{shopSettings?.standard_shipping_charge || 79}</span>
                      </div>
                      <p className="text-xs text-[#5a7060]">5–7 working days</p>
                    </label>

                    <label className={`border rounded-xl p-4 cursor-pointer transition-colors duration-150 block ${shippingMethod === 'express' ? 'border-[#1B3A2D] bg-[#F0F7F4]' : 'border-[#E8E2D9] hover:bg-[#FAF8F5]'}`}>
                      <input type="radio" name="shipping" checked={shippingMethod === 'express'} onChange={() => setShippingMethod('express')} className="sr-only" />
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-[#1A1A1A] text-sm">Express Delivery</span>
                        <span className="font-semibold text-[#1B3A2D]">₹{shopSettings?.express_shipping_charge || 149}</span>
                      </div>
                      <p className="text-xs text-[#5a7060]">2–3 working days</p>
                    </label>
                  </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setStep(1)} 
                    className="border border-[#1B3A2D] text-[#1B3A2D] bg-transparent hover:bg-[#F0ECE6] px-4 py-2 rounded-lg text-sm transition-colors duration-150"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={() => setStep(3)} 
                    className="flex-1 py-4 rounded-xl bg-[#1B3A2D] hover:bg-[#152e23] text-white font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-[#1A1A1A] font-semibold text-base mb-4">3. Payment & Offers</h2>
                
                <div className="bg-white rounded-xl border border-[#E8E2D9] p-6 shadow-sm mb-4">
                  <details className="group">
                    <summary className="flex justify-between items-center font-semibold text-[#1A1A1A] text-sm cursor-pointer list-none">
                      <span className="flex items-center gap-2"><Tag className="w-4 h-4 text-[#1B3A2D]"/> Have a coupon code?</span>
                      <span className="transition group-open:rotate-180">
                        <svg fill="none" height="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                      </span>
                    </summary>
                    <div className="pt-4 mt-4 border-t border-[#E8E2D9]">
                      <div className="flex gap-2">
                        <input value={coupon.code} onChange={e => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} placeholder="Enter code" className="flex-1 border border-[#E8E2D9] rounded-lg px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#aaa] focus:outline-none focus:border-[#1B3A2D]" />
                        <button onClick={validateCoupon} disabled={coupon.status === 'loading'} className="bg-[#1B3A2D] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#152e23] transition-colors whitespace-nowrap">Apply</button>
                      </div>
                      {coupon.message && (
                        <div className={`mt-3 text-xs flex justify-between items-center ${coupon.status === 'valid' ? 'text-green-600' : 'text-red-500'}`}>
                          {coupon.message}
                          {coupon.status === 'valid' && <button onClick={() => setCoupon({ code: '', status: 'idle', discount: 0, message: '' })} className="text-[#5a7060] hover:text-[#1B3A2D] text-sm underline underline-offset-2 ml-2">Remove</button>}
                        </div>
                      )}
                    </div>
                  </details>
                </div>

                {shopSettings?.loyalty_enabled && availablePoints > 0 && (
                  <div className="bg-white rounded-xl border border-[#E8E2D9] p-6 shadow-sm mb-4 flex justify-between items-center">
                    <div className="flex items-start gap-3">
                      <Gift className="w-5 h-5 text-[#1B3A2D] mt-0.5" />
                      <div>
                        <p className="font-medium text-[#1A1A1A] text-sm">Wink Points</p>
                        <p className="text-xs text-[#5a7060]">You have {availablePoints} points</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-medium text-[#333]">Use {maxPoints} pts (save ₹{Math.floor(maxPoints / ratio)})</span>
                      <input type="checkbox" checked={usePoints} onChange={e => {
                        setUsePoints(e.target.checked);
                        if (e.target.checked) setPointsToRedeem(maxPoints);
                        else setPointsToRedeem(0);
                      }} className="w-4 h-4 rounded border-[#E8E2D9] text-[#1B3A2D] focus:ring-[#1B3A2D]" />
                    </label>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-[#E8E2D9] p-6 shadow-sm mb-4 text-center">
                  <CreditCard className="w-8 h-8 mx-auto text-[#1B3A2D] mb-4" />
                  <h3 className="text-[#1A1A1A] font-semibold text-base mb-1">Pay Securely with Razorpay</h3>
                  <p className="text-xs text-[#5a7060] mb-4">UPI • Cards • Net Banking • EMI • Wallets</p>
                  <div className="flex justify-center gap-2">
                    {['UPI', 'VISA', 'MasterCard', 'RuPay'].map(brand => (
                      <span key={brand} className="bg-[#FAF8F5] border border-[#E8E2D9] px-2 py-1 text-[10px] font-bold rounded-lg text-[#444]">{brand}</span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setStep(2)} 
                    className="border border-[#1B3A2D] text-[#1B3A2D] bg-transparent hover:bg-[#F0ECE6] px-4 py-2 rounded-lg text-sm transition-colors duration-150"
                  >
                    ← Back
                  </button>
                  <div className="flex-1">
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
                      onSuccess={(orderNumber) => {
                        clearCart();
                        if (typeof window !== 'undefined') {
                          window.localStorage.removeItem('labelwink-cart');
                          window.localStorage.removeItem('cart');
                        }
                        const destination = orderNumber
                          ? `/order-confirmation?order_id=${orderNumber}`
                          : '/account/orders';
                        router.push(destination);
                      }}
                    />
                    <p className="text-xs text-[#5a7060] text-center mt-2">
                      🔒 Secured by Razorpay • 256-bit SSL encryption
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-24 bg-white rounded-xl border border-[#E8E2D9] p-6 shadow-sm">
                <Loader2 className="w-12 h-12 animate-spin text-[#1B3A2D] mx-auto mb-6" />
                <h2 className="text-[#1A1A1A] font-semibold text-base mb-2">Processing Payment...</h2>
                <p className="text-xs text-[#5a7060]">Please do not close this window or click back.</p>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-full">
            <div className="bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] p-6 sticky top-8">
              <h2 className="text-[#1A1A1A] font-semibold text-base mb-4">Order Summary</h2>
              
              <div className="space-y-0 mb-6 max-h-[50vh] overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-3 py-3 border-b border-[#E8E2D9] last:border-0">
                    <div className="w-16 h-16 rounded-lg border border-[#E8E2D9] flex-shrink-0 relative bg-white overflow-hidden">
                      <ProductImage publicId={item.publicId || item.image || ''} alt={item.name} width={64} height={64} size="thumb" className="object-cover w-full h-full" />
                      <span className="absolute -top-1 -right-1 bg-[#1B3A2D] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] leading-snug truncate">{item.name}</p>
                      <p className="text-xs text-[#5a7060] mt-0.5 uppercase">{item.size} {item.color ? `/ ${item.color}` : ''}</p>
                    </div>
                    <div className="text-sm font-semibold text-[#1A1A1A] ml-auto">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 border-t border-[#E8E2D9] pt-4">
                <div className="flex justify-between text-sm py-1.5 text-[#444]">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between text-sm py-1.5 text-[#444]">
                  <span>Shipping</span>
                  <span>₹{shippingCharge.toLocaleString('en-IN')}</span>
                </div>

                {discountAmt > 0 && (
                  <div className="flex justify-between text-sm py-1.5 text-green-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{discountAmt.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-sm py-1.5 text-green-600 font-medium">
                    <span>Wink Points</span>
                    <span>-₹{pointsDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-base text-[#1A1A1A] pt-3 border-t border-[#E8E2D9] mt-2">
                  <span>Total</span>
                  <span className="font-semibold text-[#1B3A2D]">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
