'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, MapPin, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    label: 'Home',
    full_name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    is_default: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .order('is_default', { ascending: false });
      if (data) setAddresses(data);
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      if (formData.is_default) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('addresses')
        .insert({ ...formData, user_id: user.id });

      if (!error) {
        setShowAddForm(false);
        setFormData({ label: 'Home', full_name: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '', is_default: false });
        fetchAddresses();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this address?')) return;
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (!error) fetchAddresses();
  }

  async function setAsDefault(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      fetchAddresses();
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center border-b border-sage/20 pb-4">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-charcoal uppercase tracking-widest">My Addresses</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your saved shipping locations.</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className={`${showAddForm ? 'bg-destructive' : 'bg-charcoal'} hover:opacity-90 text-white gap-2 h-12 px-6 rounded-none uppercase tracking-widest text-xs font-bold transition-all`}
        >
          {showAddForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add New</>}
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white border border-teal/20 p-8 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-heading font-semibold text-charcoal">New Shipping Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <select id="label" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})}
                className="w-full h-12 border border-sage/30 bg-white rounded-none px-3 text-sm focus:outline-none focus:border-teal">
                <option>Home</option><option>Work</option><option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required className="h-12 border-sage/30 rounded-none focus:border-teal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="h-12 border-sage/30 rounded-none focus:border-teal" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="line1">Address Line 1 (Flat, Street, Area)</Label>
              <Input id="line1" value={formData.line1} onChange={e => setFormData({...formData, line1: e.target.value})} required className="h-12 border-sage/30 rounded-none focus:border-teal" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="line2">Address Line 2 (Landmark, Optional)</Label>
              <Input id="line2" value={formData.line2} onChange={e => setFormData({...formData, line2: e.target.value})} className="h-12 border-sage/30 rounded-none focus:border-teal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required className="h-12 border-sage/30 rounded-none focus:border-teal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required className="h-12 border-sage/30 rounded-none focus:border-teal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} required className="h-12 border-sage/30 rounded-none focus:border-teal" />
            </div>
            <div className="flex items-center gap-2 pt-8">
               <input 
                type="checkbox" 
                id="is_default" 
                checked={formData.is_default} 
                onChange={e => setFormData({...formData, is_default: e.target.checked})}
                className="w-4 h-4 text-teal border-sage/30 rounded-none focus:ring-teal"
               />
               <Label htmlFor="is_default" className="text-sm font-medium cursor-pointer">Set as default address</Label>
            </div>
          </div>
          <Button type="submit" disabled={saving} className="w-full h-14 bg-teal text-cream rounded-none uppercase tracking-widest font-bold shadow-lg">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Address'}
          </Button>
        </form>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.length > 0 ? addresses.map((addr) => (
          <div key={addr.id} className={`border-2 p-6 bg-white relative group transition-all ${addr.is_default ? 'border-teal shadow-md' : 'border-sage/20 hover:border-sage/40'}`}>
            {addr.is_default && (
              <span className="absolute top-0 right-0 bg-teal text-white text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 flex items-center gap-1">
                <Check className="w-3 h-3" /> Default
              </span>
            )}
            
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-charcoal uppercase tracking-wider">{addr.full_name || addr.name}</h3>
              {addr.label && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-teal/80 bg-teal/10 px-2 py-0.5 rounded">{addr.label}</span>
              )}
            </div>
            <div className="text-sm text-charcoal/70 space-y-1 font-medium leading-relaxed">
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>{addr.city}, {addr.state} {addr.pincode}</p>
              <p className="pt-3 text-charcoal font-bold flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Phone:</span> {addr.phone}
              </p>
            </div>
            
            <div className="flex gap-6 mt-8 pt-4 border-t border-sage/10">
              <button onClick={() => handleDelete(addr.id)} className="text-[10px] font-bold text-destructive uppercase tracking-widest flex items-center gap-1.5 hover:underline underline-offset-4">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              {!addr.is_default && (
                <button onClick={() => setAsDefault(addr.id)} className="text-[10px] font-bold text-teal uppercase tracking-widest flex items-center gap-1.5 hover:underline underline-offset-4">
                  Set as Default
                </button>
              )}
            </div>
          </div>
        )) : !showAddForm && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-sage/30 rounded-none bg-sage/5">
            <MapPin className="w-12 h-12 mx-auto text-sage/40 mb-4" />
            <p className="text-muted-foreground uppercase tracking-widest font-bold text-xs">No saved addresses yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
