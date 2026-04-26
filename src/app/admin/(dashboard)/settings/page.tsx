'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/admin/Toast'
import { Loader2 } from 'lucide-react'

// ─── helpers ──────────────────────────────────────────────────────────────────

const TABS = ['Store Info', 'Trust Badges', 'Social Links', 'Shipping'] as const
type Tab = typeof TABS[number]

async function saveSetting(key: string, value: unknown) {
  return fetch('/api/admin/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  })
}

function Field({ label, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#1a1a1a] mb-1">{label}</label>
      <input id={id} {...props}
        className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
    </div>
  )
}

function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 px-6 py-2.5 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#234d44] disabled:opacity-60 mt-2">
      {saving && <Loader2 size={16} className="animate-spin" />}
      Save Changes
    </button>
  )
}

// ─── default values ───────────────────────────────────────────────────────────

const DEFAULT_TRUST = [
  { icon: '🚚', title: 'Free Shipping', subtitle: 'Orders above ₹3499' },
  { icon: '🔄', title: 'Easy Returns', subtitle: '7-day return' },
  { icon: '🔒', title: 'Secure Payment', subtitle: 'Razorpay secured' },
  { icon: '✨', title: 'Authentic Products', subtitle: '100% original' },
]

const DEFAULT_STORE = { name: '', tagline: '', email: '', phone: '', address: '', gst: '', logo_url: '' }
const DEFAULT_SOCIAL = { instagram: '', facebook: '', whatsapp: '', youtube: '' }
const DEFAULT_SHIPPING = { free_threshold: 3499, cod_available: true, cod_charge: 0 }

// ─── tab components ───────────────────────────────────────────────────────────

function StoreInfoTab({ init }: { init: Record<string, string> }) {
  const [form, setForm] = useState({ ...DEFAULT_STORE, ...init })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { showToast, ToastComponent } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const uploadLogo = async (file: File) => {
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.url) setForm(f => ({ ...f, logo_url: json.url }))
      else showToast('Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    const res = await saveSetting('store_info', form)
    showToast(res.ok ? 'Saved ✓' : 'Save failed', res.ok ? 'success' : 'error')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {ToastComponent}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Store Name" id="store-name" value={form.name} onChange={set('name')} />
        <Field label="Tagline" id="store-tagline" value={form.tagline} onChange={set('tagline')} />
        <Field label="Contact Email" id="store-email" type="email" value={form.email} onChange={set('email')} />
        <Field label="Phone" id="store-phone" type="tel" value={form.phone} onChange={set('phone')} />
        <Field label="GST Number" id="store-gst" value={form.gst} onChange={set('gst')} />
      </div>
      <div>
        <label htmlFor="store-address" className="block text-sm font-medium text-[#1a1a1a] mb-1">Address</label>
        <input id="store-address" value={form.address} onChange={set('address')}
          className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
      </div>
      {/* Logo upload */}
      <div>
        <p className="text-sm font-medium text-[#1a1a1a] mb-2">Logo</p>
        <div className="flex items-center gap-4">
          {form.logo_url && <img src={form.logo_url} alt="logo" className="h-12 object-contain border rounded-lg p-1" />}
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-4 py-2 border border-[#e5e7eb] rounded-xl text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60">
            {uploading && <Loader2 size={14} className="animate-spin" />}
            {uploading ? 'Uploading…' : 'Upload Logo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
        </div>
      </div>
      <SaveBtn saving={saving} onClick={save} />
    </div>
  )
}

function TrustBadgesTab({ init }: { init: typeof DEFAULT_TRUST }) {
  const [badges, setBadges] = useState<typeof DEFAULT_TRUST>(init?.length ? init : DEFAULT_TRUST)
  const [saving, setSaving] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const set = (i: number, k: string, v: string) =>
    setBadges(bs => bs.map((b, idx) => idx === i ? { ...b, [k]: v } : b))

  const save = async () => {
    setSaving(true)
    const res = await saveSetting('trust_badges', badges)
    showToast(res.ok ? 'Saved ✓' : 'Save failed', res.ok ? 'success' : 'error')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {ToastComponent}
      <p className="text-sm text-[#6b7280]">Edit the 4 trust badge cards shown across the storefront.</p>
      {badges.map((b, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-[#e5e7eb]">
          <input value={b.icon} onChange={e => set(i, 'icon', e.target.value)}
            className="w-12 text-center border border-[#e5e7eb] rounded-lg px-2 py-2 text-lg" placeholder="🚚" />
          <div className="flex-1 grid grid-cols-2 gap-2">
            <input value={b.title} onChange={e => set(i, 'title', e.target.value)} placeholder="Title"
              className="border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-sm" />
            <input value={b.subtitle} onChange={e => set(i, 'subtitle', e.target.value)} placeholder="Subtitle"
              className="border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-sm text-[#6b7280]" />
          </div>
        </div>
      ))}
      <SaveBtn saving={saving} onClick={save} />
    </div>
  )
}

function SocialLinksTab({ init }: { init: typeof DEFAULT_SOCIAL }) {
  const [form, setForm] = useState({ ...DEFAULT_SOCIAL, ...init })
  const [saving, setSaving] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    const res = await saveSetting('social_links', form)
    showToast(res.ok ? 'Saved ✓' : 'Save failed', res.ok ? 'success' : 'error')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {ToastComponent}
      <Field label="Instagram URL" id="social-instagram" type="url" value={form.instagram} onChange={set('instagram')} placeholder="https://instagram.com/..." />
      <Field label="Facebook URL" id="social-facebook" type="url" value={form.facebook} onChange={set('facebook')} placeholder="https://facebook.com/..." />
      <Field label="WhatsApp Number" id="social-whatsapp" type="tel" value={form.whatsapp} onChange={set('whatsapp')} placeholder="+91 98765 43210" />
      <Field label="YouTube URL" id="social-youtube" type="url" value={form.youtube} onChange={set('youtube')} placeholder="https://youtube.com/..." />
      <SaveBtn saving={saving} onClick={save} />
    </div>
  )
}

function ShippingTab({ init }: { init: typeof DEFAULT_SHIPPING }) {
  const [form, setForm] = useState({ ...DEFAULT_SHIPPING, ...init })
  const [saving, setSaving] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const save = async () => {
    setSaving(true)
    const res = await saveSetting('shipping_config', form)
    showToast(res.ok ? 'Saved ✓' : 'Save failed', res.ok ? 'success' : 'error')
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      {ToastComponent}
      <div>
        <label htmlFor="ship-threshold" className="block text-sm font-medium text-[#1a1a1a] mb-1">
          Free Shipping Threshold (₹)
        </label>
        <input id="ship-threshold" type="number" min={0} value={form.free_threshold}
          onChange={e => setForm(f => ({ ...f, free_threshold: Number(e.target.value) }))}
          className="w-48 border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
      </div>
      <label className="flex items-center gap-3">
        <button type="button" onClick={() => setForm(f => ({ ...f, cod_available: !f.cod_available }))}
          className={`relative w-12 h-6 rounded-full transition-colors ${form.cod_available ? 'bg-[#1b3a34]' : 'bg-gray-300'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.cod_available ? 'translate-x-6' : ''}`} />
        </button>
        <span className="text-sm font-medium">Cash on Delivery available</span>
      </label>
      {form.cod_available && (
        <div>
          <label htmlFor="cod-charge" className="block text-sm font-medium text-[#1a1a1a] mb-1">COD Charge (₹)</label>
          <input id="cod-charge" type="number" min={0} value={form.cod_charge}
            onChange={e => setForm(f => ({ ...f, cod_charge: Number(e.target.value) }))}
            className="w-48 border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
        </div>
      )}
      <SaveBtn saving={saving} onClick={save} />
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Store Info')
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => { setSettings(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-[#6b7280]">Loading…</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-[#1a1a1a]">Shop Settings</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === t ? 'bg-white shadow text-[#1b3a34]' : 'text-[#6b7280] hover:text-[#1a1a1a]'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
        {activeTab === 'Store Info' && <StoreInfoTab init={(settings.store_info as Record<string, string>) || {}} />}
        {activeTab === 'Trust Badges' && <TrustBadgesTab init={(settings.trust_badges as typeof DEFAULT_TRUST) || DEFAULT_TRUST} />}
        {activeTab === 'Social Links' && <SocialLinksTab init={(settings.social_links as typeof DEFAULT_SOCIAL) || DEFAULT_SOCIAL} />}
        {activeTab === 'Shipping' && <ShippingTab init={(settings.shipping_config as typeof DEFAULT_SHIPPING) || DEFAULT_SHIPPING} />}
      </div>
    </div>
  )
}
