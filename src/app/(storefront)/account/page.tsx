'use client';

// Run in Supabase: CREATE TABLE profiles (id uuid PRIMARY KEY REFERENCES auth.users, full_name text, phone text, role text DEFAULT 'customer', created_at timestamptz DEFAULT now());

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Package, Heart, Star, ChevronRight, Loader2, User, LogOut, MapPin } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AccountDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name: string; phone: string } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchAccountData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();
      if (profileData) {
        setProfile(profileData);
        setEditName(profileData.full_name || '');
        setEditPhone(profileData.phone || '');
      } else {
        setEditName(user.user_metadata?.full_name || '');
      }

      // Fetch Recent Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(3);

      if (ordersData) setOrders(ordersData);
      setLoading(false);
    }

    fetchAccountData();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').upsert({ id: user.id, full_name: editName, phone: editPhone });
    setProfile({ full_name: editName, phone: editPhone });
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

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Shopper';
  const initials = (displayName as string).charAt(0).toUpperCase();
  const winkPoints = orders.reduce((acc, o) => acc + (o.status === 'delivered' ? Math.floor(Number(o.total_amount)) : 0), 0);

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
                  <label className="text-[10px] uppercase tracking-widest text-charcoal/50 font-bold">Full Name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="mt-1 w-full border border-sage/30 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-charcoal/50 font-bold">Phone</label>
                  <input
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="mt-1 w-full border border-sage/30 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#1a3a34] text-white text-xs px-4 py-2 rounded hover:bg-[#2d5a52] transition-colors disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-xs px-4 py-2 rounded border border-sage/30 hover:bg-sage/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-semibold text-charcoal">{displayName}</h1>
                <p className="text-sm text-charcoal/60 mt-0.5">{user?.email}</p>
                {profile?.phone && (
                  <p className="text-sm text-charcoal/60 mt-0.5">{profile.phone}</p>
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

        {/* Tab links */}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-sage/20 shadow-sm bg-teal/5 rounded-none border-l-4 border-l-teal">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Wink Points</CardTitle>
            <Star className="w-4 h-4 text-teal fill-teal/20" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-teal">{winkPoints.toLocaleString()}</div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">Earned from delivered orders</p>
          </CardContent>
        </Card>

        <Card className="border-sage/20 shadow-sm rounded-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Total Orders</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold">{orders.length}</div>
            <Link href="/account/orders" className="text-[10px] uppercase tracking-widest text-teal font-bold hover:underline mt-1 inline-block">
              View History
            </Link>
          </CardContent>
        </Card>

        <Card className="border-sage/20 shadow-sm rounded-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Saved Items</CardTitle>
            <Heart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold">0</div>
            <Link href="/account/wishlist" className="text-[10px] uppercase tracking-widest text-teal font-bold hover:underline mt-1 inline-block">
              Go to Wishlist
            </Link>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex justify-between items-center mb-6 border-b border-sage/20 pb-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-charcoal">Recent Activity</h2>
          <Link href="/account/orders" className="text-xs text-muted-foreground hover:text-teal underline underline-offset-4 font-medium uppercase tracking-wider">
            All Orders
          </Link>
        </div>

        {orders.length > 0 ? (
          <div className="bg-white border border-sage/20 rounded-none shadow-sm divide-y divide-sage/10 overflow-hidden">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-sage/5 transition-colors group"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-sage/10 flex items-center justify-center text-teal font-bold text-xs uppercase rounded-full">
                    #{order.id.slice(0, 4)}
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight group-hover:text-teal transition-colors">Order {order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                      Placed on {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 self-end sm:self-auto">
                  <div className="text-right">
                    <p className="font-bold text-sm">₹{Number(order.total_amount).toLocaleString()}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-tighter font-bold ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-sage/40 rounded-none p-12 text-center">
            <Package className="w-10 h-10 mx-auto text-sage/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">You haven't placed any orders yet.</p>
            <Link
              href="/collections/all"
              className={buttonVariants({ className: "bg-teal text-cream rounded-none uppercase tracking-widest text-xs font-bold h-12 px-8" })}
            >
              Start Your Collection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
