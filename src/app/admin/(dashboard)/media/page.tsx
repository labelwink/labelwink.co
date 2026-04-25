'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2, Trash2, Copy, Upload, Search } from 'lucide-react'

type MediaItem = {
  public_id: string
  secure_url: string
  width: number
  height: number
  bytes: number
  created_at: string
  format: string
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/media')
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false); return }
    setItems(data.resources ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleUpload = async (files: FileList | null) => {
    if (!files) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      await fetch('/api/admin/upload', { method: 'POST', body: fd })
    }
    setUploading(false)
    showToast('Upload complete ✓')
    load()
  }

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.public_id}"?`)) return
    const res = await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: item.public_id }),
    })
    if (res.ok) {
      setItems(prev => prev.filter(i => i.public_id !== item.public_id))
      if (selected?.public_id === item.public_id) setSelected(null)
      showToast('Deleted')
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    showToast('URL copied ✓')
  }

  const filtered = items.filter(i =>
    i.public_id.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="animate-spin text-[#1b3a34]" size={32} />
    </div>
  )

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1a1a1a]">Media Library</h1>
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">{error}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#1b3a34] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Media Library</h1>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#234d44] disabled:opacity-60 transition-colors"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          Upload Image
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files)} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
          placeholder="Search by filename…"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e5e7eb] rounded-2xl p-16 text-center">
          <p className="text-4xl mb-4">🖼️</p>
          <p className="text-[#6b7280] text-sm">
            {items.length === 0 ? 'No images uploaded yet. Upload your first image.' : 'No results for that search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(item => (
            <div
              key={item.public_id}
              onClick={() => setSelected(item)}
              className={`group relative bg-white border-2 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                selected?.public_id === item.public_id ? 'border-[#1b3a34]' : 'border-[#e5e7eb] hover:border-[#1b3a34]/40'
              }`}
            >
              <div className="aspect-square bg-gray-50">
                <img src={item.secure_url} alt={item.public_id} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-2">
                <p className="text-[10px] text-[#6b7280] truncate font-mono">{item.public_id.split('/').pop()}</p>
                <p className="text-[10px] text-gray-400">{formatBytes(item.bytes)}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(item) }}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected image detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={selected.secure_url} alt={selected.public_id} className="w-full max-h-64 object-contain rounded-lg bg-gray-50" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wide">Public ID</p>
              <p className="text-xs font-mono text-[#6b7280] break-all">{selected.public_id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wide">URL</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono text-[#6b7280] break-all flex-1">{selected.secure_url}</p>
                <button onClick={() => copyUrl(selected.secure_url)}
                  className="flex-shrink-0 p-1.5 border border-[#e5e7eb] rounded-lg hover:bg-gray-50">
                  <Copy size={13} />
                </button>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-[#6b7280]">
              <span>{selected.width}×{selected.height}px</span>
              <span>{formatBytes(selected.bytes)}</span>
              <span>{selected.format.toUpperCase()}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => copyUrl(selected.secure_url)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#234d44]">
                <Copy size={14} /> Copy URL
              </button>
              <button onClick={() => setSelected(null)}
                className="px-4 py-2 border border-[#e5e7eb] rounded-xl text-sm text-[#6b7280] hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-right">{filtered.length} of {items.length} images</p>
    </div>
  )
}
