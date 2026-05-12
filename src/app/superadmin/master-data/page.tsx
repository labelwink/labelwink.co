'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Trash2, ChevronUp, ChevronDown, Plus, Pencil, Check, X } from 'lucide-react'

const ATTRIBUTE_TYPES = [
  { key: 'size',        label: 'Sizes' },
  { key: 'color',       label: 'Colors' },
  { key: 'fabric',      label: 'Fabrics' },
  { key: 'sleeve_type', label: 'Sleeve Types' },
  { key: 'occasion',    label: 'Occasions' },
  { key: 'fit',         label: 'Fits' },
  { key: 'pattern',     label: 'Patterns' },
  { key: 'custom',      label: 'Custom' },
]

interface Attribute {
  id: string
  type: string
  value: string
  label: string
  sort_order: number
  is_active: boolean
}

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('size')
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newActive, setNewActive] = useState(true)
  const [addingNew, setAddingNew] = useState(false)

  const fetchAttributes = useCallback(async (type: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/attributes?type=${type}`, { credentials: 'include' })
      const data = await res.json()
      // Include inactive too for admin view — fetch all
      const res2 = await fetch(`/api/superadmin/master-data?type=${type}`, { credentials: 'include' })
      const data2 = await res2.json()
      setAttributes(data2.attributes || [])
    } catch {
      toast.error('Failed to fetch attributes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAttributes(activeTab) }, [activeTab, fetchAttributes])

  const generateValue = (label: string) =>
    label.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim()) { toast.error('Label cannot be empty'); return }

    const maxOrder = Math.max(...attributes.map(a => a.sort_order || 0), -1)
    try {
      const res = await fetch('/api/admin/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: activeTab,
          label: newLabel,
          sort_order: maxOrder + 1,
        }),
      })
      if (res.ok) {
        toast.success('Attribute added')
        setNewLabel('')
        setNewActive(true)
        setAddingNew(false)
        fetchAttributes(activeTab)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to add attribute')
      }
    } catch {
      toast.error('Error adding attribute')
    }
  }

  const handleUpdateLabel = async (id: string) => {
    if (!editLabel.trim()) return
    try {
      const res = await fetch(`/api/admin/attributes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ label: editLabel }),
      })
      if (res.ok) { toast.success('Updated'); setEditingId(null); fetchAttributes(activeTab) }
      else toast.error('Failed to update')
    } catch { toast.error('Error updating') }
  }

  const handleToggleActive = async (attr: Attribute) => {
    try {
      const res = await fetch(`/api/admin/attributes/${attr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !attr.is_active }),
      })
      if (res.ok) { fetchAttributes(activeTab) }
      else toast.error('Failed to update')
    } catch { toast.error('Error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attribute? It will be soft-deleted (set inactive).')) return
    try {
      const res = await fetch(`/api/admin/attributes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) { toast.success('Attribute removed'); fetchAttributes(activeTab) }
      else toast.error('Failed to delete')
    } catch { toast.error('Error deleting') }
  }

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const attr = attributes.find(a => a.id === id)
    if (!attr) return
    const newOrder = direction === 'up' ? attr.sort_order - 1 : attr.sort_order + 1
    const other = attributes.find(a => a.sort_order === newOrder)

    if (other) {
      await fetch(`/api/admin/attributes/${other.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ sort_order: attr.sort_order }),
      })
    }
    await fetch(`/api/admin/attributes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ sort_order: newOrder }),
    })
    fetchAttributes(activeTab)
  }

  const sorted = [...attributes].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Master Data</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#f5f2ec] mb-6 overflow-x-auto">
        {ATTRIBUTE_TYPES.map(type => (
          <button
            key={type.key}
            onClick={() => setActiveTab(type.key)}
            className={`px-4 py-3 border-b-2 transition-colors text-sm font-medium whitespace-nowrap ${
              activeTab === type.key
                ? 'border-[#c9a84c] text-[#c9a84c]'
                : 'border-transparent text-[#5a7060] hover:text-[#c9a84c]'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Attributes List */}
      <div className="space-y-2 mb-6">
        {loading ? (
          <p className="text-[#5a7060]">Loading…</p>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 text-[#5a7060]">
            <p>No attributes yet for {ATTRIBUTE_TYPES.find(t => t.key === activeTab)?.label}.</p>
            <p className="text-sm mt-1">Add the first one below.</p>
          </div>
        ) : (
          sorted.map((attr) => (
            <div
              key={attr.id}
              className={`bg-[#faf8f4] rounded-lg p-4 flex items-center justify-between hover:bg-white transition-colors ${!attr.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex-1">
                {editingId === attr.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleUpdateLabel(attr.id); if (e.key === 'Escape') setEditingId(null) }}
                      className="bg-white border border-gray-300 rounded px-3 py-1.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
                      autoFocus
                    />
                    <button onClick={() => handleUpdateLabel(attr.id)} className="p-1.5 bg-[#1C3829] text-white rounded hover:bg-[#24472F]">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="cursor-pointer" onClick={() => { setEditingId(attr.id); setEditLabel(attr.label) }}>
                    <p className="text-gray-900 font-medium text-sm">{attr.label}</p>
                    <p className="text-[#9aab9e] text-xs">{attr.value}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleToggleActive(attr)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                    attr.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {attr.is_active ? 'Active' : 'Inactive'}
                </button>

                <div className="flex gap-0.5">
                  <button onClick={() => handleReorder(attr.id, 'up')} className="p-1 hover:bg-white rounded text-[#9aab9e] hover:text-gray-700">
                    <ChevronUp size={16} />
                  </button>
                  <button onClick={() => handleReorder(attr.id, 'down')} className="p-1 hover:bg-white rounded text-[#9aab9e] hover:text-gray-700">
                    <ChevronDown size={16} />
                  </button>
                </div>

                <button
                  onClick={() => { setEditingId(attr.id); setEditLabel(attr.label) }}
                  className="p-1 hover:bg-white rounded text-[#9aab9e] hover:text-[#1C3829]"
                >
                  <Pencil size={15} />
                </button>

                <button
                  onClick={() => handleDelete(attr.id)}
                  className="p-1 hover:bg-red-50 rounded text-[#9aab9e] hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New */}
      {addingNew ? (
        <div className="bg-[#faf8f4] rounded-xl p-6 border border-[#e8e2d6]">
          <h3 className="text-gray-900 font-semibold mb-4">
            Add New {ATTRIBUTE_TYPES.find(t => t.key === activeTab)?.label}
          </h3>
          <form onSubmit={handleAddAttribute} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-[#5a7060] text-sm mb-2">Label</label>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g., Bell Sleeve"
                className="w-full bg-white border border-[#e8e2d6] rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1C3829] text-sm"
                autoFocus
              />
              {newLabel && (
                <p className="text-[#9aab9e] text-xs mt-1">Value: {generateValue(newLabel)}</p>
              )}
            </div>
            <button type="submit" className="bg-[#1C3829] text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-[#24472F] transition-colors text-sm">
              Add
            </button>
            <button type="button" onClick={() => { setAddingNew(false); setNewLabel('') }} className="border border-gray-200 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">
              Cancel
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1C3829] text-white rounded-xl text-sm font-semibold hover:bg-[#24472F] transition-colors"
        >
          <Plus size={16} />
          Add {ATTRIBUTE_TYPES.find(t => t.key === activeTab)?.label?.replace(/s$/, '')}
        </button>
      )}
    </div>
  )
}
