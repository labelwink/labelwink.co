'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, UploadCloud } from 'lucide-react';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'gst', label: 'GST & Invoice' },
  { id: 'commerce', label: 'Commerce' },
  { id: 'loyalty', label: 'Loyalty' },
  { id: 'label', label: 'Dispatch Label' },
  { id: 'shiprocket', label: 'Shipping (Shiprocket)' },
  { id: 'emails', label: 'Email Templates' },
  { id: 'sms', label: 'SMS Notifications' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'payments', label: 'Payments' },
];

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal"
];


type EmailTemplate = {
  id: string;
  template_key: string;
  subject: string;
  preview_text?: string;
  body_html: string;
  is_active: boolean;
  updated_at: string;
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<any>(null);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [testPhone, setTestPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'sms') {
      fetch('/api/admin/settings/sms-logs')
        .then(async r => {
          const data = await r.json();
          if (r.ok) setSmsLogs(Array.isArray(data) ? data : []);
          else console.error('Failed to fetch SMS logs:', data.error);
        })
        .catch(err => console.error('SMS logs network error:', err));
    }
  }, [activeTab]);


  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsRes, templatesRes] = await Promise.all([
          fetch('/api/admin/settings'),
          fetch('/api/admin/email-templates')
        ]);

        const settingsData = await settingsRes.json();
        const templatesData = await templatesRes.json();

        if (!settingsRes.ok) throw new Error(settingsData.error || 'Failed to load settings');
        if (!templatesRes.ok) throw new Error(templatesData.error || 'Failed to load templates');

        setSettings(settingsData);
        setEmailTemplates(Array.isArray(templatesData) ? templatesData : []);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);


  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setSettings(updated);
      toast.success('Settings saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (endpoint: string, successMessage: string) => {
    try {
      const res = await fetch(`/api/admin/settings/${endpoint}`, { method: endpoint === 'test-telegram' ? 'POST' : 'GET' });
      const data = await res.json();
      if (res.ok) {
        toast.success(successMessage);
      } else {
        toast.error(data.error || 'Connection failed');
      }
    } catch (err: any) {
      toast.error('Network error');
    }
  };

  const uploadLogo = () => {
    if (typeof window !== 'undefined' && (window as any).cloudinary) {
      (window as any).cloudinary.openUploadWidget(
        { cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, uploadPreset: 'ml_default', multiple: false },
        (error: any, result: any) => {
          if (!error && result && result.event === "success") {
            setSettings({ ...settings, logo_url: result.info.secure_url });
          }
        }
      );
    } else {
      toast.error('Cloudinary widget not loaded');
    }
  };

  if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#c9a84c]" /></div>;

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>

      <div className="flex gap-4 border-b border-[#e8e2d6] overflow-x-auto no-scrollbar pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-[#c9a84c] text-[#c9a84c]' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#e8e2d6] p-6 text-gray-900">
        
        {activeTab === 'general' && (
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                {settings.logo_url ? <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">Logo</span>}
              </div>
              <button type="button" onClick={uploadLogo} className="flex items-center gap-2 bg-gray-50 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition">
                <UploadCloud className="w-4 h-4" /> Upload Logo
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">Store Name *</label>
                <input required value={settings.store_name || ''} onChange={e => setSettings({...settings, store_name: e.target.value})} className="admin-input" />
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">Store Tagline</label>
                <input value={settings.store_tagline || ''} onChange={e => setSettings({...settings, store_tagline: e.target.value})} className="admin-input" />
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">Store Email</label>
                <input type="email" value={settings.store_email || ''} onChange={e => setSettings({...settings, store_email: e.target.value})} className="admin-input" />
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">Store Phone</label>
                <input value={settings.store_phone || ''} onChange={e => setSettings({...settings, store_phone: e.target.value})} className="admin-input" />
              </div>
              <div className="col-span-2">
                <label className="block text-gray-600 text-sm font-medium mb-1">Full Store Address</label>
                <textarea rows={2} value={settings.store_address || ''} onChange={e => setSettings({...settings, store_address: e.target.value})} className="admin-input resize-none" />
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">City</label>
                <input value={settings.store_city || ''} onChange={e => setSettings({...settings, store_city: e.target.value})} className="admin-input" />
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">State</label>
                <select value={settings.store_state || ''} onChange={e => setSettings({...settings, store_state: e.target.value})} className="admin-input">
                  <option value="" disabled>Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">Pincode</label>
                <input value={settings.store_pincode || ''} onChange={e => setSettings({...settings, store_pincode: e.target.value})} className="admin-input" />
              </div>
            </div>
            <button disabled={saving} className="bg-[#c9a84c] text-[#ffffff] font-bold px-6 py-2 rounded-lg hover:bg-[#b5953e] transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'gst' && (
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">GST Number</label>
                <input value={settings.gst_number || ''} onChange={e => setSettings({...settings, gst_number: e.target.value})} className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3" />
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">HSN Code</label>
                <input value={settings.hsn_code || '6211'} onChange={e => setSettings({...settings, hsn_code: e.target.value})} className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3" placeholder="6211" />
              </div>
              <div className="col-span-2">
                <label className="block text-gray-600 text-sm font-medium mb-1">Invoice Footer Note</label>
                <textarea rows={4} placeholder="Goods once sold are not returnable if tampered..." value={settings.invoice_footer_note || ''} onChange={e => setSettings({...settings, invoice_footer_note: e.target.value})} className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 resize-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-gray-600 text-sm font-medium mb-1">Invoice Terms & Conditions</label>
                <textarea rows={4} value={settings.invoice_terms || ''} onChange={e => setSettings({...settings, invoice_terms: e.target.value})} className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 resize-none" />
                <p className="text-gray-400 text-xs mt-1">These appear on every printed invoice</p>
              </div>
            </div>
            <button disabled={saving} className="bg-[#c9a84c] text-[#ffffff] font-bold px-6 py-2 rounded-lg hover:bg-[#b5953e] transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'commerce' && (
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1">Standard Shipping Charge (₹)</label>
                  <input type="number" value={settings.standard_shipping_charge || 0} onChange={e => setSettings({...settings, standard_shipping_charge: Number(e.target.value)})} className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3" />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1">Express Shipping Charge (₹)</label>
                  <input type="number" value={settings.express_shipping_charge || 0} onChange={e => setSettings({...settings, express_shipping_charge: Number(e.target.value)})} className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3" />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">Return Window (Days)</label>
                <input type="number" value={settings.return_window_days || 7} onChange={e => setSettings({...settings, return_window_days: Number(e.target.value)})} className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3" />
                <p className="text-gray-400 text-xs mt-1">Number of days after delivery when returns are allowed.</p>
              </div>
            </div>
            <button disabled={saving} className="bg-[#c9a84c] text-[#ffffff] font-bold px-6 py-2 rounded-lg hover:bg-[#b5953e] transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'loyalty' && (
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div>
                <p className="font-semibold text-sm">Loyalty Points System</p>
                <p className="text-gray-500 text-xs mt-1">Customers earn points on every purchase</p>
              </div>
              <Switch checked={settings.loyalty_enabled} onCheckedChange={(v) => setSettings({...settings, loyalty_enabled: v})} />
            </div>
            {settings.loyalty_enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">Points earned per ₹1 spent</label>
                    <input type="number" step="0.1" value={settings.loyalty_points_per_rupee || 1} onChange={e => setSettings({...settings, loyalty_points_per_rupee: Number(e.target.value)})} className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3" />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">Points needed to get ₹1 off</label>
                    <input type="number" step="1" value={settings.loyalty_redemption_ratio || 100} onChange={e => setSettings({...settings, loyalty_redemption_ratio: Number(e.target.value)})} className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3" />
                  </div>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-lg text-emerald-300 text-sm">
                  <strong>Preview:</strong> Customer spending ₹1,000 will earn {1000 * (settings.loyalty_points_per_rupee || 1)} points = ₹{((1000 * (settings.loyalty_points_per_rupee || 1)) / (settings.loyalty_redemption_ratio || 100)).toFixed(2)} off their next order.
                </div>
              </>
            )}
            <button disabled={saving} className="bg-[#c9a84c] text-[#ffffff] font-bold px-6 py-2 rounded-lg hover:bg-[#b5953e] transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'label' && (
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Label Warning Text</label>
              <input value={settings.label_warning_text || 'Handle with care. Do not bend.'} onChange={e => setSettings({...settings, label_warning_text: e.target.value})} className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3" />
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 opacity-50 cursor-not-allowed">
              <p className="font-semibold text-sm">Show AWB number on label (coming soon)</p>
              <Switch disabled checked={true} />
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 opacity-50 cursor-not-allowed">
              <p className="font-semibold text-sm">Show items list on label (coming soon)</p>
              <Switch disabled checked={true} />
            </div>
            <button disabled={saving} className="bg-[#c9a84c] text-[#ffffff] font-bold px-6 py-2 rounded-lg hover:bg-[#b5953e] transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'shiprocket' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Shiprocket Email (from env)</label>
              <input readOnly value="s***@***.com" className="admin-input cursor-not-allowed opacity-70" />
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div>
                <p className="font-semibold text-sm">Shiprocket Mode</p>
                <p className={`text-xs mt-1 ${settings.shiprocket_mode === 'test' ? 'text-blue-400' : 'text-red-400 font-bold'}`}>
                  {settings.shiprocket_mode === 'test' 
                    ? "Orders will generate fake AWB numbers. No real shipments created." 
                    : "⚠️ Orders will create real shipments on Shiprocket."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-gray-600">Test</span>
                <Switch 
                  checked={settings.shiprocket_mode === 'live'} 
                  onCheckedChange={(v) => {
                    const newMode = v ? 'live' : 'test';
                    setSettings({...settings, shiprocket_mode: newMode});
                    fetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ shiprocket_mode: newMode }) });
                  }} 
                />
                <span className="text-xs font-bold uppercase text-gray-600">Live</span>
              </div>
            </div>
            <button onClick={() => handleTest('test-shiprocket', '✅ Connected to Shiprocket')} className="border border-gray-300 bg-white text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-50 transition">
              Test Shiprocket Connection
            </button>
          </div>
        )}

        {activeTab === 'emails' && (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-blue-300 text-sm mb-6">
              ℹ️ Email body design is managed in code. Only subject and active status can be edited here. Use "Send Test" to preview each template.
            </div>

            {(Array.isArray(emailTemplates) ? emailTemplates : []).map(template => (
              <div key={template.template_key} className="bg-gray-50 border border-gray-300 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#e8e2d6] pb-3">
                  <h3 className="font-bold text-[#c9a84c] text-lg capitalize">
                    {template.template_key.replace(/_/g, ' ')}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Active</span>
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(v) => {
                        const currentTemplates = Array.isArray(emailTemplates) ? emailTemplates : [];
                        const updated = currentTemplates.map(t => t.template_key === template.template_key ? { ...t, is_active: v } : t);
                        setEmailTemplates(updated);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1">Subject Line</label>
                  <input
                    value={template.subject}
                    onChange={(e) => {
                      const currentTemplates = Array.isArray(emailTemplates) ? emailTemplates : [];
                      const updated = currentTemplates.map(t => t.template_key === template.template_key ? { ...t, subject: e.target.value } : t);
                      setEmailTemplates(updated);
                    }}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2"
                  />
                  <p className="text-gray-400 text-xs mt-1">Variables available: {'{{invoice_number}}'}, {'{{store_name}}'}</p>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1">Preview Text (shown in inbox)</label>
                  <input
                    value={template.preview_text || ''}
                    onChange={(e) => {
                      const currentTemplates = Array.isArray(emailTemplates) ? emailTemplates : [];
                      const updated = currentTemplates.map(t => t.template_key === template.template_key ? { ...t, preview_text: e.target.value } : t);
                      setEmailTemplates(updated);
                    }}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={async () => {
                      const tToast = toast.loading('Saving template...');
                      try {
                        const res = await fetch('/api/admin/email-templates', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            template_key: template.template_key,
                            subject: template.subject,
                            preview_text: template.preview_text,
                            is_active: template.is_active
                          })
                        });
                        if (!res.ok) throw new Error('Failed to save');
                        toast.success('Template saved', { id: tToast });
                      } catch (err: any) {
                        toast.error(err.message, { id: tToast });
                      }
                    }}
                    className="bg-[#c9a84c] text-[#ffffff] font-bold px-4 py-2 rounded-lg hover:bg-[#b5953e] transition text-sm"
                  >
                    Save Template
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder="Enter test email address"
                      id={`test-email-${template.template_key}`}
                      className="bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm w-48"
                    />
                    <button
                      onClick={async () => {
                        const emailInput = document.getElementById(`test-email-${template.template_key}`) as HTMLInputElement;
                        if (!emailInput?.value) return toast.error('Enter an email address to test');
                        const tToast = toast.loading('Sending test email...');
                        try {
                          const res = await fetch('/api/admin/email-templates/test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ template_key: template.template_key, test_email: emailInput.value })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Failed to send test');
                          toast.success(data.message, { id: tToast });
                        } catch (err: any) {
                          toast.error(err.message, { id: tToast });
                        }
                      }}
                      className="border border-gray-300 bg-white text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Send Test
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sms' && (
          <div className="space-y-8 max-w-3xl">
            <div className="bg-gray-50 border border-gray-300 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#e8e2d6] pb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Enable SMS Notifications</h3>
                  <p className="text-sm text-gray-500 mt-1">Master toggle for all automated SMS messages to customers</p>
                </div>
                <Switch
                  checked={settings?.sms_enabled}
                  onCheckedChange={(v) => {
                    setSettings({...settings, sms_enabled: v})
                    fetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ sms_enabled: v }) })
                  }}
                />
              </div>

              <div className={`space-y-4 pt-2 ${!settings?.sms_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Order Placed</h4>
                    <p className="text-xs text-gray-500">Sent immediately after checkout confirmation</p>
                  </div>
                  <Switch checked={settings?.sms_order_placed} onCheckedChange={(v) => {
                    setSettings({...settings, sms_order_placed: v})
                    fetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ sms_order_placed: v }) })
                  }} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Order Dispatched</h4>
                    <p className="text-xs text-gray-500">Sent when AWB is generated and order status is 'dispatched'</p>
                  </div>
                  <Switch checked={settings?.sms_order_dispatched} onCheckedChange={(v) => {
                    setSettings({...settings, sms_order_dispatched: v})
                    fetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ sms_order_dispatched: v }) })
                  }} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Order Delivered</h4>
                    <p className="text-xs text-gray-500">Sent when order status changes to 'delivered'</p>
                  </div>
                  <Switch checked={settings?.sms_order_delivered} onCheckedChange={(v) => {
                    setSettings({...settings, sms_order_delivered: v})
                    fetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ sms_order_delivered: v }) })
                  }} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold border-b border-[#e8e2d6] pb-2">SMS Provider (MSG91)</h3>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">MSG91 Auth Key</label>
                <input type="password" value="********" readOnly className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 opacity-50 cursor-not-allowed" />
                <p className="text-gray-400 text-xs mt-1">Configured securely via environment variables.</p>
              </div>
              <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg text-amber-300 text-sm">
                <strong>DLT Registration Required:</strong> Ensure your message templates are DLT registered with TRAI before enabling. Ensure MSG91 flow IDs match .env.local configuration.
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Enter phone to test (e.g., 9876543210)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm w-64"
                />
                <button
                  onClick={async () => {
                    if (!testPhone) return toast.error('Enter a phone number');
                    const tToast = toast.loading('Sending test SMS...');
                    try {
                      const res = await fetch('/api/admin/settings/test-sms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: testPhone })
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Test failed');
                      toast.success(data.message, { id: tToast });
                      // refresh logs
                      fetch('/api/admin/settings/sms-logs').then(r => r.json()).then(data => setSmsLogs(data || []));
                    } catch (err: any) {
                      toast.error(err.message, { id: tToast });
                    }
                  }}
                  className="border border-gray-300 bg-white text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  Send Test SMS
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold border-b border-[#e8e2d6] pb-2 flex justify-between items-center">
                <span>Recent SMS Logs</span>
                <span className="text-xs font-normal text-gray-400">Last 20 messages</span>
              </h3>
              
              {smsLogs.length > 0 ? (
                <div className="bg-gray-50 border border-gray-300 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(Array.isArray(smsLogs) ? smsLogs : []).map((log: any) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-600">{new Date(log.created_at).toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short'})}</td>
                          <td className="px-4 py-3 font-mono">{log.phone ? log.phone.replace(/(\d{2})\d{4}(\d{4})/, '$1XXXX$2') : 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-600">{log.message_type}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              log.status === 'sent' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {log.status === 'sent' ? 'Sent' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      ))}

                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">No SMS logs found.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8 max-w-2xl">
            <div className="space-y-4">
              <h3 className="font-bold border-b border-[#e8e2d6] pb-2">Telegram</h3>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">Bot Token</label>
                <input type="password" value="********" readOnly className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 opacity-50 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">Chat ID</label>
                <input type="text" value="********" readOnly className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 opacity-50 cursor-not-allowed" />
              </div>
              <p className="text-gray-400 text-xs">Get these from @BotFather on Telegram. Store them in .env.local.</p>
              <button onClick={() => handleTest('test-telegram', '✅ Telegram message sent!')} className="border border-gray-300 bg-white text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-50 transition">
                Send Test Message
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#e8e2d6]">
              <h3 className="font-bold border-b border-[#e8e2d6] pb-2">Email (Brevo)</h3>
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1">API Key</label>
                <input type="password" value="********" readOnly className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 opacity-50 cursor-not-allowed" />
              </div>
              <p className="text-gray-400 text-xs">Free tier: 300 emails/day. Get API key from brevo.com. Store it in .env.local.</p>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-blue-300 text-sm">
              Note: These values are in environment variables. Update .env.local and redeploy to change these values.
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Razorpay Key ID</label>
              <input readOnly value="rzp_live_********" className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 cursor-not-allowed opacity-70 font-mono" />
              <p className="text-gray-400 text-xs mt-1">Payment credentials are stored as environment variables in Vercel.</p>
            </div>
            
            <button onClick={() => handleTest('test-razorpay', '✅ Razorpay connected')} className="border border-gray-300 bg-white text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-50 transition">
              Test Razorpay Connection
            </button>

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-blue-300 text-sm">
              ℹ️ To update payment keys, go to Vercel Dashboard → Settings → Environment Variables
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
