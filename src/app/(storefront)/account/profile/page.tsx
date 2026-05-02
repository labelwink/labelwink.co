'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, MapPin, Ruler, Coins, Loader2, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<{ balance: number, history: any[] }>({ balance: 0, history: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [profRes, addrRes, { data: { user } }] = await Promise.all([
        fetch('/api/storefront/profile').then(res => res.json()),
        fetch('/api/storefront/addresses').then(res => res.json()),
        supabase.auth.getUser()
      ]);

      if (profRes.error) throw new Error(profRes.error);
      setProfile(profRes);
      setAddresses(addrRes || []);

      if (user) {
        const [loyaltyData, historyData] = await Promise.all([
          supabase.from('loyalty_points').select('balance').eq('user_id', user.id).maybeSingle(),
          supabase.from('loyalty_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);
        setLoyalty({
          balance: loyaltyData.data?.balance || 0,
          history: historyData.data || []
        });
      }
    } catch (e: any) {
      toast.error('Failed to load profile data');
    }
    setLoading(false);
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/storefront/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Profile updated successfully!');
    } catch (e) {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  const handleAddAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData);
    payload.is_default = formData.get('is_default') === 'on' ? 'true' : 'false';

    try {
      const res = await fetch('/api/storefront/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Address added');
      fetchData();
      (e.target as HTMLFormElement).reset();
    } catch {
      toast.error('Failed to add address');
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await fetch(`/api/storefront/addresses/${id}`, { method: 'DELETE' });
      setAddresses(addresses.filter(a => a.id !== id));
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      await fetch(`/api/storefront/addresses/${id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }) 
      });
      fetchData();
      toast.success('Default address updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  if (loading) return <div className="h-[40vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <h1 className="text-2xl font-heading font-bold text-charcoal border-b border-sage/20 pb-4">My Profile</h1>

      <div className="flex gap-2 border-b border-sage/20 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'personal', label: 'Personal Info', icon: User },
          { id: 'addresses', label: 'Addresses', icon: MapPin },
          { id: 'size', label: 'Size Profile', icon: Ruler },
          { id: 'loyalty', label: 'Loyalty Points', icon: Coins }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-[#c9a84c] text-charcoal' : 'border-transparent text-muted-foreground hover:text-charcoal'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === 'personal' && (
          <form onSubmit={handleProfileSave} className="max-w-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">First Name</label>
                <input required type="text" value={profile?.first_name || ''} onChange={e => setProfile({...profile, first_name: e.target.value})} className="w-full border-sage/30 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Last Name</label>
                <input required type="text" value={profile?.last_name || ''} onChange={e => setProfile({...profile, last_name: e.target.value})} className="w-full border-sage/30 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Email (Readonly)</label>
                <input readOnly type="email" value={profile?.email || ''} className="w-full border-sage/30 bg-sage/5 rounded-lg text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Primary Phone</label>
                <input readOnly type="tel" value={profile?.phone || ''} className="w-full border-sage/30 bg-sage/5 rounded-lg text-sm cursor-not-allowed" />
                <p className="text-[10px] mt-1 text-muted-foreground">Verified via OTP</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Alt Phone</label>
                <input type="tel" value={profile?.alt_phone || ''} onChange={e => setProfile({...profile, alt_phone: e.target.value})} className="w-full border-sage/30 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Date of Birth</label>
                <input type="date" value={profile?.date_of_birth || ''} onChange={e => setProfile({...profile, date_of_birth: e.target.value})} className="w-full border-sage/30 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Gender</label>
                <select value={profile?.gender || ''} onChange={e => setProfile({...profile, gender: e.target.value})} className="w-full border-sage/30 rounded-lg text-sm">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <button disabled={saving} className="bg-[#1a1a1a] text-white px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'addresses' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div key={addr.id} className={`border p-5 rounded-xl ${addr.is_default ? 'border-[#c9a84c] bg-yellow-50/30' : 'border-sage/20 bg-white'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{addr.label}</h3>
                      {addr.is_default && <span className="bg-[#c9a84c] text-white text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold">Default</span>}
                    </div>
                    <div className="flex gap-2">
                      {!addr.is_default && (
                        <button onClick={() => setDefaultAddress(addr.id)} className="text-xs text-teal hover:underline font-bold" title="Set Default">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => deleteAddress(addr.id)} className="text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="font-medium text-sm mt-3">{addr.first_name} {addr.last_name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {addr.line1}<br/>
                    {addr.line2 && <>{addr.line2}<br/></>}
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">📞 {addr.phone}</p>
                </div>
              ))}
            </div>

            <div className="bg-sage/5 border border-sage/20 rounded-xl p-6 max-w-2xl">
              <h3 className="font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/> Add New Address</h3>
              <form onSubmit={handleAddAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required name="label" placeholder="Label (e.g. Home, Work)" className="w-full border-sage/30 rounded-lg text-sm sm:col-span-2" />
                <input required name="first_name" placeholder="First Name" className="w-full border-sage/30 rounded-lg text-sm" />
                <input required name="last_name" placeholder="Last Name" className="w-full border-sage/30 rounded-lg text-sm" />
                <input required name="phone" placeholder="Phone Number" className="w-full border-sage/30 rounded-lg text-sm" />
                <input name="alt_phone" placeholder="Alternate Phone (optional)" className="w-full border-sage/30 rounded-lg text-sm" />
                <input required name="line1" placeholder="Address Line 1" className="w-full border-sage/30 rounded-lg text-sm sm:col-span-2" />
                <input name="line2" placeholder="Address Line 2 (optional)" className="w-full border-sage/30 rounded-lg text-sm sm:col-span-2" />
                <input required name="city" placeholder="City" className="w-full border-sage/30 rounded-lg text-sm" />
                <input required name="state" placeholder="State" className="w-full border-sage/30 rounded-lg text-sm" />
                <input required name="pincode" placeholder="Pincode" className="w-full border-sage/30 rounded-lg text-sm" />
                <label className="flex items-center gap-2 sm:col-span-2 text-sm font-medium mt-2">
                  <input type="checkbox" name="is_default" className="rounded text-teal focus:ring-teal" />
                  Set as default address
                </label>
                <button type="submit" className="sm:col-span-2 bg-[#c9a84c] text-white py-3 rounded-lg font-bold uppercase tracking-widest mt-2 hover:bg-[#b5953e] transition-colors">Save Address</button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'size' && (
          <form onSubmit={handleProfileSave} className="max-w-xl space-y-6">
            <p className="text-sm text-muted-foreground bg-sage/10 p-4 rounded-xl border border-sage/20">
              📏 Your measurements help us recommend the right size for a perfect fit!
            </p>
            <div className="grid grid-cols-2 gap-6">
              {[
                { id: 'chest', label: 'Chest (cm)' },
                { id: 'waist', label: 'Waist (cm)' },
                { id: 'hips', label: 'Hips (cm)' },
                { id: 'height', label: 'Height (cm)' },
                { id: 'weight', label: 'Weight (kg)' }
              ].map(field => (
                <div key={field.id}>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">{field.label}</label>
                  <input type="number" step="0.1" value={profile?.[field.id] || ''} onChange={e => setProfile({...profile, [field.id]: e.target.value})} className="w-full border-sage/30 rounded-lg text-sm" />
                </div>
              ))}
            </div>
            <button disabled={saving} className="bg-[#1a1a1a] text-white px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Measurements'}
            </button>
          </form>
        )}

        {activeTab === 'loyalty' && (
          <div className="space-y-8 max-w-3xl">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl p-8 text-center border border-[#c9a84c]/20 shadow-lg">
              <p className="text-[#c9a84c] text-xs font-bold uppercase tracking-[0.3em] mb-4">Current Balance</p>
              <h2 className="text-6xl font-heading font-bold text-white mb-2">{loyalty.balance} <span className="text-2xl text-white/50">pts</span></h2>
              <p className="text-white/70 text-sm">Equivalent to ₹{Math.floor(loyalty.balance / 100)}</p>
              <div className="mt-8 pt-6 border-t border-white/10 flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-white font-bold text-sm">Earn</p>
                  <p className="text-white/60 text-xs mt-1">1 point for every ₹10 spent</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-sm">Redeem</p>
                  <p className="text-white/60 text-xs mt-1">100 points = ₹1 off</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold uppercase tracking-widest text-sm mb-4">Transaction History</h3>
              {loyalty.history.length > 0 ? (
                <div className="bg-white border border-sage/20 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-sage/5 border-b border-sage/10 text-xs uppercase tracking-widest text-muted-foreground">
                      <tr>
                        <th className="p-4 font-bold">Date</th>
                        <th className="p-4 font-bold">Type</th>
                        <th className="p-4 font-bold">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/10">
                      {loyalty.history.map(tx => (
                        <tr key={tx.id}>
                          <td className="p-4">{new Date(tx.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                              tx.type === 'earn' ? 'bg-green-100 text-green-700' :
                              tx.type === 'redeem' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>{tx.type}</span>
                            {tx.order_id && <span className="text-xs text-muted-foreground ml-2">(Order #{tx.order_id.slice(0,8).toUpperCase()})</span>}
                          </td>
                          <td className={`p-4 font-bold ${tx.points > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {tx.points > 0 ? '+' : ''}{tx.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-sage/5 border border-sage/20 rounded-xl p-8 text-center">
                  <Coins className="w-12 h-12 text-[#c9a84c]/50 mx-auto mb-3" />
                  <p className="font-bold text-charcoal">No points history yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start shopping to earn points!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
