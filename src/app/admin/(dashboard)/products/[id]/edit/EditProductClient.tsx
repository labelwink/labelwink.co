'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X, Loader2, IndianRupee, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { CloudinaryImageUploader } from '@/components/admin/CloudinaryImageUploader'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  product: any
  categories: any[]
}

export default function EditProductClient({ product, categories }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Extract images from product
  const initialImages = product.product_images
    ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
    ?.map((img: any) => img.url) || []
    
  const [images, setImages] = useState<string[]>(initialImages)

  const [formData, setFormData] = useState({
    name: product.name || '',
    slug: product.slug || '',
    description: product.description || '',
    base_price: product.base_price?.toString() || '',
    mrp: product.mrp?.toString() || '',
    category_id: product.category_id || '',
    is_active: product.is_active ?? true,
    sku: product.sku || '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (images.length === 0) return toast.error('Please upload at least one image')
    
    setLoading(true)
    try {
      // 1. Update product
      const { error: pError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          base_price: parseFloat(formData.base_price),
          mrp: parseFloat(formData.mrp),
          category_id: formData.category_id,
          is_active: formData.is_active,
          sku: formData.sku || null,
        })
        .eq('id', product.id)

      if (pError) throw pError

      // 2. Refresh images (simplest approach: delete and re-insert)
      await supabase.from('product_images').delete().eq('product_id', product.id)
      
      const imagePayloads = images.map((url, index) => ({
        product_id: product.id,
        url: url,
        is_main: index === 0,
        sort_order: index
      }))

      const { error: iError } = await supabase.from('product_images').insert(imagePayloads)
      if (iError) throw iError

      toast.success('Product updated successfully!')
      router.push('/admin/products')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    
    setDeleting(true)
    try {
      const { error } = await supabase.from('products').delete().eq('id', product.id)
      if (error) throw error
      
      toast.success('Product deleted')
      router.push('/admin/products')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-body max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <button type="button" onClick={() => router.back()} className="p-1 hover:bg-sage/10 rounded-full transition-colors text-gray-400">
               <X size={20} />
             </button>
             <h1 className="admin-page-title">Edit Product</h1>
          </div>
          <p className="text-sm text-gray-400 ml-8">Manage your piece in the collection.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleDelete} 
            disabled={deleting}
            className="rounded-xl border-red-100 text-red-500 hover:bg-red-50"
          >
            {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
          </Button>
          <Button type="submit" disabled={loading} className="bg-charcoal text-white rounded-xl px-8 h-11">
            {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* General Info */}
          <div className="bg-white border border-sage/20 p-8 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-teal rounded-full" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal">General Information</h3>
            </div>
            
            <div className="space-y-2">
              <label className="admin-section-label">Product Name <span className="text-red-500">*</span></label>
              <input 
                name="name" required value={formData.name} onChange={handleInputChange}
                className="w-full bg-sage/5 border border-sage/10 rounded-xl px-4 py-3 outline-none focus:border-teal text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="admin-section-label">Description</label>
              <textarea 
                name="description" rows={5} value={formData.description} onChange={handleInputChange}
                className="w-full bg-sage/5 border border-sage/10 rounded-xl px-4 py-3 outline-none focus:border-teal text-sm"
              />
            </div>
          </div>

          {/* Media */}
          <div className="bg-white border border-sage/20 p-8 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-teal rounded-full" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal">Visuals & Media</h3>
            </div>
            <CloudinaryImageUploader 
              onUpload={(pid, url) => setImages(prev => [...prev, url])} 
              folder="labelwink/products" 
            />
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-4">
                {images.map((url, i) => (
                  <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden border border-sage/20 relative group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-white/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                    >
                      <X size={12} />
                    </button>
                    {i === 0 && <span className="absolute bottom-1 left-1 bg-teal text-[8px] text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">Main</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Organization */}
          <div className="bg-white border border-sage/20 p-8 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-teal rounded-full" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal">Organization</h3>
            </div>

            <div className="space-y-2">
              <label className="admin-section-label">Category <span className="text-red-500">*</span></label>
              <select
                name="category_id" required value={formData.category_id} onChange={handleInputChange}
                className="w-full bg-sage/5 border border-sage/10 rounded-xl px-4 py-3 outline-none focus:border-teal text-sm appearance-none cursor-pointer"
              >
                <option value="" disabled>Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="admin-section-label">SKU (Optional)</label>
              <input 
                name="sku" value={formData.sku} onChange={handleInputChange}
                className="w-full bg-sage/5 border border-sage/10 rounded-xl px-4 py-3 outline-none focus:border-teal text-sm"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-sage/20 p-8 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-teal rounded-full" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal">Pricing</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="admin-section-label">Selling Price (₹) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    name="base_price" type="number" required value={formData.base_price} onChange={handleInputChange}
                    className="w-full bg-sage/5 border border-sage/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-teal text-sm font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="admin-section-label">MRP (₹) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    name="mrp" type="number" required value={formData.mrp} onChange={handleInputChange}
                    className="w-full bg-sage/5 border border-sage/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-teal text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white border border-sage/20 p-8 rounded-2xl shadow-sm space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-teal rounded-full" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal">Status</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_active ? 'bg-teal' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_active ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
          </div>
        </div>
      </div>
    </form>
  )
}
