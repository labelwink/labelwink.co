'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Layers, GripVertical } from 'lucide-react'
import { CloudinaryImageUploader } from '@/components/admin/CloudinaryImageUploader'
import { useToast } from '@/components/admin/Toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

// -- Types ----------------------------------------------------------------------
type Collection = {
  id:           string
  name:         string
  slug:         string
  description?: string
  image_url?:   string
  sort_order?:  number
  visible?:     boolean
  products?:    { count: number }[]   // from supabase aggregate
}

const EMPTY: Omit<Collection, 'id'> = {
  name: '', slug: '', description: '', image_url: '', sort_order: 0, visible: true,
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function productCount(c: Collection) {
  return c.products?.[0]?.count ?? 0
}

// -- Page -----------------------------------------------------------------------
export default function CollectionsPage() {
  const { showToast, ToastComponent } = useToast()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading,     setLoading]     = useState(true)
  const [form,        setForm]        = useState<Omit<Collection, 'id'> | null>(null)
  const [editId,      setEditId]      = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res  = await fetch('/api/admin/collections')
    const data = await res.json()
    setCollections(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditId(null)
    setForm({ ...EMPTY })
    setFormError('')
  }

  const openEdit = (c: Collection) => {
    setEditId(c.id)
    setForm({
      name:        c.name,
      slug:        c.slug,
      description: c.description ?? '',
      image_url:   c.image_url   ?? '',
      sort_order:  c.sort_order  ?? 0,
      visible:     c.visible     ?? true,
    })
    setFormError('')
  }

  const cancelForm = () => { setForm(null); setEditId(null); setFormError('') }

  const handleSave = async () => {
    if (!form?.name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    const url    = editId ? `/api/admin/collections/${editId}` : '/api/admin/collections'
    const method = editId ? 'PUT' : 'POST'
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug: form.slug || slugify(form.name) }),
    })
    if (res.ok) {
      showToast(editId ? 'Collection updated' : 'Collection created', 'success')
      await load()
      setForm(null)
      setEditId(null)
    } else {
      const d = await res.json()
      setFormError(d.error || 'Save failed')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeleteTarget(id)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const id = deleteTarget
    setDeleteTarget(null)
    setCollections(prev => prev.filter(c => c.id !== id))
    const res = await fetch(`/api/admin/collections/${id}`, { method: 'DELETE' })
    if (!res.ok) { showToast('Delete failed', 'error'); load() }
    else showToast('Collection deleted', 'success')
  }

  const toggleVisible = async (c: Collection) => {
    setCollections(prev => prev.map(x => x.id === c.id ? { ...x, visible: !c.visible } : x))
    await fetch(`/api/admin/collections/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !c.visible }),
    })
  }

  return (
    <div className="space-y-5 max-w-[900px]">
      {ToastComponent}
      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Collection?"
        description="This collection will be permanently deleted. Products in this collection will not be deleted."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b3a34]">Collections</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">{collections.length} collection{collections.length !== 1 ? 's' : ''}</p>
        </div>
        {!form && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b] transition-colors"
          >
            <Plus size={13} /> Add Collection
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {form && (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#1b3a34]">{editId ? 'Edit Collection' : 'New Collection'}</h2>
          {formError && <p className="text-red-500 text-xs">{formError}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1b3a34] mb-1">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f!, name: e.target.value, slug: f?.slug || slugify(e.target.value) }))}
                placeholder="e.g. Festive Kurtis"
                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1b3a34] mb-1">Slug</label>
              <input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f!, slug: slugify(e.target.value) }))}
                placeholder="festive-kurtis"
                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#1b3a34] mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f!, description: e.target.value }))}
                rows={2}
                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20 resize-none"
              />
            </div>
            {/* Image upload */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#1b3a34] mb-2">Cover Image</label>
              <div className="flex items-start gap-4">
                <CloudinaryImageUploader
                  onUpload={url => setForm(f => ({ ...f!, image_url: url }))}
                  folder="labelwink/collections"
                />
                {form.image_url && (
                  <div className="w-24 h-16 rounded-lg overflow-hidden border border-[#e5e7eb] flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              {/* Or paste URL */}
              <input
                value={form.image_url}
                onChange={e => setForm(f => ({ ...f!, image_url: e.target.value }))}
                placeholder="or paste image URL�"
                className="mt-2 w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-xs text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1b3a34] mb-1">Sort Order</label>
              <input
                type="number" min="0"
                value={form.sort_order ?? 0}
                onChange={e => setForm(f => ({ ...f!, sort_order: Number(e.target.value) }))}
                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
              />
            </div>
          </div>

          {/* Visible toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f!, visible: !f!.visible }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.visible ? 'bg-[#1b3a34]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.visible ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-xs text-[#1b3a34] font-medium">Visible in store</span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving�' : editId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={cancelForm}
              className="px-5 py-2 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Collections list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-4 flex items-center gap-4 animate-pulse">
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e5e7eb] rounded-xl p-16 text-center">
          <Layers size={28} className="mx-auto text-[#1a2e1e] mb-3" />
          <p className="text-sm text-[#6b7280]">No collections yet � add your first one</p>
        </div>
      ) : (
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#e5e7eb] bg-[#f9f9f9]">
                <th className="text-left px-4 py-3 w-10"></th>
                <th className="text-left px-3 py-3">Collection</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Slug</th>
                <th className="text-center px-3 py-3 hidden lg:table-cell">Sort</th>
                <th className="text-center px-3 py-3 hidden lg:table-cell">Products</th>
                <th className="text-center px-3 py-3">Visible</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {collections.map(c => (
                <tr key={c.id} className="hover:bg-[#f9fafb] transition-colors group">
                  {/* Drag handle placeholder */}
                  <td className="px-3 py-3.5 text-center">
                    <GripVertical size={13} className="text-[#1a2e1e] group-hover:text-[#5a7060] transition-colors mx-auto" />
                  </td>
                  {/* Image + name */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {c.image_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Layers size={14} className="text-[#5a7060]" /></div>
                        }
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#1b3a34]">{c.name}</p>
                        {c.description && (
                          <p className="text-[10px] text-[#9ca3af] mt-0.5 max-w-[180px] truncate">{c.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Slug */}
                  <td className="px-3 py-3.5 hidden md:table-cell">
                    <span className="text-[10px] font-mono text-[#6b7280] bg-gray-100 px-2 py-0.5 rounded">{c.slug}</span>
                  </td>
                  {/* Sort */}
                  <td className="px-3 py-3.5 text-center text-xs text-[#6b7280] hidden lg:table-cell">{c.sort_order ?? 0}</td>
                  {/* Products */}
                  <td className="px-3 py-3.5 text-center hidden lg:table-cell">
                    <span className="text-xs font-semibold text-[#1b3a34]">{productCount(c)}</span>
                  </td>
                  {/* Visible */}
                  <td className="px-3 py-3.5 text-center">
                    <button onClick={() => toggleVisible(c)} title={c.visible ? 'Click to hide' : 'Click to show'}>
                      {c.visible
                        ? <Eye size={15} className="text-[#1b3a34] mx-auto" />
                        : <EyeOff size={15} className="text-[#5a7060] mx-auto" />
                      }
                    </button>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-[#1b3a34] hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
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
