'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink, Download, Upload, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Redirect {
  id: string
  source_path: string
  destination_url: string
  redirect_type: number
  is_active: boolean
  hit_count: number
}

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<Redirect[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // New Redirect Form State
  const [newSource, setNewSource] = useState('')
  const [newDest, setNewDest] = useState('')
  const [newType, setNewType] = useState(301)

  useEffect(() => {
    fetchRedirects()
  }, [])

  const fetchRedirects = async () => {
    try {
      const res = await fetch('/api/admin/redirects')
      const data = await res.json()
      if (res.ok) setRedirects(data)
    } catch (error) {
      toast.error('Failed to load redirects')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSource || !newDest) return

    setIsSaving(true)
    try {
      const source = newSource.startsWith('/') ? newSource : `/${newSource}`
      const res = await fetch('/api/admin/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_path: source,
          destination_url: newDest,
          redirect_type: newType
        })
      })
      
      const data = await res.json()
      if (res.ok) {
        setRedirects([data, ...redirects])
        setNewSource('')
        setNewDest('')
        toast.success('Redirect added successfully')
      } else {
        toast.error(data.error || 'Failed to add redirect')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/redirects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      if (res.ok) {
        setRedirects(redirects.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r))
        toast.success('Redirect updated')
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this redirect?')) return

    try {
      const res = await fetch(`/api/admin/redirects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setRedirects(redirects.filter(r => r.id !== id))
        toast.success('Redirect deleted')
      }
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      
      let successCount = 0
      let errorCount = 0

      for (const line of lines) {
        const [source_path, destination_url, redirect_type] = line.split(',').map(s => s.trim())
        if (!source_path || !destination_url) continue

        try {
          const res = await fetch('/api/admin/redirects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source_path,
              destination_url,
              redirect_type: parseInt(redirect_type) || 301
            })
          })
          if (res.ok) successCount++
          else errorCount++
        } catch {
          errorCount++
        }
      }

      toast.success(`Import complete: ${successCount} success, ${errorCount} errors`)
      fetchRedirects()
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6 font-body">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-2">URL Redirects</h1>
        <p className="text-[#9aab9e]">Manage 301 and 302 redirects for your store.</p>
      </div>

      {/* Add Form */}
      <div className="bg-white border border-[#f5f2ec] p-6">
        <h2 className="text-[#c9a84c] font-bold uppercase tracking-widest text-sm mb-4">Add New Redirect</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs text-[#9aab9e] uppercase font-bold tracking-tighter">Source Path</label>
            <input
              type="text"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="/old-page"
              className="w-full bg-black border border-[#f5f2ec] text-white p-2 text-sm focus:border-[#c9a84c] outline-none transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[#9aab9e] uppercase font-bold tracking-tighter">Destination</label>
            <input
              type="text"
              value={newDest}
              onChange={(e) => setNewDest(e.target.value)}
              placeholder="/new-page or https://..."
              className="w-full bg-black border border-[#f5f2ec] text-white p-2 text-sm focus:border-[#c9a84c] outline-none transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[#9aab9e] uppercase font-bold tracking-tighter">Type</label>
            <div className="flex gap-4 p-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[#5a7060]">
                <input
                  type="radio"
                  checked={newType === 301}
                  onChange={() => setNewType(301)}
                  className="accent-[#c9a84c]"
                />
                301
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[#5a7060]">
                <input
                  type="radio"
                  checked={newType === 302}
                  onChange={() => setNewType(302)}
                  className="accent-[#c9a84c]"
                />
                302
              </label>
            </div>
          </div>
          <button
            disabled={isSaving}
            className="bg-[#c9a84c] text-black h-[38px] font-bold uppercase text-xs tracking-widest hover:bg-[#b39540] transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Add Redirect'}
          </button>
        </form>

        {newSource && newDest && newSource.trim().toLowerCase() === newDest.trim().toLowerCase() && (
          <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider">
            <AlertCircle size={14} />
            Redirect loop detected: Source and destination are the same.
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-end gap-4">
        <label className="flex items-center gap-2 cursor-pointer bg-[#faf8f4] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors border border-[#f5f2ec]">
          <Upload size={14} />
          Import CSV
          <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
        </label>
      </div>

      {/* Redirects Table */}
      <div className="bg-white border border-[#f5f2ec] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#f5f2ec] text-[#9aab9e] uppercase text-[10px] tracking-widest font-black">
              <th className="p-4">Source Path</th>
              <th className="p-4">Destination</th>
              <th className="p-4 text-center">Type</th>
              <th className="p-4 text-center">Hits</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-600 uppercase tracking-widest text-xs font-bold">
                  Loading redirects...
                </td>
              </tr>
            ) : redirects.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-600 uppercase tracking-widest text-xs font-bold">
                  No redirects found
                </td>
              </tr>
            ) : (
              redirects.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 font-mono text-xs text-[#5a7060]">{r.source_path}</td>
                  <td className="p-4 flex items-center gap-2 text-[#5a7060]">
                    <span className="truncate max-w-[200px]">{r.destination_url}</span>
                    <a href={r.destination_url} target="_blank" className="opacity-0 group-hover:opacity-100 text-[#c9a84c] transition-opacity">
                      <ExternalLink size={12} />
                    </a>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-black tracking-tighter ${r.redirect_type === 301 ? 'bg-blue-900/20 text-blue-400' : 'bg-orange-900/20 text-orange-400'}`}>
                      {r.redirect_type}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-[#c9a84c]">{r.hit_count}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleActive(r.id, r.is_active)}
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 ${r.is_active ? 'text-green-500 border border-green-900/50' : 'text-gray-600 border border-[#f5f2ec]'}`}
                    >
                      {r.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-gray-600 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
