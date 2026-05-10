'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react'

const ATTRIBUTE_TYPES = [
  { key: 'size', label: 'Sizes' },
  { key: 'color', label: 'Colors' },
  { key: 'fabric', label: 'Fabrics' },
  { key: 'sleeve_type', label: 'Sleeve Types' },
  { key: 'occasion', label: 'Occasions' },
  { key: 'fit', label: 'Fits' },
  { key: 'pattern', label: 'Patterns' },
  { key: 'custom', label: 'Custom' },
]

interface Attribute {
  id: string
  type: string
  value: string
  label: string
  display_order: number
  is_active: boolean
  metadata: Record<string, any>
}

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('size')
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [newActive, setNewActive] = useState(true)

  useEffect(() => {
    fetchAttributes(activeTab)
  }, [activeTab])

  const fetchAttributes = async (type: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/master-data?type=${type}`)
      const data = await res.json()
      setAttributes(data.attributes || [])
    } catch (error) {
      toast.error('Failed to fetch attributes')
    } finally {
      setLoading(false)
    }
  }

  const generateValue = (label: string) => {
    return label.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  }

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim()) {
      toast.error('Label cannot be empty')
      return
    }

    const value = generateValue(newLabel)
    const maxOrder = Math.max(...attributes.map(a => a.display_order || 0), -1)

    try {
      const res = await fetch('/api/superadmin/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          value,
          label: newLabel,
          display_order: maxOrder + 1,
          is_active: newActive,
        }),
      })

      if (res.ok) {
        toast.success('Attribute added')
        setNewLabel('')
        setNewActive(true)
        fetchAttributes(activeTab)
      } else {
        toast.error('Failed to add attribute')
      }
    } catch (error) {
      toast.error('Error adding attribute')
    }
  }

  const handleUpdateAttribute = async (id: string, field: string, value: any) => {
    try {
      const res = await fetch(`/api/superadmin/master-data/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })

      if (res.ok) {
        fetchAttributes(activeTab)
        setEditingId(null)
      } else {
        toast.error('Failed to update attribute')
      }
    } catch (error) {
      toast.error('Error updating attribute')
    }
  }

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm('Delete this attribute?')) return

    try {
      const res = await fetch(`/api/superadmin/master-data/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Attribute deleted')
        fetchAttributes(activeTab)
      } else {
        toast.error('Failed to delete attribute')
      }
    } catch (error) {
      toast.error('Error deleting attribute')
    }
  }

  const handleReorderAttribute = async (id: string, direction: 'up' | 'down') => {
    const attr = attributes.find(a => a.id === id)
    if (!attr) return

    const newOrder = direction === 'up' ? attr.display_order - 1 : attr.display_order + 1
    const otherAttr = attributes.find(a => a.display_order === newOrder)

    if (otherAttr) {
      await handleUpdateAttribute(otherAttr.id, 'display_order', attr.display_order)
      await handleUpdateAttribute(id, 'display_order', newOrder)
    }
  }

  const sorted = [...attributes].sort((a, b) => a.display_order - b.display_order)

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
                : 'border-transparent text-[#5a7060] hover:text-white'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Attributes List */}
      <div className="space-y-2 mb-8">
        {loading ? (
          <p className="text-[#5a7060]">Loading...</p>
        ) : sorted.length === 0 ? (
          <p className="text-[#5a7060]">No attributes yet</p>
        ) : (
          sorted.map((attr) => (
            <div
              key={attr.id}
              className="bg-[#faf8f4] rounded-lg p-4 flex items-center justify-between hover:bg-white transition-colors"
            >
              <div className="flex-1">
                {editingId === attr.id ? (
                  <input
                    type="text"
                    value={attr.label}
                    onChange={(e) => setEditingId('editing')}
                    onBlur={() => handleUpdateAttribute(attr.id, 'label', attr.label)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateAttribute(attr.id, 'label', attr.label)
                    }}
                    className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => setEditingId(attr.id)}
                    className="cursor-pointer hover:text-[#c9a84c]"
                  >
                    <p className="text-gray-900 font-medium">{attr.label}</p>
                    <p className="text-[#9aab9e] text-xs">{attr.value}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 ml-4">
                <button
                  onClick={() => handleUpdateAttribute(attr.id, 'is_active', !attr.is_active)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    attr.is_active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-[#f5f2ec] text-[#5a7060]'
                  }`}
                >
                  {attr.is_active ? 'Active' : 'Inactive'}
                </button>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleReorderAttribute(attr.id, 'up')}
                    className="p-1 hover:bg-white rounded text-[#5a7060] hover:text-white"
                  >
                    <ChevronUp size={18} />
                  </button>
                  <button
                    onClick={() => handleReorderAttribute(attr.id, 'down')}
                    className="p-1 hover:bg-white rounded text-[#5a7060] hover:text-white"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteAttribute(attr.id)}
                  className="p-1 hover:bg-red-500/20 rounded text-[#5a7060] hover:text-red-400"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Form */}
      <div className="bg-[#faf8f4] rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Add New {ATTRIBUTE_TYPES.find(t => t.key === activeTab)?.label}</h3>
        <form onSubmit={handleAddAttribute} className="space-y-4">
          <div>
            <label className="block text-[#5a7060] text-sm mb-2">Label</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g., Extra Large"
              className="w-full bg-white border border-[#e8e2d6] rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
            />
            {newLabel && (
              <p className="text-[#9aab9e] text-xs mt-1">Value: {generateValue(newLabel)}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="new-active"
              checked={newActive}
              onChange={(e) => setNewActive(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="new-active" className="text-[#5a7060] text-sm">
              Active immediately
            </label>
          </div>

          <button
            type="submit"
            className="bg-[#c9a84c] text-black font-bold px-6 py-2 rounded hover:bg-[#d4b66a] transition-colors"
          >
            Add Attribute
          </button>
        </form>
      </div>
    </div>
  )
}
