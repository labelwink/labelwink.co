'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/admin/Toast'

export default function AboutEditor() {
  const [data, setData] = useState<any>(null)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    fetch('/api/admin/cms/about').then(r => r.json()).then(setData)
  }, [])

  const save = async () => {
    const res = await fetch('/api/admin/cms/about', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    showToast(res.ok ? 'Saved ✓' : 'Save failed', res.ok ? 'success' : 'error')
  }

  if (!data) return <div className="text-center py-20 text-[#6b7280]">Loading…</div>

  return (
    <div className="space-y-6 max-w-2xl">
      {ToastComponent}
      <div>
        <nav className="text-sm text-[#6b7280] mb-1">Admin › Pages › <span className="text-[#1a1a1a]">About Us</span></nav>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">About Us Editor</h1>
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 space-y-5">
        {[
          ['Page Title', 'title'],
          ['Hero Image URL', 'hero_image'],
          ['Tagline', 'tagline'],
        ].map(([label, key]) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input value={data[key] || ''} onChange={e => setData((d: any) => ({ ...d, [key]: e.target.value }))}
              className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium mb-1">About Content (HTML)</label>
          <textarea value={data.content || ''} onChange={e => setData((d: any) => ({ ...d, content: e.target.value }))} rows={12}
            className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-y" />
        </div>
        <button onClick={save} className="px-6 py-2.5 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#234d44]">
          Save About Page
        </button>
      </div>
    </div>
  )
}
