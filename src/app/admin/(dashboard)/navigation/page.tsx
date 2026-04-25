'use client'

import { useEffect, useState } from 'react'
import { Plus, X, GripVertical, Loader2 } from 'lucide-react'

type NavItem = { label: string; href: string }
type FooterColumn = { title: string; links: NavItem[] }

export default function NavigationPage() {
  const [mainNav, setMainNav] = useState<NavItem[]>([])
  const [footerCols, setFooterCols] = useState<FooterColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<'main' | 'footer' | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    fetch('/api/admin/navigation')
      .then(r => r.json())
      .then(d => { setMainNav(d.main_nav ?? []); setFooterCols(d.footer_columns ?? []) })
      .finally(() => setLoading(false))
  }, [])

  // ─── Header Nav ───────────────────────────────────────
  const updateNav = (i: number, field: keyof NavItem, val: string) => {
    setMainNav(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }
  const addNav = () => setMainNav(prev => [...prev, { label: '', href: '' }])
  const removeNav = (i: number) => setMainNav(prev => prev.filter((_, idx) => idx !== i))

  const saveMain = async () => {
    setSaving('main')
    const res = await fetch('/api/admin/navigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'main_nav', items: mainNav }),
    })
    setSaving(null)
    showToast(res.ok ? 'Header nav saved ✓' : 'Save failed')
  }

  // ─── Footer ───────────────────────────────────────────
  const updateColTitle = (ci: number, title: string) =>
    setFooterCols(prev => prev.map((c, i) => i === ci ? { ...c, title } : c))

  const updateLink = (ci: number, li: number, field: keyof NavItem, val: string) =>
    setFooterCols(prev => prev.map((c, i) => i === ci
      ? { ...c, links: c.links.map((l, j) => j === li ? { ...l, [field]: val } : l) }
      : c))

  const addLink = (ci: number) =>
    setFooterCols(prev => prev.map((c, i) => i === ci ? { ...c, links: [...c.links, { label: '', href: '' }] } : c))

  const removeLink = (ci: number, li: number) =>
    setFooterCols(prev => prev.map((c, i) => i === ci ? { ...c, links: c.links.filter((_, j) => j !== li) } : c))

  const addColumn = () => setFooterCols(prev => [...prev, { title: 'New Column', links: [] }])
  const removeColumn = (ci: number) => setFooterCols(prev => prev.filter((_, i) => i !== ci))

  const saveFooter = async () => {
    setSaving('footer')
    const res = await fetch('/api/admin/navigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'footer_columns', columns: footerCols }),
    })
    setSaving(null)
    showToast(res.ok ? 'Footer saved ✓' : 'Save failed')
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="animate-spin text-[#1b3a34]" size={32} />
    </div>
  )

  return (
    <div className="space-y-10">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#1b3a34] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* ─── Header Navigation ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Header Navigation</h2>
          <button onClick={addNav}
            className="flex items-center gap-1.5 text-sm text-[#1b3a34] border border-[#1b3a34] rounded-lg px-3 py-1.5 hover:bg-[#1b3a34] hover:text-white transition-colors">
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden">
          {mainNav.length === 0 && (
            <p className="text-center text-[#6b7280] text-sm py-8">No nav items. Add one above.</p>
          )}
          {mainNav.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#e5e7eb] last:border-0">
              <GripVertical size={16} className="text-gray-300 cursor-grab flex-shrink-0" />
              <input
                value={item.label}
                onChange={e => updateNav(i, 'label', e.target.value)}
                className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                placeholder="Label"
              />
              <input
                value={item.href}
                onChange={e => updateNav(i, 'href', e.target.value)}
                className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                placeholder="/path"
              />
              <button onClick={() => removeNav(i)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={saveMain} disabled={saving === 'main'}
            className="flex items-center gap-2 px-5 py-2 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#234d44] disabled:opacity-60">
            {saving === 'main' && <Loader2 size={14} className="animate-spin" />}
            Save Header Nav
          </button>
        </div>
      </section>

      {/* ─── Footer Columns ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Footer Columns</h2>
          <button onClick={addColumn}
            className="flex items-center gap-1.5 text-sm text-[#1b3a34] border border-[#1b3a34] rounded-lg px-3 py-1.5 hover:bg-[#1b3a34] hover:text-white transition-colors">
            <Plus size={14} /> Add Column
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {footerCols.map((col, ci) => (
            <div key={ci} className="bg-white border border-[#e5e7eb] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  value={col.title}
                  onChange={e => updateColTitle(ci, e.target.value)}
                  className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                  placeholder="Column Title"
                />
                <button onClick={() => removeColumn(ci)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {col.links.map((link, li) => (
                  <div key={li} className="flex items-center gap-2">
                    <input
                      value={link.label}
                      onChange={e => updateLink(ci, li, 'label', e.target.value)}
                      className="flex-1 border border-[#e5e7eb] rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#1b3a34]"
                      placeholder="Label"
                    />
                    <input
                      value={link.href}
                      onChange={e => updateLink(ci, li, 'href', e.target.value)}
                      className="flex-1 border border-[#e5e7eb] rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#1b3a34]"
                      placeholder="/path"
                    />
                    <button onClick={() => removeLink(ci, li)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={() => addLink(ci)}
                className="flex items-center gap-1 text-xs text-[#1b3a34] hover:underline">
                <Plus size={12} /> Add Link
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={saveFooter} disabled={saving === 'footer'}
            className="flex items-center gap-2 px-5 py-2 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#234d44] disabled:opacity-60">
            {saving === 'footer' && <Loader2 size={14} className="animate-spin" />}
            Save Footer
          </button>
        </div>
      </section>
    </div>
  )
}
