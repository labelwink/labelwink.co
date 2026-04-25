'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/admin/Toast'
import { Loader2, X, Crown, Upload } from 'lucide-react'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const TABS = ['Basic Info', 'Pricing', 'Variants & Stock', 'Specifications', 'Images', 'SEO']

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ProductForm({ product }: { product?: any }) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [tab, setTab] = useState(0)
  const [saving, setSaving] = useState(false)

  // Basic Info
  const [name, setName] = useState(product?.name || '')
  const [category, setCategory] = useState(product?.category || '')
  const [shortDesc, setShortDesc] = useState(product?.short_description || '')
  const [description, setDescription] = useState(product?.description || '')
  const [tags, setTags] = useState<string[]>(product?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [occasions, setOccasions] = useState<string[]>(product?.occasion || [])

  // Pricing
  const [mrp, setMrp] = useState(product?.mrp || '')
  const [price, setPrice] = useState(product?.price || '')
  const [firstOrderDiscount, setFirstOrderDiscount] = useState(product?.first_order_discount || false)
  const discount = mrp && price ? Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100) : 0

  // Variants
  const [enabledSizes, setEnabledSizes] = useState<string[]>(
    product?.product_variants?.map((v: any) => v.size) || []
  )
  const [stockMap, setStockMap] = useState<Record<string, number>>(
    Object.fromEntries((product?.product_variants || []).map((v: any) => [v.size, v.stock_qty]))
  )
  const [skuMap, setSkuMap] = useState<Record<string, string>>(
    Object.fromEntries((product?.product_variants || []).map((v: any) => [v.size, v.sku || '']))
  )
  const [lowStockThreshold, setLowStockThreshold] = useState(5)

  // Specs
  const [specs, setSpecs] = useState<Record<string, string>>(product?.specifications || {})

  // Images
  const [images, setImages] = useState<Array<{ url: string; alt: string }>>(
    (product?.images || []).map((img: any) => typeof img === 'string' ? { url: img, alt: '' } : img)
  )
  const [uploading, setUploading] = useState<number[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  // SEO
  const [metaTitle, setMetaTitle] = useState(product?.meta_title || '')
  const [metaDesc, setMetaDesc] = useState(product?.meta_description || '')
  const [slug, setSlug] = useState(product?.slug || '')
  const [slugEdited, setSlugEdited] = useState(!!product?.slug)

  useEffect(() => {
    if (!slugEdited && name) setSlug(slugify(name))
    if (!metaTitle && name) setMetaTitle(`${name} | Label Wink`)
    if (!metaDesc && shortDesc) setMetaDesc(shortDesc)
  }, [name, shortDesc, slugEdited, metaTitle, metaDesc])

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    const remaining = 8 - images.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) return showToast('Maximum 8 images allowed', 'error')

    const indices = toUpload.map((_, i) => images.length + i)
    setUploading(indices)
    setImages(prev => [...prev, ...toUpload.map(() => ({ url: '', alt: '' }))])

    for (let i = 0; i < toUpload.length; i++) {
      const fd = new FormData()
      fd.append('file', toUpload[i])
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const { url } = await res.json()
        setImages(prev => {
          const next = [...prev]
          next[indices[i]] = { url, alt: '' }
          return next
        })
      } catch {
        setImages(prev => prev.filter((_, idx) => idx !== indices[i]))
      }
    }
    setUploading([])
  }

  const save = async (visible: boolean) => {
    if (!name.trim()) { showToast('Product name is required', 'error'); setTab(0); return }
    if (!price || !mrp) { showToast('Price and MRP are required', 'error'); setTab(1); return }
    if (!slug.trim()) { showToast('Slug is required', 'error'); setTab(5); return }

    setSaving(true)
    const variants = enabledSizes.map(size => ({
      size,
      stock_qty: stockMap[size] || 0,
      sku: skuMap[size] || '',
      low_stock_threshold: lowStockThreshold,
    }))

    const body = {
      name, slug, category, short_description: shortDesc, description,
      tags, occasion: occasions, mrp: Number(mrp), price: Number(price),
      first_order_discount: firstOrderDiscount, images, specifications: specs,
      visible, meta_title: metaTitle, meta_description: metaDesc, variants,
    }

    try {
      const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products'
      const method = product ? 'PATCH' : 'POST'
      console.log('Submitting product data:', JSON.stringify(body, null, 2))
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.error('Product save error response:', errData)
        throw new Error(errData.error || 'Save failed')
      }
      showToast('Product saved ✓', 'success')
      setTimeout(() => router.push('/admin/products'), 800)
    } catch (err: any) {
      showToast(err.message || 'Save failed. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {ToastComponent}

      {/* Tab bar */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
        <div className="flex overflow-x-auto border-b border-[#e5e7eb]">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                tab === i ? 'border-b-2 border-[#1b3a34] text-[#1b3a34]' : 'text-[#6b7280] hover:text-[#1a1a1a]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TAB 0: Basic Info */}
          {tab === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Product Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} maxLength={100}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                  placeholder="e.g. Floral Kurta Set" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] bg-white">
                  <option value="">Select category</option>
                  <option>Kurtis</option><option>Co-ord Sets</option><option>Festive</option><option>Casual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Short Description</label>
                <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)} maxLength={160} rows={2}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-none"
                  placeholder="Brief description shown on product cards" />
                <p className="text-xs text-[#6b7280] mt-1">{shortDesc.length}/160</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Full Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-none"
                  placeholder="Detailed product description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-[#1b3a34]/10 text-[#1b3a34] text-xs px-3 py-1 rounded-full">
                      {tag}
                      <button onClick={() => setTags(tags.filter(t => t !== tag))}><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { setTags([...tags, tagInput.trim()]); setTagInput(''); e.preventDefault() }}}
                  className="border border-[#e5e7eb] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                  placeholder="Type tag + Enter" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Occasion</label>
                <div className="flex flex-wrap gap-3">
                  {['Casual', 'Festive', 'Party', 'Office', 'Wedding'].map(o => (
                    <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={occasions.includes(o)}
                        onChange={e => setOccasions(e.target.checked ? [...occasions, o] : occasions.filter(x => x !== o))}
                        className="rounded border-gray-300 text-[#1b3a34] focus:ring-[#1b3a34]" />
                      {o}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Pricing */}
          {tab === 1 && (
            <div className="space-y-5 max-w-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">MRP (₹) *</label>
                  <input type="number" value={mrp} onChange={e => setMrp(e.target.value)} min="0"
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Selling Price (₹) *</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} min="0"
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
                </div>
              </div>
              {discount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="bg-[#16a34a] text-white text-sm px-3 py-1 rounded-full font-medium">{discount}% off</span>
                  <span className="text-[#6b7280] text-sm">Customer saves ₹{(Number(mrp) - Number(price)).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFirstOrderDiscount(!firstOrderDiscount)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${firstOrderDiscount ? 'bg-[#1b3a34]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${firstOrderDiscount ? 'translate-x-6' : ''}`} />
                </button>
                <label className="text-sm font-medium text-[#1a1a1a]">First Order Discount</label>
              </div>
            </div>
          )}

          {/* TAB 2: Variants */}
          {tab === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-3">Available Sizes</label>
                <div className="flex gap-2 flex-wrap">
                  {SIZES.map(size => (
                    <button key={size} type="button"
                      onClick={() => setEnabledSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        enabledSizes.includes(size) ? 'bg-[#1b3a34] text-white border-[#1b3a34]' : 'bg-white text-gray-600 border-gray-300 hover:border-[#1b3a34]'
                      }`}
                    >{size}</button>
                  ))}
                </div>
              </div>

              {enabledSizes.length > 0 && (
                <div className="space-y-3">
                  {enabledSizes.map(size => (
                    <div key={size} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-[#e5e7eb]">
                      <span className="w-12 text-sm font-bold text-[#1b3a34]">{size}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[#6b7280]">Qty:</label>
                        <input type="number" min="0" value={stockMap[size] ?? 0}
                          onChange={e => setStockMap(p => ({ ...p, [size]: Number(e.target.value) }))}
                          className="w-24 border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[#6b7280]">SKU:</label>
                        <input value={skuMap[size] || ''} onChange={e => setSkuMap(p => ({ ...p, [size]: e.target.value }))}
                          className="w-36 border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                          placeholder="e.g. LW-XS-001" />
                      </div>
                    </div>
                  ))}
                  <p className="text-sm text-[#6b7280]">
                    Total stock: <strong className="text-[#1a1a1a]">{enabledSizes.reduce((s, sz) => s + (stockMap[sz] || 0), 0)}</strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Low Stock Threshold</label>
                <input type="number" min="1" value={lowStockThreshold} onChange={e => setLowStockThreshold(Number(e.target.value))}
                  className="w-32 border border-[#e5e7eb] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
              </div>
            </div>
          )}

          {/* TAB 3: Specifications */}
          {tab === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Material/Fabric', 'Color Name', 'Style', 'Sleeve Type', 'Closure', 'Length (inches)',
                'Bottom Length (inches)', 'Pant Type', 'Wash Care', 'Additional Notes'
              ].map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">{field}</label>
                  {field.includes('Care') || field.includes('Notes') ? (
                    <textarea value={specs[field] || ''} onChange={e => setSpecs(p => ({ ...p, [field]: e.target.value }))} rows={2}
                      className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-none" />
                  ) : (
                    <input value={specs[field] || ''} onChange={e => setSpecs(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
                  )}
                </div>
              ))}
              {['Lining', 'Pockets', 'Feeding Friendly'].map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-2">{field}</label>
                  <div className="flex gap-3">
                    {(field === 'Feeding Friendly' ? ['Yes', 'No', 'N/A'] : ['Yes', 'No']).map(opt => (
                      <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input type="radio" name={field} checked={specs[field] === opt}
                          onChange={() => setSpecs(p => ({ ...p, [field]: opt }))}
                          className="text-[#1b3a34] focus:ring-[#1b3a34]" />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Images */}
          {tab === 4 && (
            <div className="space-y-4">
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-[#1b3a34] hover:bg-green-50/30 transition-colors"
              >
                <Upload size={32} className="mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-[#1a1a1a]">Drop product images here or click to upload</p>
                <p className="text-xs text-[#6b7280] mt-1">Supports JPG, PNG, WebP — Max 8 images, 5MB each</p>
                <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative border border-[#e5e7eb] rounded-xl overflow-hidden">
                      {i === 0 && (
                        <div className="absolute top-2 left-2 bg-[#1b3a34] text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                          <Crown size={10} /> Cover
                        </div>
                      )}
                      <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-0.5 z-10 hover:bg-red-700">
                        <X size={14} />
                      </button>
                      {uploading.includes(i) ? (
                        <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                          <Loader2 size={24} className="animate-spin text-[#1b3a34]" />
                        </div>
                      ) : (
                        <img src={img.url} alt="" className="w-full aspect-[3/4] object-cover" />
                      )}
                      <input value={img.alt} onChange={e => setImages(prev => prev.map((im, idx) => idx === i ? { ...im, alt: e.target.value } : im))}
                        className="w-full px-2 py-1.5 text-xs border-t border-[#e5e7eb] focus:outline-none"
                        placeholder="Alt text" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SEO */}
          {tab === 5 && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Meta Title</label>
                <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Meta Description</label>
                <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)} maxLength={160} rows={3}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-none" />
                <p className="text-xs text-[#6b7280] mt-1">{metaDesc.length}/160</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">URL Slug</label>
                <input value={slug} onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
                <p className="text-xs text-[#6b7280] mt-1">labelwink.co/products/{slug || '…'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] px-6 py-4 flex items-center justify-end gap-3 z-40">
        <button onClick={() => save(false)} disabled={saving}
          className="px-6 py-2.5 border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors">
          Save as Draft
        </button>
        <button onClick={() => save(true)} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1b3a34] hover:bg-[#234d44] text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {product ? 'Update Product' : 'Publish Product'}
        </button>
      </div>
    </div>
  )
}
