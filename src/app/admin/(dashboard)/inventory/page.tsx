'use client'

import { useState, useEffect, useRef, Fragment, ChangeEvent } from 'react'
import { Package, Download, Upload, AlertTriangle, CheckCircle, XCircle, Search, Edit3, History, ChevronDown, ChevronRight, X } from 'lucide-react'
import { formatIndianCurrency } from '@/lib/invoice-helpers'
import Image from 'next/image'

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'low' | 'out'>('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Edit states
  const [editingField, setEditingField] = useState<{ id: string, field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingField, setSavingField] = useState<string | null>(null)

  // Modal state
  const [modalVariant, setModalVariant] = useState<any>(null)
  const [adjQty, setAdjQty] = useState('')
  const [adjReason, setAdjReason] = useState('Sales')
  const [adjCustom, setAdjCustom] = useState('')
  const [modalSaving, setModalSaving] = useState(false)

  // History state
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [historyData, setHistoryData] = useState<Record<string, any[]>>({})
  const [historyLoading, setHistoryLoading] = useState<Record<string, boolean>>({})

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number, failed: any[] } | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/inventory?search=${encodeURIComponent(debouncedSearch)}&status=${status}&page=${page}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchInventory() }, [debouncedSearch, status, page])

  const handleExport = () => {
    window.location.href = `/api/admin/reports/stock?format=csv&status=${status}`
  }

  const downloadTemplate = () => {
    const csv = 'sku,stock_qty,reason\nTEST-SKU-01,10,Restock\nTEST-SKU-02,0,Damaged'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/inventory/import', { method: 'POST', body: formData })
      const json = await res.json()
      setImportResult({ success: json.success_count || 0, failed: json.failed || [] })
      fetchInventory()
    } catch (err) {
      console.error('Import failed', err)
      alert('Import failed')
    }
    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleInlineSave = async (variantId: string, field: string) => {
    const prevVar = data?.variants.find((v: any) => v.variant_id === variantId)
    if (!prevVar) return

    let payload: any = {}
    if (field === 'stock_qty' || field === 'low_stock_threshold') {
      const num = parseInt(editValue, 10)
      if (isNaN(num) || num < 0) return setEditingField(null)
      if (num === prevVar[field]) return setEditingField(null)
      payload[field] = num
    } else {
      if (editValue === prevVar[field]) return setEditingField(null)
      payload[field] = editValue
    }

    setSavingField(`${variantId}-${field}`)
    try {
      await fetch(`/api/admin/inventory/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      setData((prev: any) => ({
        ...prev,
        variants: prev.variants.map((v: any) => v.variant_id === variantId ? { ...v, ...payload } : v)
      }))
    } catch (err) {
      console.error(err)
    }
    setEditingField(null)
    setSavingField(null)
  }

  const handleModalSave = async () => {
    if (!modalVariant) return
    const num = parseInt(adjQty, 10)
    if (isNaN(num) || num < 0) return alert('Invalid quantity')

    setModalSaving(true)
    const reason = adjReason === 'Other' ? adjCustom : adjReason
    try {
      await fetch(`/api/admin/inventory/${modalVariant.variant_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_qty: num, reason })
      })
      setModalVariant(null)
      fetchInventory()
      if (expandedRow === modalVariant.variant_id) {
        fetchHistory(modalVariant.variant_id)
      }
    } catch (err) {
      console.error(err)
    }
    setModalSaving(false)
  }

  const fetchHistory = async (variantId: string) => {
    setHistoryLoading(p => ({ ...p, [variantId]: true }))
    try {
      const res = await fetch(`/api/admin/inventory/${variantId}`)
      const json = await res.json()
      setHistoryData(p => ({ ...p, [variantId]: json }))
    } catch (err) {
      console.error(err)
    }
    setHistoryLoading(p => ({ ...p, [variantId]: false }))
  }

  const toggleRow = (variantId: string) => {
    if (expandedRow === variantId) {
      setExpandedRow(null)
    } else {
      setExpandedRow(variantId)
      if (!historyData[variantId]) {
        fetchHistory(variantId)
      }
    }
  }

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory</h1>
        <p className="text-gray-500 mt-1">
          Manage stock, locations, and view adjustment history.
        </p>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total SKUs</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{data.summary.total_skus}</p>
            </div>
            <Package className="h-8 w-8 text-[#1C3829]/20" />
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600/80">Out of Stock</p>
              <p className="text-xl font-bold text-red-600 mt-1">{data.summary.out_of_stock}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-200" />
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600/80">Low Stock</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{data.summary.low_stock}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-200" />
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Value</p>
              <p className="text-xl font-bold text-[#c9a84c] mt-1">{formatIndianCurrency(data.summary.total_stock_value)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search product or SKU..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C3829] focus:border-transparent w-full sm:w-64 text-sm text-gray-900 bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1C3829] text-sm text-gray-900"
          >
            <option value="all">All SKUs</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
          <div className="relative group">
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center space-x-2 bg-white text-white px-4 py-2 rounded-md hover:bg-white/90 transition-colors text-sm disabled:opacity-50">
              <Upload className="h-4 w-4" />
              <span>{importing ? 'Importing...' : 'Import CSV'}</span>
            </button>
            <div className="absolute top-full right-0 mt-2 bg-white border border-[#ffffff]/10 shadow-lg rounded-md p-2 hidden group-hover:block w-48 z-10">
              <button onClick={downloadTemplate} className="text-xs text-blue-600 hover:underline w-full text-left">Download CSV Template</button>
            </div>
          </div>
          <button onClick={handleExport} className="flex items-center space-x-2 bg-white border border-[#ffffff]/20 px-4 py-2 rounded-md hover:bg-[#faf7f2] transition-colors text-sm">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`p-4 rounded-lg border text-sm ${importResult.failed.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          <div className="font-semibold flex justify-between">
            <span>Import Complete: {importResult.success} updated, {importResult.failed.length} failed.</span>
            <button onClick={() => setImportResult(null)}><X className="h-4 w-4" /></button>
          </div>
          {importResult.failed.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto">
              <ul className="list-disc pl-5 space-y-1 text-xs">
                {(Array.isArray(importResult.failed) ? importResult.failed : []).map((f, i) => (
                  <li key={i}>SKU {f.sku}: {f.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1C3829] text-white">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 font-medium text-sm">Product</th>
                <th className="px-4 py-3 font-medium text-sm">Variant</th>
                <th className="px-4 py-3 font-medium text-sm">SKU</th>
                <th className="px-4 py-3 text-center font-medium text-sm">Status</th>
                <th className="px-4 py-3 text-right font-medium text-sm">Stock</th>
                <th className="px-4 py-3 text-right font-medium text-sm">Threshold</th>
                <th className="px-4 py-3 font-medium text-sm">Location</th>
                <th className="px-4 py-3 text-right font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">Loading inventory...</td></tr>
              ) : (Array.isArray(data?.variants) ? data.variants : []).length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">No variants found.</td></tr>
              ) : (Array.isArray(data?.variants) ? data.variants : []).map((v: any) => {
                const isExpanded = expandedRow === v.variant_id
                
                const renderInlineEdit = (field: string, type: 'text'|'number' = 'text', align: string = 'left') => {
                  const isEditing = editingField?.id === v.variant_id && editingField?.field === field
                  const isSaving = savingField === `${v.variant_id}-${field}`
                  
                  if (isSaving) return <span className={`text-[#c9a84c] text-xs block text-${align}`}>Saving...</span>
                  if (isEditing) {
                    return (
                      <input
                        autoFocus
                        type={type}
                        className={`w-20 bg-white border border-[#e8e2d6] text-gray-900 text-center rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500`}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => handleInlineSave(v.variant_id, field)}
                        onKeyDown={e => { if (e.key === 'Enter') handleInlineSave(v.variant_id, field) }}
                      />
                    )
                  }
                  
                  let displayVal = v[field]
                  if (field === 'stock_qty') {
                    displayVal = <span className={v.stock_qty === 0 ? 'text-red-600 font-bold' : v.stock_qty <= v.low_stock_threshold ? 'text-amber-600 font-bold' : ''}>{v.stock_qty}</span>
                  }

                  return (
                    <div
                      className={`cursor-pointer hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] px-1 py-0.5 rounded transition-colors inline-block text-${align} w-full min-h-[24px]`}
                      onClick={() => { setEditingField({ id: v.variant_id, field }); setEditValue(String(v[field] || '')) }}
                      title="Click to edit"
                    >
                      {displayVal || <span className="text-transparent">_</span>}
                    </div>
                  )
                }

                return (
                  <Fragment key={v.variant_id}>
                    <tr className={`hover:bg-[#faf7f2]/50 transition-colors ${isExpanded ? 'bg-[#faf7f2]/30' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleRow(v.variant_id)} className="text-[#ffffff]/40 hover:text-[#ffffff]">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 relative rounded overflow-hidden bg-[#faf7f2] shrink-0 border border-[#ffffff]/10">
                            <Image 
                              src={v.image_url || '/placeholder-product.jpg'} 
                              alt={v.product_name || 'Product'} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">{v.product_name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{v.size} {v.color ? `/ ${v.color}` : ''}</td>
                      <td className="px-4 py-3 font-mono text-xs w-32">{renderInlineEdit('sku')}</td>
                      <td className="px-4 py-3 text-center">
                        {v.status === 'out' ? (
                          <span className="inline-flex items-center space-x-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px] font-medium border border-red-100"><XCircle className="h-3 w-3" /><span>Out</span></span>
                        ) : v.status === 'low' ? (
                          <span className="inline-flex items-center space-x-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-100"><AlertTriangle className="h-3 w-3" /><span>Low</span></span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-[11px] font-medium border border-green-100"><CheckCircle className="h-3 w-3" /><span>Healthy</span></span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right w-20">{renderInlineEdit('stock_qty', 'number', 'right')}</td>
                      <td className="px-4 py-3 text-right w-20 text-[#ffffff]/60">{renderInlineEdit('low_stock_threshold', 'number', 'right')}</td>
                      <td className="px-4 py-3 w-32">{renderInlineEdit('warehouse_location')}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setModalVariant(v); setAdjQty(String(v.stock_qty)) }} className="p-1.5 text-[#ffffff]/50 hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 rounded transition-colors" title="Adjust Stock">
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded History Row */}
                    {isExpanded && (
                      <tr className="bg-[#faf7f2]/50 border-b border-[#ffffff]/5">
                        <td colSpan={9} className="px-12 py-4">
                          <div className="flex items-center space-x-2 text-[#1b3a34] mb-3">
                            <History className="h-4 w-4 text-[#c9a84c]" />
                            <h4 className="font-semibold text-sm">Recent Adjustments</h4>
                          </div>
                          {historyLoading[v.variant_id] ? (
                            <div className="text-xs text-[#6b7280]">Loading history...</div>
                          ) : historyData[v.variant_id]?.length > 0 ? (
                            <table className="w-full text-xs text-left bg-white border border-[#ffffff]/10 rounded-md overflow-hidden">
                              <thead className="bg-[#faf7f2] border-b border-[#ffffff]/10">
                                <tr>
                                  <th className="px-3 py-2">Date</th>
                                  <th className="px-3 py-2 text-right">Previous</th>
                                  <th className="px-3 py-2 text-right">New</th>
                                  <th className="px-3 py-2 text-right">Change</th>
                                  <th className="px-3 py-2">Reason</th>
                                  <th className="px-3 py-2">By</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#ffffff]/5">
                                {(Array.isArray(historyData[v.variant_id]) ? historyData[v.variant_id] : []).map((h: any) => (
                                  <tr key={h.id}>
                                    <td className="px-3 py-2 text-[#6b7280]">{new Date(h.created_at).toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short'})}</td>
                                    <td className="px-3 py-2 text-right">{h.previous_qty}</td>
                                    <td className="px-3 py-2 text-right font-medium">{h.new_qty}</td>
                                    <td className="px-3 py-2 text-right font-mono">
                                      <span className={h.adjustment > 0 ? 'text-green-600' : h.adjustment < 0 ? 'text-red-600' : ''}>
                                        {h.adjustment > 0 ? '+' : ''}{h.adjustment}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">{h.reason}</td>
                                    <td className="px-3 py-2 text-[#6b7280]">{h.adjusted_by}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-xs text-[#9ca3af] italic">No adjustment history recorded for this variant.</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        {data?.total > 20 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} SKUs
            </div>
            <div className="flex space-x-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-white bg-transparent transition-colors text-gray-700">Prev</button>
              <button disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-white bg-transparent transition-colors text-gray-700">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Adjustment Modal */}
      {modalVariant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-[#ffffff]/10 flex justify-between items-center bg-[#faf7f2]">
              <h3 className="font-bold text-[#1b3a34]">Adjust Stock</h3>
              <button type="button" onClick={() => setModalVariant(null)} className="text-[#6b7280] hover:text-[#1b3a34] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="font-medium text-[#1b3a34]">{modalVariant.product_name}</p>
                <p className="text-sm text-[#6b7280]">Variant: {modalVariant.size} {modalVariant.color ? `/ ${modalVariant.color}` : ''} | SKU: {modalVariant.sku}</p>
              </div>
              
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">Current Stock</label>
                  <div className="w-full px-3 py-2 bg-[#faf7f2] border border-[#e5e7eb] rounded-md text-[#1b3a34] font-medium">{modalVariant.stock_qty}</div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">New Quantity</label>
                  <input type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)} className="w-full px-3 py-2 border border-[#ffffff]/20 rounded-md focus:border-[#c9a84c] focus:outline-none" min="0" autoFocus />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Reason for Adjustment</label>
                <select value={adjReason} onChange={e => setAdjReason(e.target.value)} className="w-full px-3 py-2 border border-[#ffffff]/20 rounded-md focus:border-[#c9a84c] focus:outline-none bg-white">
                  <option value="Sales">Sales (External Platform)</option>
                  <option value="Damaged">Damaged / Defective</option>
                  <option value="Restock">Restock / New Delivery</option>
                  <option value="Audit Correction">Audit Correction</option>
                  <option value="Return">Customer Return</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {adjReason === 'Other' && (
                <div>
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">Specify Reason</label>
                  <input type="text" value={adjCustom} onChange={e => setAdjCustom(e.target.value)} className="w-full px-3 py-2 border border-[#ffffff]/20 rounded-md focus:border-[#c9a84c] focus:outline-none" placeholder="Enter reason..." />
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#ffffff]/10 flex justify-end space-x-3 bg-[#faf7f2]">
              <button type="button" onClick={() => setModalVariant(null)} disabled={modalSaving} className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1b3a34] transition-colors disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleModalSave} disabled={modalSaving} className="px-4 py-2 text-sm font-semibold bg-[#1b3a34] text-white rounded-lg hover:bg-[#16312b] transition-colors disabled:opacity-50">
                {modalSaving ? 'Saving...' : 'Save Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
