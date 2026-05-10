'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Heart, Star, ChevronRight, Loader2, User, LogOut, MapPin, Gift } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Profile {
  full_name: string | null;
  phone: string | null;
  wink_points: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
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
    const [profileRes, ordersRes, wishlistRes, settingsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, phone, wink_points, lifetime_earned')
        .eq('id', user.id)
        .single(),
      supabase
        .from('orders')
        .select('id, status, total, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('wishlists')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('shop_settings')
        .select('loyalty_tiers')
        .single(),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
      setEditName(profileRes.data.full_name || '');
      setEditPhone(profileRes.data.phone || '');
      setLifetime(profileRes.data.lifetime_earned || 0);
    } else {
      // Upsert empty profile on first visit
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || null,
        phone: null,
        wink_points: 0,
      }, { onConflict: 'id' });
      setProfile({ full_name: user.user_metadata?.full_name || null, phone: null, wink_points: 0 });
      setEditName(user.user_metadata?.full_name || '');
    }

    setOrders(ordersRes.data || []);
    setWishlistCount(wishlistRes.count || 0);
    setTiers(settingsRes.data?.loyalty_tiers || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: editName,
      phone: editPhone,
    }, { onConflict: 'id' });
    setProfile(prev => prev ? { ...prev, full_name: editName, phone: editPhone } : prev);
    setSaving(false);
    setEditing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-semibold text-charcoal mb-4">Please sign in to view your account</p>
        <Link href="/account/login" className="bg-[#1a3a34] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#16312b] transition-colors">
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
      <div className="bg-white border border-sage/20 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[#1a3a34] text-[#c9a84c] flex items-center justify-center text-2xl font-bold font-serif flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-charcoal/50 font-bold block mb-1">Full Name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full border border-sage/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-charcoal/50 font-bold block mb-1">Phone</label>
                  <input
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full border border-sage/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#1a3a34] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16312b] transition-colors disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-xs px-4 py-2 rounded-lg border border-sage/30 hover:bg-sage/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold text-charcoal">{displayName}</h1>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color}`}>
                    {tier.emoji} {tier.name}
                  </span>
                </div>
                <p className="text-sm text-charcoal/60 mt-0.5">{user.email}</p>
                {profile?.phone && (
                  <p className="text-sm text-charcoal/60 mt-0.5">📞 {profile.phone}</p>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="mt-3 text-xs text-teal font-bold uppercase tracking-wider hover:underline"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick nav */}
        <div className="mt-6 pt-6 border-t border-sage/20 flex flex-wrap gap-4">
          <Link href="/account/orders" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-charcoal hover:text-teal transition-colors">
            <Package className="w-4 h-4" /> My Orders
          </Link>
          <Link href="/account/addresses" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-charcoal hover:text-teal transition-colors">
            <MapPin className="w-4 h-4" /> Addresses
          </Link>
          <Link href="/account/wishlist" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-charcoal hover:text-teal transition-colors">
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
        <div className={`border rounded-xl p-5 relative overflow-hidden ${tier.bg}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-charcoal/60">Wink Points</p>
              <p className="text-3xl font-heading font-bold text-charcoal mt-1">{points.toLocaleString('en-IN')}</p>
            </div>
            <Gift className={`w-5 h-5 mt-1 ${tier.color}`} />
          </div>
          <p className="text-[10px] text-charcoal/50 font-semibold uppercase tracking-wider">
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
                <p className="text-[9px] text-charcoal/40 mt-1">{nextTier.min - lifetime} pts to next tier</p>
              </div>
            );
          })()}
        </div>

        {/* Total Orders */}
        <div className="border border-sage/20 bg-white rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-charcoal/60">Total Orders</p>
              <p className="text-3xl font-heading font-bold text-charcoal mt-1">{orders.length}</p>
            </div>
            <Package className="w-5 h-5 mt-1 text-muted-foreground" />
          </div>
          <Link href="/account/orders" className="text-[10px] uppercase tracking-widest text-teal font-bold hover:underline">
            View All Orders →
          </Link>
        </div>

        {/* Wishlist */}
        <div className="border border-sage/20 bg-white rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-charcoal/60">Saved Items</p>
              <p className="text-3xl font-heading font-bold text-charcoal mt-1">{wishlistCount}</p>
            </div>
            <Heart className="w-5 h-5 mt-1 text-muted-foreground" />
          </div>
          <Link href="/account/wishlist" className="text-[10px] uppercase tracking-widest text-teal font-bold hover:underline">
            Go to Wishlist →
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4 border-b border-sage/20 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-charcoal">Recent Orders</h2>
          <Link href="/account/orders" className="text-xs text-muted-foreground hover:text-teal underline underline-offset-4 font-medium">
            All Orders
          </Link>
        </div>

        {orders.length > 0 ? (
          <div className="bg-white border border-sage/20 rounded-xl overflow-hidden divide-y divide-sage/10">
            {orders.map(order => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-sage/5 transition-colors group"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center text-teal font-bold text-xs font-mono flex-shrink-0">
                    #{order.id.slice(0, 4).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight group-hover:text-teal transition-colors">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <p className="font-bold text-sm">₹{Number(order.total || 0).toLocaleString('en-IN')}</p>
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
          <div className="bg-white border-2 border-dashed border-sage/30 rounded-xl p-12 text-center">
            <Package className="w-10 h-10 mx-auto text-sage/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-4">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/collections/all"
              className="inline-block bg-[#1a3a34] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#16312b] transition-colors"
            >
              Start Your Collection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
