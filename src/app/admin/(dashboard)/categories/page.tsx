'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, LayoutGrid, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const emptyForm = { name: '', slug: '', description: '', sort_order: 0, is_active: true }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [slugEdited, setSlugEdited] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories', { credentials: 'include' })
      const data = await res.json()
      setCategories(data.categories ?? [])
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setSlugEdited(false)
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    })
    setSlugEdited(true)
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditing(null) }

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: slugEdited ? f.slug : slugify(name) }))
  }

  const handleSlugChange = (slug: string) => {
    setSlugEdited(true)
    setForm(f => ({ ...f, slug }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }

    setSaving(true)
    try {
      const url = editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save')
      }
      toast.success(editing ? 'Category updated' : 'Category created')
      closeModal()
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (cat: Category) => {
    try {
      await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !cat.is_active }),
        credentials: 'include',
      })
      toast.success(cat.is_active ? 'Category deactivated' : 'Category activated')
      fetchCategories()
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-8 font-body">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">Categories</h1>
          <p className="text-sm text-[#5a7060] mt-1">{categories.length} categories total</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#1C3829] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#24472F] transition-colors"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-sage/20 rounded-2xl bg-white">
          <div className="w-20 h-20 bg-sage/5 rounded-full flex items-center justify-center mx-auto mb-6 text-sage">
            <LayoutGrid size={40} />
          </div>
          <h3 className="text-lg font-semibold text-charcoal">No categories yet</h3>
          <p className="text-sm text-[#5a7060] mt-1 mb-8">Create your first category to organize products.</p>
          <button onClick={openAdd} className="bg-[#1C3829] text-white px-8 py-3 rounded-xl text-sm font-bold">
            Create First Category
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-sage/20 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-sage/5 border-b border-sage/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5a7060] uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5a7060] uppercase tracking-wider">Slug</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#5a7060] uppercase tracking-wider">Order</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#5a7060] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#5a7060] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/5">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-sage/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                      ) : (
                        <div className="w-8 h-8 bg-sage/10 rounded-lg flex items-center justify-center text-[#5a7060]">
                          <LayoutGrid size={14} />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-charcoal">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#5a7060] font-mono">/{cat.slug}</td>
                  <td className="px-6 py-4 text-sm text-center text-[#9aab9e]">{cat.sort_order}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      cat.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => toggleActive(cat)}
                        className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                      >
                        {cat.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
                  placeholder="e.g. Palazzo Sets"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
                  placeholder="auto-generated from name"
                />
                <p className="text-xs text-gray-400 mt-1">labelwink.co/products?category={form.slug || '…'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-[#1C3829]' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
                    </button>
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-[#1C3829] text-white rounded-xl hover:bg-[#24472F] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : editing ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
