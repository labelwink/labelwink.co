'use client';

import { useState, useEffect } from 'react';
import { User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res = await fetch('/api/storefront/profile');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Prefer first_name/last_name from DB if they exist, otherwise split full_name
      setProfile({
        ...data,
        first_name: data.first_name || (data.full_name || '').split(' ')[0] || '',
        last_name: data.last_name || (data.full_name || '').split(' ').slice(1).join(' ') || '',
      });
    } catch {
      toast.error('Failed to load profile');
    }
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/storefront/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
        })
      });
      if (!res.ok) throw new Error('Update failed');
      
      const updated = await res.json();
      setProfile({
        ...updated,
        first_name: updated.first_name || (updated.full_name || '').split(' ')[0] || '',
        last_name: updated.last_name || (updated.full_name || '').split(' ').slice(1).join(' ') || '',
      });
      toast.success('✅ Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  if (loading) return <div className="h-[40vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#c9a84c]" /></div>;

  // Avatar initial
  const initial = (profile?.first_name?.[0] || profile?.email?.[0] || '?').toUpperCase();

  return (
    <div className="space-y-6 animate-in fade-in">
      <h1 className="text-2xl font-heading font-bold text-charcoal border-b border-sage/20 pb-4">My Profile</h1>

      {/* Avatar header */}
      <div className="flex items-center gap-4 pb-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#8a7233] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {initial}
        </div>
        <div>
          <p className="font-bold text-charcoal text-lg">{profile?.first_name} {profile?.last_name}</p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-8">
        {/* Personal Info */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">First Name *</label>
              <input
                required
                type="text"
                value={profile?.first_name || ''}
                onChange={e => setProfile({...profile, first_name: e.target.value})}
                className="w-full border border-sage/30 rounded-lg text-sm px-3 py-2.5 text-gray-900 bg-white outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Last Name</label>
              <input
                type="text"
                value={profile?.last_name || ''}
                onChange={e => setProfile({...profile, last_name: e.target.value})}
                className="w-full border border-sage/30 rounded-lg text-sm px-3 py-2.5 text-gray-900 bg-white outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Email</label>
              <input
                readOnly
                type="email"
                value={profile?.email || ''}
                className="w-full border border-sage/30 bg-sage/5 rounded-lg text-sm px-3 py-2.5 cursor-not-allowed text-gray-900"
              />
              <p className="text-[10px] mt-1 text-muted-foreground italic">Contact support to change</p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Phone</label>
              <input
                type="tel"
                value={profile?.phone || ''}
                onChange={e => setProfile({...profile, phone: e.target.value})}
                placeholder="Your contact number"
                className="w-full border border-sage/30 rounded-lg text-sm px-3 py-2.5 text-gray-900 bg-white outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Wink Points display */}
        {profile?.wink_points !== undefined && (
          <div className="border border-[#c9a84c]/30 rounded-xl p-5 bg-[#c9a84c]/5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#c9a84c] mb-1">Wink Points Balance</p>
            <p className="text-3xl font-black text-charcoal">{profile.wink_points || 0} pts</p>
            <p className="text-xs text-muted-foreground mt-1">Earn points on every purchase and redeem at checkout</p>
          </div>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="bg-[#1C3829] text-white px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#24472F] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
