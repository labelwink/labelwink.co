'use client'

import React, { useState, useEffect } from 'react'
import { Tag, Plus, Search, Trash2, Copy, AlertTriangle, CheckCircle, Clock, XCircle, MoreVertical, X, Settings2, Percent, DollarSign } from 'lucide-react'
import { formatIndianCurrency } from '@/lib/invoice-helpers'

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [statusTab, setStatusTab] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Form State
  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    min_order_amount: '',
    max_uses: '',
    single_use_per_customer: false,
    starts_at: '',
    expires_at: '',
    description: '',
    is_active: true
  })
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(t)
  }, [search])

  const fetchDiscounts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/discounts?search=${encodeURIComponent(debouncedSearch)}&status=${statusTab}`)
      const data = await res.json()
      setDiscounts(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchDiscounts() }, [debouncedSearch, statusTab])

  const fetchDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/discounts/${id}`)
      const data = await res.json()
      setDetailData(data)
    } catch (err) {
      console.error(err)
    }
    setDetailLoading(false)
  }

  const handleRowClick = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null)
    } else {
      setExpandedRow(id)
      setDetailData(null)
      fetchDetail(id)
    }
  }

  const handleToggleActive = async (id: string, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/admin/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current })
      })
      fetchDiscounts()
      if (expandedRow === id) fetchDetail(id)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this discount?')) return
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        fetchDiscounts()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDuplicate = (d: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setForm({
      code: `COPY-${d.code.substring(0, 10)}`,
      type: d.type,
      value: String(d.value || ''),
      min_order_amount: String(d.min_order_amount || ''),
      max_uses: String(d.max_uses || ''),
      single_use_per_customer: d.single_use_per_customer,
      starts_at: d.starts_at ? new Date(d.starts_at).toISOString().slice(0, 16) : '',
      expires_at: d.expires_at ? new Date(d.expires_at).toISOString().slice(0, 16) : '',
      description: d.description || '',
      is_active: d.is_active
    })
    setIsModalOpen(true)
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let str = ''
    for (let i = 0; i < 4; i++) str += chars.charAt(Math.floor(Math.random() * chars.length))
    setForm({ ...form, code: `LABEL${str}` })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSubmitting(true)
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const json = await res.json()
      if (res.ok) {
        setIsModalOpen(false)
        fetchDiscounts()
      } else {
        setFormError(json.error || 'Failed to create discount')
      }
    } catch (err) {
      console.error(err)
      setFormError('An unexpected error occurred')
    }
    setFormSubmitting(false)
  }

  // Live preview calculations
  const previewOrderVal = 1500
  let previewDiscount = 0
  if (form.type === 'percentage') {
    previewDiscount = (previewOrderVal * (Number(form.value) || 0)) / 100
  } else if (form.type === 'flat') {
    previewDiscount = Math.min(Number(form.value) || 0, previewOrderVal)
  }
  const pays = Math.max(previewOrderVal - previewDiscount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Discounts</h1>
          <p className="text-muted-foreground mt-1 text-gray-600">
            Create and manage promotional codes.
          </p>
        </div>
        <button onClick={() => {
          setForm({ code: '', type: 'percentage', value: '', min_order_amount: '', max_uses: '', single_use_per_customer: false, starts_at: '', expires_at: '', description: '', is_active: true })
          setIsModalOpen(true)
        }} className="flex items-center space-x-2 bg-[#1C3829] text-white px-4 py-2 rounded-md hover:bg-[#24472F] transition-colors">
          <Plus className="h-4 w-4" />
          <span>Create Discount</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex space-x-1 border-b border-gray-200 pb-1 overflow-x-auto w-full md:w-auto">
          {['all', 'active', 'scheduled', 'expired', 'inactive'].map(t => (
            <button
              key={t}
              onClick={() => setStatusTab(t)}
              className={`px-4 py-2 text-sm capitalize whitespace-nowrap transition-colors border-b-2 -mb-[5px] ${statusTab === t ? 'border-[#c9a84c] text-[#c9a84c] font-medium' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ffffff]/40" />
          <input
            type="text"
            placeholder="Search code..."
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#c9a84c] w-full text-sm bg-[#faf7f2]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#faf7f2] border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Type & Value</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Uses / Max</th>
                <th className="px-4 py-3">Valid Period</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff]/5">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading discounts...</td></tr>
              ) : discounts.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No discounts found.</td></tr>
              ) : discounts.map(d => {
                const isExpanded = expandedRow === d.id
                return (
                  <React.Fragment key={d.id}>
                    <tr onClick={() => handleRowClick(d.id)} className={`hover:bg-[#faf7f2]/50 transition-colors cursor-pointer ${isExpanded ? 'bg-[#faf7f2]/30' : ''}`}>
                      <td className="px-4 py-3 font-mono font-bold text-[#c9a84c]">{d.code}</td>
                      <td className="px-4 py-3">
                        {d.status === 'active' && <span className="inline-flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-medium border border-green-100"><CheckCircle className="h-3 w-3" /><span>Active</span></span>}
                        {d.status === 'scheduled' && <span className="inline-flex items-center space-x-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium border border-blue-100"><Clock className="h-3 w-3" /><span>Scheduled</span></span>}
                        {d.status === 'expired' && <span className="inline-flex items-center space-x-1 text-gray-500 bg-white/5 px-2 py-0.5 rounded text-xs font-medium border border-gray-200"><XCircle className="h-3 w-3" /><span>Expired</span></span>}
                        {d.status === 'inactive' && <span className="inline-flex items-center space-x-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-medium border border-red-100"><XCircle className="h-3 w-3" /><span>Inactive</span></span>}
                      </td>
                      <td className="px-4 py-3">
                        {d.type === 'percentage' && `${d.value}% Off`}
                        {d.type === 'flat' && `${formatIndianCurrency(d.value)} Off`}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{d.min_order_amount ? formatIndianCurrency(d.min_order_amount) : 'None'}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{d.total_uses}</span> <span className="text-gray-400">/ {d.max_uses || '8'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {d.starts_at && <div>From: {new Date(d.starts_at).toLocaleDateString()}</div>}
                        {d.expires_at && <div>To: {new Date(d.expires_at).toLocaleDateString()}</div>}
                        {!d.starts_at && !d.expires_at && 'Forever'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <button onClick={(e) => handleToggleActive(d.id, d.is_active, e)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title={d.is_active ? 'Deactivate' : 'Activate'}>
                            <Settings2 className="h-4 w-4" />
                          </button>
                          <button onClick={(e) => handleDuplicate(d, e)} className="p-1.5 text-gray-400 hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 rounded transition-colors" title="Duplicate">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button disabled={d.used_count > 0} onClick={(e) => handleDelete(d.id, e)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400" title={d.used_count > 0 ? "Cannot delete used coupon" : "Delete"}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDED DETAIL ROW */}
                    {isExpanded && (
                      <tr className="bg-[#faf7f2]/50 border-b border-gray-100">
                        <td colSpan={7} className="px-6 py-4">
                          {detailLoading ? (
                            <div className="text-sm text-gray-400 p-4">Loading details...</div>
                          ) : detailData ? (
                            <div className="space-y-4">
                              <div className="flex space-x-6">
                                <div className="bg-white p-4 rounded-lg border border-gray-200 flex-1">
                                  <p className="text-xs text-gray-500">Total Uses</p>
                                  <p className="text-xl font-bold mt-1">{detailData.stats.total_uses}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200 flex-1">
                                  <p className="text-xs text-gray-500">Total Discount Given</p>
                                  <p className="text-xl font-bold mt-1 text-[#c9a84c]">{formatIndianCurrency(detailData.stats.total_discount_given)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200 flex-1">
                                  <p className="text-xs text-gray-500">Avg Cart Size (with coupon)</p>
                                  <p className="text-xl font-bold mt-1">{formatIndianCurrency(detailData.stats.avg_cart_size)}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold text-sm mb-2 text-gray-900">Recent Uses (up to 10)</h4>
                                {detailData.uses?.length > 0 ? (
                                  <table className="w-full text-xs text-left bg-white border border-gray-200 rounded-md overflow-hidden">
                                    <thead className="bg-[#faf7f2] border-b border-gray-200">
                                      <tr>
                                        <th className="px-3 py-2">Date</th>
                                        <th className="px-3 py-2">Customer</th>
                                        <th className="px-3 py-2">Order #</th>
                                        <th className="px-3 py-2 text-right">Cart Total</th>
                                        <th className="px-3 py-2 text-right">Discount Applied</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#ffffff]/5">
                                      {detailData.uses.map((u: any) => (
                                        <tr key={u.id}>
                                          <td className="px-3 py-2 text-gray-600">{new Date(u.used_at).toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short'})}</td>
                                          <td className="px-3 py-2 font-medium">{u.customer_name} <span className="text-xs font-normal text-gray-400 ml-1">({u.customer_email})</span></td>
                                          <td className="px-3 py-2 text-blue-600 hover:underline"><a href={`/admin/orders/${u.order_id}`}>{u.order_number}</a></td>
                                          <td className="px-3 py-2 text-right">{formatIndianCurrency(u.cart_total)}</td>
                                          <td className="px-3 py-2 text-right text-green-600 font-medium">{formatIndianCurrency(u.discount_applied)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p className="text-sm text-gray-400 italic">No uses recorded yet.</p>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#faf7f2] sticky top-0 z-10">
              <h3 className="font-bold text-gray-900 text-lg">Create Discount</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center space-x-2 border border-red-100">
                  <AlertTriangle className="h-4 w-4" /><span>{formError}</span>
                </div>
              )}

              {/* Live Preview */}
              <div className="bg-[#faf7f2] p-4 rounded-lg border border-[#c9a84c]/30 text-center">
                <span className="text-sm text-gray-600">Customer applies </span>
                <strong className="font-mono text-[#c9a84c]">{form.code || '[CODE]'}</strong>
                <span className="text-sm text-gray-600"> on ₹1,500 order </span>
                <span className="text-sm">
                  saves <strong className="text-green-600">₹{previewDiscount}</strong> | pays <strong>₹{pays}</strong>
                </span>
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Discount Code</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:border-[#c9a84c] focus:outline-none font-mono uppercase"
                    placeholder="E.g. SUMMER20"
                  />
                  <button type="button" onClick={generateCode} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-[#faf7f2] text-sm font-medium transition-colors">
                    Generate Random
                  </button>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Discount Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'percentage', label: 'Percentage', icon: Percent },
                    { id: 'flat', label: 'Flat Amount', icon: DollarSign },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm({ ...form, type: t.id, value: t.id === 'free_shipping' ? '' : form.value })}
                      className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${form.type === t.id ? 'border-[#c9a84c] bg-[#c9a84c]/5 text-[#c9a84c]' : 'border-gray-200 hover:border-gray-300 text-gray-500'}`}
                    >
                      <t.icon className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Discount Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{form.type === 'flat' ? '₹' : '%'}</span>
                    <input
                      type="number"
                      required
                      min="1"
                      max={form.type === 'percentage' ? 100 : undefined}
                      value={form.value}
                      onChange={e => setForm({ ...form, value: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:border-[#c9a84c] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_order_amount}
                    onChange={e => setForm({ ...form, min_order_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#c9a84c] focus:outline-none"
                    placeholder="0 = No minimum"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Usage Limits</h4>
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Max total uses</label>
                    <input
                      type="number"
                      min="1"
                      value={form.max_uses}
                      onChange={e => setForm({ ...form, max_uses: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#c9a84c] focus:outline-none"
                      placeholder="Leave blank for unlimited"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-5">
                    <input
                      type="checkbox"
                      id="single_use"
                      checked={form.single_use_per_customer}
                      onChange={e => setForm({ ...form, single_use_per_customer: e.target.checked })}
                      className="rounded border-gray-300 text-[#c9a84c] focus:ring-[#c9a84c]"
                    />
                    <label htmlFor="single_use" className="text-sm text-gray-700">Limit to one use per customer</label>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Active Dates (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={e => setForm({ ...form, starts_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#c9a84c] focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={form.expires_at}
                      onChange={e => setForm({ ...form, expires_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#c9a84c] focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-900 mb-1">Internal Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#c9a84c] focus:outline-none"
                  placeholder="e.g. Summer Sale 2026 Influencer Code"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-[#c9a84c] focus:ring-[#c9a84c]"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-900">Active immediately</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={formSubmitting} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="px-4 py-2 text-sm font-medium bg-[#1C3829] text-white rounded-md hover:bg-[#24472F] transition-colors disabled:opacity-50">
                  {formSubmitting ? 'Saving...' : 'Save Discount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
