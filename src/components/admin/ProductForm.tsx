'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/admin/Toast'
import { Loader2, X, Crown, Upload, Star } from 'lucide-react'
import ProductImageUpload from './ProductImageUpload'

// Categories and attributes are now DB-driven — no hardcoded arrays
const GENDERS = ['Women', 'Men', 'Unisex', 'Girls', 'Boys']
const SEASONS = ['All Season', 'Summer', 'Winter', 'Monsoon', 'Festive']

const TABS = ['Basic Info', 'Pricing', 'Variants & Stock', 'Specifications', 'Images', 'SEO']

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ProductForm({ product }: { product?: any }) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [tab, setTab] = useState(0)
  const [saving, setSaving] = useState(false)

  // DB-driven attributes
  const [categories, setCategories] = useState<{id:string,name:string,slug:string,is_active:boolean}[]>([])
  const [attrOptions, setAttrOptions] = useState<{
    sizes: {id:string,label:string,value:string}[],
    colors: {id:string,label:string,value:string}[],
    fabrics: {id:string,label:string,value:string}[],
    sleeve_types: {id:string,label:string,value:string}[],
    occasions: {id:string,label:string,value:string}[],
    fits: {id:string,label:string,value:string}[],
    patterns: {id:string,label:string,value:string}[],
  }>({ sizes:[],colors:[],fabrics:[],sleeve_types:[],occasions:[],fits:[],patterns:[] })
  const [attrLoading, setAttrLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/categories').then(r => r.json()),
      fetch('/api/admin/attributes').then(r => r.json()),
    ]).then(([catRes, attrRes]) => {
      setCategories(catRes.categories ?? [])
      setAttrOptions({
        sizes:        attrRes.sizes        ?? [],
        colors:       attrRes.colors       ?? [],
        fabrics:      attrRes.fabrics      ?? [],
        sleeve_types: attrRes.sleeve_types ?? [],
        occasions:    attrRes.occasions    ?? [],
        fits:         attrRes.fits         ?? [],
        patterns:     attrRes.patterns     ?? [],
      })
      setAttrLoading(false)
    }).catch(console.error)
  }, [])

  // Basic Info
  const [name, setName] = useState(product?.name || '')
  const [categoryId, setCategoryId] = useState(product?.category_id || '')
  const [shortDesc, setShortDesc] = useState(product?.short_description || '')
  const [description, setDescription] = useState(product?.description || '')
  const [tags, setTags] = useState<string[]>(product?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [occasions, setOccasions] = useState<string[]>(product?.occasion || [])
  const [colour, setColour]   = useState(product?.colour || '')
  const [fabric, setFabric]   = useState(product?.fabric || '')
  const [fit, setFit]         = useState(product?.fit || '')
  const [season, setSeason]   = useState(product?.season || '')
  const [gender, setGender]   = useState(product?.gender || '')
  const [collection, setCollection] = useState(product?.collection || '')
  const [hsnCode, setHsnCode] = useState(product?.hsn_code || '')
  const [weight, setWeight]   = useState(product?.weight_grams || '')

  // Pricing
  const [mrp, setMrp] = useState(product?.mrp || '')
  const [price, setPrice] = useState(product?.price || '')
  const [firstOrderDiscount, setFirstOrderDiscount] = useState(product?.first_order_discount || false)
  const discount = mrp && price ? Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100) : 0

  // Variants
  const [variants, setVariants] = useState<Array<{
    id: string
    size: string
    color: string
    fabric: string
    sku: string
    price: number
    compare_at_price: number
    stock: number
    is_active: boolean
  }>>(product?.product_variants?.map((v: any) => ({
    id: v.id || crypto.randomUUID(),
    size: v.size || '',
    color: v.color || '',
    fabric: v.fabric || '',
    sku: v.sku || '',
    price: v.price || 0,
    compare_at_price: v.compare_at_price || 0,
    stock: v.stock_qty || 0,
    is_active: v.is_active ?? true
  })) || [])

  // Specs
  const [specs, setSpecs] = useState<Record<string, string>>(product?.specifications || {})

  // Images — managed by system-wide ProductImageUpload
  const [images, setImages] = useState<string[]>(
    (product?.product_images || [])
      .sort((a: any, b: any) => {
        if (a.is_cover) return -1
        if (b.is_cover) return 1
        return a.sort_order - b.sort_order
      })
      .map((img: any) => img.url)
  )

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

  // Variant management helpers
  const addVariant = () => {
    const tempId = crypto.randomUUID()
    setVariants([...variants, {
      id: tempId,
      size: '',
      color: colour || '',
      fabric: fabric || '',
      sku: '',
      price: Number(price) || 0,
      compare_at_price: Number(mrp) || 0,
      stock: 0,
      is_active: true
    }])
  }

  const updateVariant = (idx: number, field: string, value: any) => {
    const updated = [...variants]
    updated[idx] = { ...updated[idx], [field]: value }
    setVariants(updated)
  }

  const removeVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx))
  }

  const generateAllSizeVariants = () => {
    const baseSlug = slug || slugify(name) || 'product'
    const newVariants = attrOptions.sizes.map(size => {
      const timestamp = Date.now().toString(16).toUpperCase().slice(-4)
      const random = Math.random().toString(36).substring(2, 5).toUpperCase()
      return {
        id: crypto.randomUUID(),
        size: size.value,
        color: colour,
        fabric: fabric,
        sku: `LW-${size.value}-${baseSlug.toUpperCase().slice(0, 8)}-${timestamp}${random}`,
        price: Number(price) || 0,
        compare_at_price: Number(mrp) || 0,
        stock: 0,
        is_active: true
      }
    })
    setVariants(newVariants)
  }

  // Real-time SKU validation
  const [skuErrors, setSkuErrors] = useState<Record<string, string>>({})
  const [checkingSkus, setCheckingSkus] = useState<Record<string, boolean>>({})

  const validateSKU = async (sku: string, variantId: string) => {
    if (!sku || sku.length < 3) return
    
    setCheckingSkus(prev => ({ ...prev, [variantId]: true }))
    try {
      const res = await fetch(`/api/admin/products/check-sku?sku=${encodeURIComponent(sku)}&productId=${product?.id || ''}`)
      const data = await res.json()
      if (!data.available) {
        setSkuErrors(prev => ({ ...prev, [variantId]: data.message || 'Already in use' }))
      } else {
        setSkuErrors(prev => {
          const next = { ...prev }
          delete next[variantId]
          return next
        })
      }
    } catch (err) {
      console.error('SKU check failed:', err)
    } finally {
      setCheckingSkus(prev => ({ ...prev, [variantId]: false }))
    }
  }

  // Debounced SKU check
  useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {}
    variants.forEach(v => {
      if (v.sku && !skuErrors[v.id]) {
        timers[v.id] = setTimeout(() => validateSKU(v.sku, v.id), 800)
      }
    })
    return () => Object.values(timers).forEach(clearTimeout)
  }, [variants.map(v => v.sku).join(',')])

  const save = async (visible: boolean) => {
    // Basic validation
    if (!name.trim()) { 
      showToast('Product name is required', 'error')
      setTab(0)
      return 
    }
    if (!categoryId) {
      showToast('Please select a category', 'error')
      setTab(0)
      return
    }
    if (!price || !mrp) { 
      showToast('Price and MRP are required', 'error')
      setTab(1)
      return 
    }
    if (!slug.trim()) { 
      showToast('Slug is required', 'error')
      setTab(5)
      return 
    }

    // SKU Error check
    const hasSkuErrors = Object.keys(skuErrors).length > 0
    if (hasSkuErrors) {
      showToast('Please resolve SKU conflicts in Variants tab', 'error')
      setTab(2)
      return
    }

    if (variants.length === 0) {
      showToast('At least one variant is required', 'error')
      setTab(2)
      return
    }

    // Check if any variant is missing size
    const missingSize = variants.find(v => !v.size)
    if (missingSize) {
      showToast('All variants must have a size', 'error')
      setTab(2)
      return
    }

    setSaving(true)
    const body = {
      name, slug, category_id: categoryId || null, short_description: shortDesc, description,
      tags, occasion: occasions, mrp: Number(mrp), price: Number(price),
      first_order_discount: firstOrderDiscount,
      fabric, fit, season, gender,
      collection,
      hsn_code: hsnCode || null,
      weight_grams: weight ? Number(weight) : null,
      images: images.map((url, i) => ({
        url,
        alt: `${name} - Image ${i + 1}`,
        is_cover: i === 0,
        sort_order: i,
      })),
      specifications: specs,
      visible, status: visible ? 'published' : 'draft',
      meta_title: metaTitle, meta_description: metaDesc,
      variants: variants.map(v => ({
        id: v.id,
        size: v.size,
        color: v.color || colour,
        fabric: v.fabric || fabric,
        sku: v.sku.trim().toUpperCase(),
        price: Number(v.price) || Number(price) || 0,
        compare_at_price: Number(v.compare_at_price) || Number(mrp) || 0,
        low_stock_threshold: 5,
        stock_qty: Number(v.stock) || 0,
        is_active: v.is_active
      }))
    }

    try {
      const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products'
      const method = product ? 'PATCH' : 'POST'
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body), 
        credentials: 'include' 
      })
      
      const data = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        if (res.status === 409) {
          showToast(data.error || 'SKU or Slug conflict. Please check your entries.', 'error')
          return
        }
        throw new Error(data.error || 'Save failed')
      }
      
      showToast(product ? 'Product updated successfully ✓' : 'Product published successfully ✓', 'success')
      setTimeout(() => router.push('/admin/products'), 1000)
    } catch (err: any) {
      console.error('Save error:', err)
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
              type="button"
              onClick={() => setTab(i)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors border-b-2 ${
                tab === i ? 'border-[#1C3829] text-[#1C3829] font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'
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
                <label className="admin-label">Product Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} maxLength={100}
                  className="admin-input"
                  placeholder="e.g. Floral Kurta Set" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] bg-white">
                    <option value="">Select category</option>
                    {categories.filter(c => c.is_active).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
                  <input value={collection} onChange={e => setCollection(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                    placeholder="e.g. Summer Bloom 2025" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)} maxLength={160} rows={2}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-none"
                  placeholder="Brief description shown on product cards" />
                <p className="text-xs text-[#6b7280] mt-1">{shortDesc.length}/160</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-none"
                  placeholder="Detailed product description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Colour</label>
                  <input value={colour} onChange={e => setColour(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                    placeholder="e.g. Rust Orange" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fabric</label>
                  <input value={fabric} onChange={e => setFabric(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                    placeholder="e.g. Cotton Blend" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fit</label>
                  <select value={fit} onChange={e => setFit(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] bg-white">
                    <option value="">Select fit</option>
                    {attrOptions.fits.map(f => <option key={f.id} value={f.label}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select value={gender} onChange={e => setGender(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] bg-white">
                    <option value="">Select</option>
                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                  <select value={season} onChange={e => setSeason(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] bg-white">
                    <option value="">Select</option>
                    {SEASONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                  <input value={hsnCode} onChange={e => setHsnCode(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                    placeholder="e.g. 6211" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label>
                  <input type="number" min="0" value={weight} onChange={e => setWeight(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                    placeholder="e.g. 350" />
                </div>
              </div>
              <div>
                <label className="admin-label">Occasion</label>
                <select
                  value={Array.isArray(occasions) ? occasions[0] ?? '' : occasions}
                  onChange={e => setOccasions([e.target.value])}
                  className="admin-select">
                  <option value="">Select occasion</option>
                  {attrOptions.occasions.map(o => (
                    <option key={o.id} value={o.label}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB 1: Pricing */}
          {tab === 1 && (
            <div className="space-y-5 max-w-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹) *</label>
                  <input type="number" value={mrp} onChange={e => setMrp(e.target.value)} min="0"
                    className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
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
                <label className="text-sm font-medium text-gray-700">First Order Discount</label>
              </div>
            </div>
          )}

          {/* TAB 2: Variants & Stock */}
          {tab === 2 && (
            <div className="space-y-6">
              {attrLoading ? (
                <div className="text-center py-8 text-[#9aab9e]">Loading attributes...</div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-700">Product Variants</h3>
                    <div className="flex gap-2">
                      <button type="button" onClick={generateAllSizeVariants}
                        className="px-4 py-2 bg-[#1b3a34] text-white rounded-lg text-sm font-medium hover:bg-[#2a4a42] transition-colors">
                        Generate All Sizes
                      </button>
                      <button type="button" onClick={addVariant}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-[#f5f2ec] transition-colors">
                        Add Variant
                      </button>
                    </div>
                  </div>

                  {variants.length === 0 ? (
                    <p className="text-[#9aab9e] text-center py-8">No variants added yet. Click "Generate All Sizes" or "Add Variant" to start.</p>
                  ) : (
                    <div className="space-y-4">
                      {variants.map((variant, idx) => (
                        <div key={variant.id} className="p-4 bg-gray-50 rounded-xl border border-[#e5e7eb]">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-medium text-gray-700">Variant {idx + 1}</span>
                            <button type="button" onClick={() => removeVariant(idx)}
                              className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-[#6b7280] mb-1">Size</label>
                              <select value={variant.size} onChange={e => updateVariant(idx, 'size', e.target.value)}
                                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]">
                                <option value="">Select Size</option>
                                {attrOptions.sizes.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#6b7280] mb-1">Color</label>
                              <select value={variant.color} onChange={e => updateVariant(idx, 'color', e.target.value)}
                                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]">
                                <option value="">Select Color</option>
                                {attrOptions.colors.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#6b7280] mb-1">Fabric</label>
                              <select value={variant.fabric} onChange={e => updateVariant(idx, 'fabric', e.target.value)}
                                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]">
                                <option value="">Select Fabric</option>
                                {attrOptions.fabrics.map(f => <option key={f.id} value={f.label}>{f.label}</option>)}
                              </select>
                            </div>
                            <div className="lg:col-span-2">
                              <label className="block text-xs font-medium text-[#6b7280] mb-1">SKU</label>
                              <div className="relative">
                                <input value={variant.sku} onChange={e => updateVariant(idx, 'sku', e.target.value.toUpperCase())}
                                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${
                                    skuErrors[variant.id] 
                                      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                                      : 'border-[#e5e7eb] focus:ring-[#1b3a34]'
                                  }`}
                                  placeholder="e.g. LW-XS-001" />
                                {checkingSkus[variant.id] && (
                                  <div className="absolute right-3 top-2.5">
                                    <Loader2 size={14} className="animate-spin text-gray-400" />
                                  </div>
                                )}
                              </div>
                              {skuErrors[variant.id] && (
                                <p className="text-[10px] text-red-500 mt-1 font-medium">{skuErrors[variant.id]}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#6b7280] mb-1">Price</label>
                              <input type="number" min="0" value={variant.price} onChange={e => updateVariant(idx, 'price', Number(e.target.value))}
                                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#6b7280] mb-1">Compare at Price</label>
                              <input type="number" min="0" value={variant.compare_at_price} onChange={e => updateVariant(idx, 'compare_at_price', Number(e.target.value))}
                                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#6b7280] mb-1">Stock</label>
                              <input type="number" min="0" value={variant.stock} onChange={e => updateVariant(idx, 'stock', Number(e.target.value))}
                                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={variant.is_active} onChange={e => updateVariant(idx, 'is_active', e.target.checked)}
                                className="text-[#1b3a34] focus:ring-[#1b3a34]" />
                              <label className="text-xs font-medium text-[#6b7280]">Active</label>
                            </div>
                          </div>
                        </div>
                      ))}
                      <p className="text-sm text-[#6b7280]">
                        Total variants: <strong className="text-gray-700">{variants.length}</strong> |
                        Total stock: <strong className="text-gray-700">{variants.reduce((s, v) => s + v.stock, 0)}</strong>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: Specifications */}
          {tab === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="admin-field">
                  <label className="admin-label">Fabric</label>
                  <select name="fabric" value={fabric} onChange={e => setFabric(e.target.value)} className="admin-select">
                    <option value="">Select fabric</option>
                    {attrOptions.fabrics.map(f => <option key={f.id} value={f.label}>{f.label}</option>)}
                  </select>
                </div>
                <div className="admin-field">
                  <label className="admin-label">Sleeve Type</label>
                  <select value={specs['Sleeve Type'] || ''} onChange={e => setSpecs(p => ({ ...p, 'Sleeve Type': e.target.value }))} className="admin-select">
                    <option value="">Select sleeve type</option>
                    {attrOptions.sleeve_types.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                  </select>
                </div>
                <div className="admin-field">
                  <label className="admin-label">Fit</label>
                  <select name="fit" value={fit} onChange={e => setFit(e.target.value)} className="admin-select">
                    <option value="">Select fit</option>
                    {attrOptions.fits.map(f => <option key={f.id} value={f.label}>{f.label}</option>)}
                  </select>
                </div>
                <div className="admin-field">
                  <label className="admin-label">Pattern</label>
                  <select value={specs['Pattern'] || ''} onChange={e => setSpecs(p => ({ ...p, 'Pattern': e.target.value }))} className="admin-select">
                    <option value="">Select pattern</option>
                    {attrOptions.patterns.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                  </select>
                </div>
                <div className="admin-field">
                  <label className="admin-label">Length (inches)</label>
                  <input value={specs['Length (inches)'] || ''} onChange={e => setSpecs(p => ({ ...p, 'Length (inches)': e.target.value }))}
                    placeholder="e.g. 46" className="admin-input" />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Closure</label>
                  <input value={specs['Closure'] || ''} onChange={e => setSpecs(p => ({ ...p, 'Closure': e.target.value }))}
                    placeholder="e.g. Button, Zip" className="admin-input" />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Bottom Length (inches)</label>
                  <input value={specs['Bottom Length (inches)'] || ''} onChange={e => setSpecs(p => ({ ...p, 'Bottom Length (inches)': e.target.value }))}
                    placeholder="e.g. 40" className="admin-input" />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Pant Type</label>
                  <input value={specs['Pant Type'] || ''} onChange={e => setSpecs(p => ({ ...p, 'Pant Type': e.target.value }))}
                    placeholder="e.g. Palazzo, Straight" className="admin-input" />
                </div>
              </div>
              <div className="admin-field">
                <label className="admin-label">Wash Care</label>
                <textarea value={specs['Wash Care'] || ''} onChange={e => setSpecs(p => ({ ...p, 'Wash Care': e.target.value }))} rows={2}
                  placeholder="e.g. Hand wash cold, do not bleach, dry in shade" className="admin-textarea" />
              </div>
              <div className="admin-field">
                <label className="admin-label">Additional Notes</label>
                <textarea value={specs['Additional Notes'] || ''} onChange={e => setSpecs(p => ({ ...p, 'Additional Notes': e.target.value }))} rows={2}
                  placeholder="Any other product details" className="admin-textarea" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-1">
                {(['Lining', 'Pockets', 'Feeding Friendly'] as const).map(field => (
                  <div key={field} className="admin-field">
                    <label className="admin-label">{field}</label>
                    <div className="flex gap-3 flex-wrap">
                      {(field === 'Feeding Friendly' ? ['Yes', 'No', 'N/A'] : ['Yes', 'No']).map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                          <input type="radio" name={field} checked={specs[field] === opt}
                            onChange={() => setSpecs(p => ({ ...p, [field]: opt }))}
                            className="accent-[#1C3829]" />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Images */}
          {tab === 4 && (
            <div className="space-y-4">
              <ProductImageUpload images={images} onChange={setImages} />
            </div>
          )}

          {/* TAB 5: SEO */}
          {tab === 5 && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)} maxLength={160} rows={3}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-none" />
                <p className="text-xs text-[#6b7280] mt-1">{metaDesc.length}/160</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
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
