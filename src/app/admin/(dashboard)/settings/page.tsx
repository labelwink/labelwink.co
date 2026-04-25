'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('site_settings').select('*');
      if (data) {
        const settingsMap = data.reduce((acc: any, s: any) => ({
          ...acc,
          [s.key]: s.value
        }), {});
        setSettings(settingsMap);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async (key: string, value: any) => {
    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    
    if (error) {
      toast.error(`Failed to save ${key}`);
    } else {
      toast.success(`Saved ${key.replace(/_/g, ' ')}`);
      setSettings((prev: any) => ({ ...prev, [key]: value }));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-charcoal">Store Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your store's general settings, shipping, and payments.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Branding Settings */}
        <section className="bg-white border border-sage/20 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-sage/10 bg-sage/5">
            <h2 className="font-semibold text-charcoal flex items-center gap-2">
              Branding
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Store Name</label>
                <div className="flex gap-2">
                  <Input 
                    value={settings.store_name?.text || 'Label Wink'}
                    onChange={(e) => setSettings({ ...settings, store_name: { text: e.target.value } })}
                  />
                  <Button onClick={() => handleSave('store_name', settings.store_name)}>Save</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Logo URL</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://..."
                    value={settings.logo_url?.url || ''}
                    onChange={(e) => setSettings({ ...settings, logo_url: { url: e.target.value } })}
                  />
                  <Button onClick={() => handleSave('logo_url', settings.logo_url)}>Save</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Settings */}
        <section className="bg-white border border-sage/20 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-sage/10 bg-sage/5">
            <h2 className="font-semibold text-charcoal flex items-center gap-2">
              SEO & Metadata
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Default Meta Title</label>
              <div className="flex gap-2">
                <Input 
                  value={settings.seo_title?.text || ''}
                  onChange={(e) => setSettings({ ...settings, seo_title: { text: e.target.value } })}
                />
                <Button onClick={() => handleSave('seo_title', settings.seo_title)}>Save</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Default Meta Description</label>
              <div className="flex gap-2">
                <Textarea 
                  value={settings.seo_description?.text || ''}
                  onChange={(e) => setSettings({ ...settings, seo_description: { text: e.target.value } })}
                />
                <Button onClick={() => handleSave('seo_description', settings.seo_description)}>Save</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Social Media Settings */}
        <section className="bg-white border border-sage/20 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-sage/10 bg-sage/5">
            <h2 className="font-semibold text-charcoal flex items-center gap-2">
              Social Media
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Instagram URL</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://instagram.com/..."
                    value={settings.social_instagram?.url || ''}
                    onChange={(e) => setSettings({ ...settings, social_instagram: { url: e.target.value } })}
                  />
                  <Button onClick={() => handleSave('social_instagram', settings.social_instagram)}>Save</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Facebook URL</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://facebook.com/..."
                    value={settings.social_facebook?.url || ''}
                    onChange={(e) => setSettings({ ...settings, social_facebook: { url: e.target.value } })}
                  />
                  <Button onClick={() => handleSave('social_facebook', settings.social_facebook)}>Save</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shipping Settings */}
        <section className="bg-white border border-sage/20 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-sage/10 bg-sage/5">
            <h2 className="font-semibold text-charcoal flex items-center gap-2">
              Shipping & Logistics
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Free Shipping Threshold (₹)</label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={settings.free_shipping_threshold?.amount || 999}
                    onChange={(e) => setSettings({ ...settings, free_shipping_threshold: { amount: Number(e.target.value) } })}
                  />
                  <Button onClick={() => handleSave('free_shipping_threshold', settings.free_shipping_threshold)}>Save</Button>
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Info size={10} /> Customers get free shipping above this amount.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Settings */}
        <section className="bg-white border border-sage/20 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-sage/10 bg-sage/5">
            <h2 className="font-semibold text-charcoal flex items-center gap-2">
              Communication
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60">WhatsApp Number</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="10-digit number"
                    value={settings.whatsapp_number?.number || ''}
                    onChange={(e) => setSettings({ ...settings, whatsapp_number: { number: e.target.value } })}
                  />
                  <Button onClick={() => handleSave('whatsapp_number', settings.whatsapp_number)}>Save</Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Used for the floating chat button and notifications.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Support Email</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="support@labelwink.in"
                    value={settings.store_email?.email || ''}
                    onChange={(e) => setSettings({ ...settings, store_email: { email: e.target.value } })}
                  />
                  <Button onClick={() => handleSave('store_email', settings.store_email)}>Save</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Settings */}
        <section className="bg-white border border-sage/20 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-sage/10 bg-sage/5">
            <h2 className="font-semibold text-charcoal flex items-center gap-2">
              Payments
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-sage/5 rounded-lg border border-sage/10">
              <div>
                <p className="text-sm font-semibold text-charcoal">Cash on Delivery (COD)</p>
                <p className="text-xs text-muted-foreground">Allow customers to pay when order is delivered.</p>
              </div>
              <button 
                onClick={() => handleSave('cod_enabled', { enabled: !settings.cod_enabled?.enabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.cod_enabled?.enabled ? 'bg-teal' : 'bg-sage/40'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.cod_enabled?.enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-sage/5 rounded-lg border border-sage/10">
              <div>
                <p className="text-sm font-semibold text-charcoal">Razorpay Live Mode</p>
                <p className="text-xs text-muted-foreground">Toggle between test and production keys.</p>
              </div>
              <button 
                onClick={() => handleSave('razorpay_live_mode', { enabled: !settings.razorpay_live_mode?.enabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.razorpay_live_mode?.enabled ? 'bg-orange-500' : 'bg-sage/40'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.razorpay_live_mode?.enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

