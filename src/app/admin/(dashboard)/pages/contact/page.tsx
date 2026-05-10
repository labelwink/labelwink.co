'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/admin/Toast'

export default function ContactEditor() {
  const [data, setData] = useState<any>(null)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    fetch('/api/admin/cms/contact').then(r => r.json()).then(setData)
  }, [])

  const save = async () => {
    const res = await fetch('/api/admin/cms/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    showToast(res.ok ? 'Saved ?' : 'Save failed', res.ok ? 'success' : 'error')
  }

  if (!data) return <div className="text-center py-20 text-[#6b7280]">Loading</div>

  return (
    <div className="space-y-6 max-w-2xl">
      {ToastComponent}
      <div>
        <nav className="text-sm text-[#6b7280] mb-1">Admin  Pages  <span className="text-[#1b3a34]">Contact</span></nav>
        <h1 className="text-2xl font-bold text-[#1b3a34]">Contact Page Editor</h1>
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 space-y-5">
        {[
          ['Email', 'email'],
          ['WhatsApp Number', 'whatsapp'],
          ['Phone', 'phone'],
          ['Address Line 1', 'address_line1'],
          ['Address Line 2', 'address_line2'],
          ['Business Hours', 'hours'],
        ].map(([label, key]) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input value={data[key] || ''} onChange={e => setData((d: any) => ({ ...d, [key]: e.target.value }))}
              className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium mb-1">Contact Form Enabled</label>
          <button type="button" onClick={() => setData((d: any) => ({ ...d, form_enabled: !d.form_enabled }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${data.form_enabled ? 'bg-[#1b3a34]' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.form_enabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        <button onClick={save} className="px-6 py-2.5 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#234d44]">
          Save Contact Page
        </button>
      </div>
    </div>
  )
}
