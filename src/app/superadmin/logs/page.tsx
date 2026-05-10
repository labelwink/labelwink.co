'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface Log {
  id: string
  level: string
  category: string
  message: string
  metadata: Record<string, any>
  resolved: boolean
  created_at: string
}

const CATEGORIES = [
  'payment', 'shiprocket', 'auth', 'order',
  'inventory', 'email', 'telegram', 'system'
]

const LEVELS = ['info', 'warn', 'error', 'critical']

const LEVEL_COLORS: Record<string, string> = {
  info: 'bg-blue-500/20 text-blue-400',
  warn: 'bg-yellow-500/20 text-yellow-400',
  error: 'bg-red-500/20 text-red-400',
  critical: 'bg-red-900 border border-red-700 text-red-200',
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const supabase = createClient()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    fetchLogs()
    subscribeToLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (levelFilter !== 'all') params.append('level', levelFilter)
      params.append('limit', '100')

      const res = await fetch(`/api/superadmin/logs?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (error) {
      toast.error('Failed to fetch logs')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToLogs = () => {
    const channel = supabase
      .channel('system-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_logs',
        },
        (payload) => {
          setLogs((prev) => [(payload.new as Log), ...prev].slice(0, 100))
          setIsLive(true)
        }
      )
      .subscribe(() => {
        setIsLive(true)
      })

    channelRef.current = channel
  }

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/superadmin/logs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: true }),
      })

      if (res.ok) {
        setLogs(logs.map(log => log.id === id ? { ...log, resolved: true } : log))
        toast.success('Log marked as resolved')
      }
    } catch (error) {
      toast.error('Failed to resolve log')
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (levelFilter !== 'all') params.append('level', levelFilter)

      const res = await fetch(`/api/superadmin/logs/export?${params}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to export logs')
    }
  }

  const filtered = logs.filter(log => {
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false
    if (levelFilter !== 'all' && log.level !== levelFilter) return false
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold ${
            isLive
              ? 'bg-green-500/20 text-green-400'
              : 'bg-white text-[#5a7060]'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            {isLive ? 'Live' : 'Offline'}
          </div>
          <button
            onClick={handleExport}
            className="bg-[#1C3829] text-white px-4 py-2 rounded hover:bg-[#f5f2ec] text-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div>
          <label className="block text-[#5a7060] text-xs mb-2">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
          >
            <option value="all">All</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[#5a7060] text-xs mb-2">Level</label>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
          >
            <option value="all">All</option>
            {LEVELS.map(level => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-[#5a7060] text-xs mb-2">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search message..."
            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-[#5a7060] text-center py-8">Loading logs...</p>
        ) : filtered.length === 0 ? (
          <p className="text-[#5a7060] text-center py-8">No logs found</p>
        ) : (
          filtered.map(log => (
            <div
              key={log.id}
              className={`bg-[#faf8f4] rounded-lg overflow-hidden transition-colors ${
                log.resolved ? 'opacity-50' : ''
              }`}
            >
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-white transition-colors text-left"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${LEVEL_COLORS[log.level]}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="bg-white text-[#5a7060] text-xs px-2 py-1 rounded">
                    {log.category}
                  </span>
                  <p className="text-gray-900 truncate flex-1">{log.message}</p>
                  <p className="text-[#9aab9e] text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleTimeString('en-IN')}
                  </p>
                </div>
                <div className="ml-4 text-[#5a7060]">{expandedId === log.id ? '?' : '?'}</div>
              </button>

              {expandedId === log.id && (
                <div className="border-t border-[#f5f2ec] p-4 bg-white/50">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[#5a7060] text-xs mb-1">ID</p>
                      <p className="text-gray-900 font-mono text-xs">{log.id}</p>
                    </div>
                    <div>
                      <p className="text-[#5a7060] text-xs mb-1">Time</p>
                      <p className="text-gray-900 text-xs">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {Object.keys(log.metadata).length > 0 && (
                    <div>
                      <p className="text-[#5a7060] text-xs mb-2">Metadata</p>
                      <pre className="bg-[#faf8f4] p-3 rounded text-xs text-[#5a7060] overflow-auto max-h-64">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    {!log.resolved && (
                      <button
                        onClick={() => handleResolve(log.id)}
                        className="bg-[#c9a84c] text-black font-bold px-4 py-2 rounded hover:bg-[#d4b66a] text-sm"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {log.resolved && (
                      <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded text-sm font-bold">
                        ? Resolved
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
