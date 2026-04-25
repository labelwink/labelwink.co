'use client'

import { useState } from 'react'
import { Plus, Image as ImageIcon, Link as LinkIcon, Trash2, Save, Power, Layout } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CloudinaryImageUploader } from '@/components/admin/CloudinaryImageUploader'
import { ProductImage } from '@/components/storefront/ProductImage'
import { saveBanner, deleteBanner, toggleBanner, saveAnnouncement, toggleSection } from './actions'
import { toast } from 'sonner'

interface Props {
  initialBanners: any[]
  initialAnnouncements: any[]
  initialSections: any[]
}

export default function CMSClient({ initialBanners, initialAnnouncements, initialSections }: Props) {
  const [activeTab, setActiveTab] = useState('Banners')
  const [showAddBanner, setShowAddBanner] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [bannerForm, setBannerForm] = useState({
    title: '',
    cta_text: 'Shop Now',
    cta_link: '',
    cloudinary_public_id: ''
  })

  async function handleSaveBanner() {
    if (!bannerForm.cloudinary_public_id || !bannerForm.title) {
      return toast.error('Image and Title are required')
    }
    setSaving(true)
    const result = await saveBanner(bannerForm)
    if (result.success) {
      toast.success('Banner saved successfully')
      setShowAddBanner(false)
      setBannerForm({ title: '', cta_text: 'Shop Now', cta_link: '', cloudinary_public_id: '' })
    } else {
      toast.error(result.error)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex border-b border-sage/10 mb-8">
        {['Banners', 'Announcements', 'Layout Sections'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
              activeTab === tab ? 'border-teal text-teal' : 'border-transparent text-muted-foreground hover:text-charcoal'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Banners' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddBanner(!showAddBanner)} className="bg-teal hover:bg-teal/90 gap-2">
              <Plus size={18} /> Add Hero Banner
            </Button>
          </div>

          {showAddBanner && (
            <div className="bg-white border border-sage/20 p-8 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="space-y-4">
                <p className="admin-section-label">Banner Image</p>
                <CloudinaryImageUploader 
                  onUpload={(pid) => setBannerForm(prev => ({ ...prev, cloudinary_public_id: pid }))} 
                  folder="labelwink/banners" 
                />
                {bannerForm.cloudinary_public_id && (
                  <div className="aspect-[21/9] rounded-xl overflow-hidden border border-sage/20">
                    <ProductImage 
                      publicId={bannerForm.cloudinary_public_id} 
                      alt="Preview" 
                      width={800} height={340} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="admin-section-label">Banner Heading</label>
                  <input 
                    className="w-full bg-sage/5 border border-sage/10 rounded-xl px-4 py-3 outline-none focus:border-teal"
                    placeholder="e.g. The Spring Edit 2026"
                    value={bannerForm.title}
                    onChange={e => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="admin-section-label">Button Text</label>
                    <input 
                      className="w-full bg-sage/5 border border-sage/10 rounded-xl px-4 py-3 outline-none focus:border-teal"
                      placeholder="Shop Now"
                      value={bannerForm.cta_text}
                      onChange={e => setBannerForm(prev => ({ ...prev, cta_text: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="admin-section-label">Link</label>
                    <input 
                      className="w-full bg-sage/5 border border-sage/10 rounded-xl px-4 py-3 outline-none focus:border-teal"
                      placeholder="/collections/new-arrivals"
                      value={bannerForm.cta_link}
                      onChange={e => setBannerForm(prev => ({ ...prev, cta_link: e.target.value }))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSaveBanner} 
                  disabled={saving} 
                  className="w-full h-12 bg-charcoal text-white rounded-xl gap-2 mt-4"
                >
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Banner'}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {initialBanners.map((banner) => (
              <div key={banner.id} className="bg-white border border-sage/20 p-4 rounded-2xl flex items-center gap-6 group hover:border-teal/30 transition-colors">
                <div className="w-48 aspect-[2/1] rounded-lg overflow-hidden bg-sage/5 flex-shrink-0">
                  <ProductImage 
                    publicId={banner.cloudinary_public_id} 
                    alt={banner.title} 
                    width={200} height={100} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-charcoal">{banner.title}</h4>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><ImageIcon size={12} className="text-teal" /> {banner.cta_text}</span>
                    <span className="flex items-center gap-1.5"><LinkIcon size={12} className="text-teal" /> {banner.cta_link}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleBanner(banner.id, !banner.is_active)}
                    className={`gap-2 rounded-lg ${banner.is_active ? 'text-teal border-teal/20' : 'text-gray-400'}`}
                  >
                    <Power size={14} /> {banner.is_active ? 'Active' : 'Draft'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteBanner(banner.id)}
                    className="text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Announcements' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="text-lg font-semibold text-charcoal">Manage Announcements</h3>
             <Button 
                onClick={() => saveAnnouncement({ text: 'New Announcement', is_active: true })} 
                className="bg-teal hover:bg-teal/90 gap-2"
              >
               <Plus size={18} /> Add Announcement
             </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {initialAnnouncements.map((ann) => (
              <div key={ann.id} className="bg-white border border-sage/20 p-6 rounded-2xl flex items-center gap-6">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Message Text</label>
                    <Input 
                      defaultValue={ann.text} 
                      onBlur={(e) => saveAnnouncement({ id: ann.id, text: e.target.value, link: ann.link, is_active: ann.is_active })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Link (Optional)</label>
                    <Input 
                      defaultValue={ann.link} 
                      placeholder="/collections/new-arrivals"
                      onBlur={(e) => saveAnnouncement({ id: ann.id, text: ann.text, link: e.target.value, is_active: ann.is_active })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant={ann.is_active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => saveAnnouncement({ id: ann.id, text: ann.text, link: ann.link, is_active: !ann.is_active })}
                    className={ann.is_active ? 'bg-teal' : ''}
                  >
                    {ann.is_active ? 'Active' : 'Draft'}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            ))}
            {initialAnnouncements.length === 0 && (
              <div className="bg-white border border-sage/20 p-12 rounded-2xl text-center text-muted-foreground italic">
                No announcements yet.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Layout Sections' && (
        <div className="space-y-4">
          {initialSections.map(section => (
            <div key={section.id} className="bg-white border border-sage/20 p-6 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-teal/5 rounded-lg flex items-center justify-center text-teal">
                  <Layout size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-charcoal">{section.title}</h4>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{section.section_key}</p>
                </div>
              </div>
              <Button
                variant={section.is_active ? 'default' : 'outline'}
                onClick={() => toggleSection(section.id, !section.is_active)}
                className={section.is_active ? 'bg-teal' : ''}
              >
                {section.is_active ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
