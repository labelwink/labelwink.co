'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/admin/Toast'
import { ChevronDown, ChevronUp } from 'lucide-react'

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
        <h2 className="font-semibold text-[#1a1a1a]">{title}</h2>
        {open ? <ChevronUp size={18} className="text-[#6b7280]" /> : <ChevronDown size={18} className="text-[#6b7280]" />}
      </button>
      {open && <div className="px-6 pb-6 space-y-4 border-t border-[#e5e7eb]">{children}</div>}
    </div>
  )
}

export default function HomePageEditor() {
  const [data, setData] = useState<any>(null)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    fetch('/api/admin/cms/home').then(r => r.json()).then(setData)
  }, [])

  const save = async (section: string, value: any) => {
    const updated = { ...data, [section]: value }
    setData(updated)
    const res = await fetch('/api/admin/cms/home', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
    showToast(res.ok ? 'Saved ✓' : 'Save failed', res.ok ? 'success' : 'error')
  }

  if (!data) return <div className="text-center py-20 text-[#6b7280]">Loading…</div>

  return (
    <div className="space-y-4">
      {ToastComponent}
      <div>
        <nav className="text-sm text-[#6b7280] mb-1">Admin › Pages › <span className="text-[#1a1a1a]">Homepage</span></nav>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Homepage Content Editor</h1>
      </div>

      {/* Announcement Bar */}
      <Section title="Announcement Bar" defaultOpen>
        <div className="pt-4 space-y-3">
          <label className="flex items-center gap-3">
            <button type="button" onClick={() => save('announcement_bar', { ...data.announcement_bar, enabled: !data.announcement_bar?.enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${data.announcement_bar?.enabled ? 'bg-[#1b3a34]' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.announcement_bar?.enabled ? 'translate-x-6' : ''}`} />
            </button>
            <span className="text-sm font-medium">Enabled</span>
          </label>
          <div>
            <label className="block text-sm font-medium mb-1">Text</label>
            <input value={data.announcement_bar?.text || ''} onChange={e => setData((d: any) => ({ ...d, announcement_bar: { ...d.announcement_bar, text: e.target.value } }))}
              className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Background Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={data.announcement_bar?.color || '#1b3a34'}
                onChange={e => setData((d: any) => ({ ...d, announcement_bar: { ...d.announcement_bar, color: e.target.value } }))}
                className="w-12 h-10 rounded cursor-pointer border border-[#e5e7eb]" />
              <input value={data.announcement_bar?.color || '#1b3a34'}
                onChange={e => setData((d: any) => ({ ...d, announcement_bar: { ...d.announcement_bar, color: e.target.value } }))}
                className="border border-[#e5e7eb] rounded-xl px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
            </div>
          </div>
          <button onClick={() => save('announcement_bar', data.announcement_bar)} className="px-5 py-2 bg-[#1b3a34] text-white rounded-xl text-sm hover:bg-[#234d44]">Save Section</button>
        </div>
      </Section>

      {/* Hero */}
      <Section title="Hero Banner">
        <div className="pt-4 space-y-3">
          {[['Headline', 'headline'], ['Subheadline', 'subheadline'], ['CTA Button Text', 'cta_text'], ['CTA Button Link', 'cta_link'], ['Background Image URL', 'image_url']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input value={data.hero?.[key] || ''} onChange={e => setData((d: any) => ({ ...d, hero: { ...d.hero, [key]: e.target.value } }))}
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
            </div>
          ))}
          {data.hero?.image_url && <img src={data.hero.image_url} alt="Hero preview" className="w-full max-h-48 object-cover rounded-xl" />}
          <button onClick={() => save('hero', data.hero)} className="px-5 py-2 bg-[#1b3a34] text-white rounded-xl text-sm hover:bg-[#234d44]">Save Section</button>
        </div>
      </Section>

      {/* Brand Story */}
      <Section title="Brand Story">
        <div className="pt-4 space-y-3">
          {[['Pill Tag', 'pill_tag'], ['Headline', 'headline'], ['Image URL', 'image_url']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input value={data.brand_story?.[key] || ''} onChange={e => setData((d: any) => ({ ...d, brand_story: { ...d.brand_story, [key]: e.target.value } }))}
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1">Body Text</label>
            <textarea value={data.brand_story?.body || ''} rows={4}
              onChange={e => setData((d: any) => ({ ...d, brand_story: { ...d.brand_story, body: e.target.value } }))}
              className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-none" />
          </div>
          <button onClick={() => save('brand_story', data.brand_story)} className="px-5 py-2 bg-[#1b3a34] text-white rounded-xl text-sm hover:bg-[#234d44]">Save Section</button>
        </div>
      </Section>

      {/* Trust Badges */}
      <Section title="Trust Badges">
        <div className="pt-4 space-y-3">
          {(data.trust_badges || []).map((badge: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <input value={badge.icon} onChange={e => {
                const badges = [...data.trust_badges]
                badges[i] = { ...badge, icon: e.target.value }
                setData((d: any) => ({ ...d, trust_badges: badges }))
              }} className="w-16 text-center border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-sm" placeholder="🚚" />
              <input value={badge.text} onChange={e => {
                const badges = [...data.trust_badges]
                badges[i] = { ...badge, text: e.target.value }
                setData((d: any) => ({ ...d, trust_badges: badges }))
              }} className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-sm" />
              <button onClick={() => setData((d: any) => ({ ...d, trust_badges: d.trust_badges.filter((_: any, idx: number) => idx !== i) }))}
                className="text-red-500 hover:text-red-700 text-sm px-2 py-1">×</button>
            </div>
          ))}
          <button onClick={() => setData((d: any) => ({ ...d, trust_badges: [...(d.trust_badges || []), { icon: '', text: '' }] }))}
            className="text-sm text-[#1b3a34] hover:underline">+ Add Badge</button>
          <button onClick={() => save('trust_badges', data.trust_badges)} className="block px-5 py-2 bg-[#1b3a34] text-white rounded-xl text-sm hover:bg-[#234d44]">Save All Badges</button>
        </div>
      </Section>
    </div>
  )
}
