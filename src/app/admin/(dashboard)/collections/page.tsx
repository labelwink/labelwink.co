'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'

type Collection = {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  sort_order?: number
  visible?: boolean
}

const EMPTY: Omit<Collection, 'id'> = {
  name: '', slug: '', description: '', image_url: '', sort_order: 0, visible: true,
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Omit<Collection, 'id'> | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/collections')
    const data = await res.json()
    setCollections(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditId(null)
    setForm({ ...EMPTY })
    setError('')
  }

  const openEdit = (c: Collection) => {
    setEditId(c.id)
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '', image_url: c.image_url ?? '', sort_order: c.sort_order ?? 0, visible: c.visible ?? true })
    setError('')
  }

  const cancelForm = () => { setForm(null); setEditId(null); setError('') }

  const handleSave = async () => {
    if (!form?.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    const url = editId ? `/api/admin/collections/${editId}` : '/api/admin/collections'
    const method = editId ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      await load()
      setForm(null)
      setEditId(null)
    } else {
      const d = await res.json()
      setError(d.error || 'Save failed')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this collection? Products will not be deleted.')) return
    const res = await fetch(`/api/admin/collections/${id}`, { method: 'DELETE' })
    if (res.ok) setCollections(prev => prev.filter(c => c.id !== id))
  }

  const toggleVisible = async (c: Collection) => {
    const res = await fetch(`/api/admin/collections/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !c.visible }),
    })
    if (res.ok) setCollections(prev => prev.map(x => x.id === c.id ? { ...x, visible: !c.visible } : x))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Collections</h1>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#234d44] transition-colors">
          <Plus size={16} /> Add Collection
        </button>
      </div>

      {/* Add / Edit Form */}
      {form && (
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-[#1a1a1a]">{editId ? 'Edit Collection' : 'New Collection'}</h2>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f!, name: e.target.value, slug: f?.slug || slugify(e.target.value) }))}
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                placeholder="e.g. Festive Kurtis"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Slug</label>
              <input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f!, slug: slugify(e.target.value) }))}
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                placeholder="festive-kurtis"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f!, description: e.target.value }))}
                rows={2}
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Image URL</label>
              <input
                value={form.image_url}
                onChange={e => setForm(f => ({ ...f!, image_url: e.target.value }))}
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                placeholder="https://res.cloudinary.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Sort Order</label>
              <input
                type="number" min="0"
                value={form.sort_order ?? 0}
                onChange={e => setForm(f => ({ ...f!, sort_order: Number(e.target.value) }))}
                className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f!, visible: !f!.visible }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.visible ? 'bg-[#1b3a34]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.visible ? 'translate-x-6' : ''}`} />
            </button>
            <span className="text-sm text-[#1a1a1a]">Visible in store</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#234d44] disabled:opacity-50">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editId ? 'Update' : 'Create'}
            </button>
            <button onClick={cancelForm}
              className="px-5 py-2 border border-[#e5e7eb] rounded-xl text-sm text-[#6b7280] hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Collections Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#1b3a34]" size={32} /></div>
      ) : collections.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e5e7eb] rounded-2xl p-16 text-center">
          <p className="text-4xl mb-4">🗂️</p>
          <p className="text-[#6b7280] text-sm">No collections yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-[#6b7280]">Image</th>
                <th className="text-left px-5 py-3 font-medium text-[#6b7280]">Name</th>
                <th className="text-left px-4 py-3 font-medium text-[#6b7280] hidden md:table-cell">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-[#6b7280] hidden lg:table-cell">Sort</th>
                <th className="text-left px-4 py-3 font-medium text-[#6b7280]">Visible</th>
                <th className="text-right px-5 py-3 font-medium text-[#6b7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map(c => (
                <tr key={c.id} className="border-b border-[#e5e7eb] last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xs">No img</div>
                    )}
                  </td>
                  <td className="px-5 py-3 font-medium text-[#1a1a1a]">{c.name}</td>
                  <td className="px-4 py-3 text-[#6b7280] font-mono hidden md:table-cell">{c.slug}</td>
                  <td className="px-4 py-3 text-[#6b7280] hidden lg:table-cell">{c.sort_order ?? 0}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleVisible(c)} title={c.visible ? 'Hide' : 'Show'}>
                      {c.visible
                        ? <Eye size={16} className="text-[#1b3a34]" />
                        : <EyeOff size={16} className="text-gray-400" />}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} title="Edit"
                        className="p-1.5 text-[#6b7280] hover:text-[#1b3a34] hover:bg-gray-100 rounded-lg transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} title="Delete"
                        className="p-1.5 text-[#6b7280] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
