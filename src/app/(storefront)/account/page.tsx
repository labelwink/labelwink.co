'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Heart, Star, ChevronRight, Loader2, User, LogOut, MapPin, Gift } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Profile {
  full_name: string | null;
  phone: string | null;
  wink_points: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

// Loyalty tier based on lifetime_earned (passed from component)
function getLoyaltyTier(points: number, tiers: any[]) {
  if (!tiers || tiers.length === 0) {
    if (points >= 5000) return { name: 'Platinum', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', emoji: '💎' };
    if (points >= 2000) return { name: 'Gold',     color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',   emoji: '🥇' };
    if (points >= 500)  return { name: 'Silver',   color: 'text-slate-500',  bg: 'bg-slate-50 border-slate-200',   emoji: '🥈' };
    return                     { name: 'Bronze',   color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', emoji: '🥉' };
  }

  let currentTier = tiers[0];
  for (const tier of tiers) {
    if (points >= (tier.min || 0)) {
      currentTier = tier;
    }
  }

  return {
    name:  currentTier.name,
    color: currentTier.color ? `text-[${currentTier.color}]` : 'text-orange-600',
    bg:    currentTier.bg || 'bg-orange-50 border-orange-200',
    emoji: currentTier.icon || '🥉'
  };
}

export default function AccountDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [user,     setUser]     = useState<{ id: string; email: string; user_metadata: Record<string, string> } | null>(null);
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [tiers,    setTiers]    = useState<any[]>([]);
  const [lifetime, setLifetime] = useState(0);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setUser(user as any);

    // Parallel fetch — profile, recent orders, wishlist count, tiers
    const [profileData, ordersRes, wishlistRes, settingsRes] = await Promise.all([
      fetch('/api/storefront/profile').then(r => r.ok ? r.json() : null),
      // Fetch orders via API route (uses admin client, bypasses RLS)
      fetch('/api/storefront/orders').then(r => r.ok ? r.json() : { orders: [] }),
      supabase
        .from('wishlists')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('shop_settings')
        .select('loyalty_tiers')
        .single(),
    ]);

    if (profileData && !profileData.error) {
      setProfile(profileData);
      setEditName(profileData.full_name || '');
      setEditPhone(profileData.phone || '');
      setLifetime(profileData.wink_points || 0);
    }

    // ordersRes is now { orders: [...] } from API route
    const ordersArray = Array.isArray(ordersRes?.orders) ? ordersRes.orders.slice(0, 3) : [];
    setOrders(ordersArray);
    setWishlistCount(wishlistRes.count || 0);
    setTiers(settingsRes.data?.loyalty_tiers || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const parts = editName.trim().split(/\s+/);
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';

      const res = await fetch('/api/storefront/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name,
          last_name,
          phone: editPhone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const updated = await res.json();
      setProfile(prev => prev ? {
        ...prev,
        full_name: updated.full_name,
        phone: updated.phone,
      } : null);
      setEditName(updated.full_name || '');
      setEditPhone(updated.phone || '');
      toast.success('✅ Profile updated successfully');
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-labelwink-gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-semibold text-labelwink-green mb-4">Please sign in to view your account</p>
        <Link href="/account/login" className="bg-labelwink-green text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-labelwink-green-hover transition-all shadow-md">
          Sign In
        </Link>
      </div>
    );
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Shopper';
  const initials    = (displayName as string).charAt(0).toUpperCase();
  const points      = profile?.wink_points || 0;
  const tier        = getLoyaltyTier(lifetime, tiers);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Profile Card */}
      <div className="bg-white border border-labelwink-cream-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-xl bg-labelwink-green text-labelwink-gold flex items-center justify-center text-2xl font-bold font-serif flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-labelwink-green/50 font-bold block mb-1">Full Name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full border border-labelwink-cream-border bg-labelwink-cream-card rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-labelwink-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-labelwink-green/50 font-bold block mb-1">Phone</label>
                  <input
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full border border-labelwink-cream-border bg-labelwink-cream-card rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-labelwink-gold"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 bg-labelwink-green text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg hover:bg-labelwink-green-hover transition-all shadow-sm disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg border border-labelwink-cream-border hover:bg-labelwink-cream-card transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold text-labelwink-green font-heading">{displayName}</h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${tier.bg} ${tier.color}`}>
                    {tier.emoji} {tier.name}
                  </span>
                </div>
                <p className="text-sm text-labelwink-green/60 mt-0.5">{user.email}</p>
                {profile?.phone && (
                  <p className="text-sm text-labelwink-green/60 mt-0.5 font-medium tracking-tight">📞 {profile.phone}</p>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="mt-3 text-[10px] text-labelwink-gold font-bold uppercase tracking-[0.2em] hover:underline"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick nav */}
        <div className="mt-6 pt-6 border-t border-labelwink-cream-border flex flex-wrap gap-4">
          <Link href="/account/orders" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-labelwink-green hover:text-labelwink-gold transition-colors">
            <Package className="w-4 h-4" /> My Orders
          </Link>
          <Link href="/account/addresses" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-labelwink-green hover:text-labelwink-gold transition-colors">
            <MapPin className="w-4 h-4" /> Addresses
          </Link>
          <Link href="/account/wishlist" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-labelwink-green hover:text-labelwink-gold transition-colors">
            <Heart className="w-4 h-4" /> Wishlist
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Wink Points */}
        <div className={`border rounded-2xl p-5 relative overflow-hidden ${tier.bg}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-labelwink-green/60">Wink Points</p>
              <p className="text-3xl font-heading font-bold text-labelwink-green mt-1">{points.toLocaleString('en-IN')}</p>
            </div>
            <Gift className={`w-5 h-5 mt-1 ${tier.color}`} />
          </div>
          <p className="text-[10px] text-labelwink-green/50 font-semibold uppercase tracking-wider">
            {tier.name} member · Earn on every delivery
          </p>
          {/* Points to next tier */}
          {(() => {
            const currentTierIndex = tiers.findIndex(t => t.name === tier.name);
            const nextTier = tiers[currentTierIndex + 1];
            if (!nextTier) return null;
            
            const progress = Math.min(100, Math.round((lifetime / nextTier.min) * 100));
            return (
              <div className="mt-3">
                <div className="w-full bg-white/50 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${tier.color.replace('text-', 'bg-')}`} style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[9px] text-labelwink-green/40 mt-1">{nextTier.min - lifetime} pts to next tier</p>
              </div>
            );
          })()}
        </div>

        {/* Total Orders */}
        <div className="border border-labelwink-cream-border bg-white rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-labelwink-green/60">Total Orders</p>
              <p className="text-3xl font-heading font-bold text-labelwink-green mt-1">{orders.length}</p>
            </div>
            <Package className="w-5 h-5 mt-1 text-muted-foreground" />
          </div>
          <Link href="/account/orders" className="text-[10px] uppercase tracking-widest text-labelwink-gold font-bold hover:underline">
            View All Orders →
          </Link>
        </div>

        {/* Wishlist */}
        <div className="border border-labelwink-cream-border bg-white rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-labelwink-green/60">Saved Items</p>
              <p className="text-3xl font-heading font-bold text-labelwink-green mt-1">{wishlistCount}</p>
            </div>
            <Heart className="w-5 h-5 mt-1 text-muted-foreground" />
          </div>
          <Link href="/account/wishlist" className="text-[10px] uppercase tracking-widest text-labelwink-gold font-bold hover:underline">
            Go to Wishlist →
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4 border-b border-labelwink-cream-border pb-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-labelwink-green">Recent Orders</h2>
          <Link href="/account/orders" className="text-xs text-muted-foreground hover:text-labelwink-gold underline underline-offset-4 font-medium">
            All Orders
          </Link>
        </div>

        {orders.length > 0 ? (
          <div className="bg-white border border-labelwink-cream-border rounded-2xl overflow-hidden divide-y divide-labelwink-cream-border/50">
            {orders.map(order => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-labelwink-cream-card transition-colors group"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-labelwink-cream-card rounded-lg flex items-center justify-center text-labelwink-green font-bold text-xs font-mono flex-shrink-0">
                    #{order.id.slice(0, 4).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight group-hover:text-labelwink-gold transition-colors">
                      {order.order_number || `Order #${order.id.slice(0, 8).toUpperCase()}`}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <p className="font-bold text-sm">₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-tighter font-bold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-labelwink-cream-border rounded-2xl p-12 text-center shadow-inner">
            <Package className="w-10 h-10 mx-auto text-labelwink-green/20 mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-6">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/products"
              className="inline-block bg-labelwink-green text-white px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-labelwink-green-hover transition-all shadow-md"
            >
              Start Your Collection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
