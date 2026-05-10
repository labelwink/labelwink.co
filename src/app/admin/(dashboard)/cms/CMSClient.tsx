'use client'

import { useState } from 'react'
import {
  Plus, Image as ImageIcon, Link as LinkIcon,
  Trash2, Save, Power, Layout, RefreshCw,
} from 'lucide-react'
import { CloudinaryImageUploader } from '@/components/admin/CloudinaryImageUploader'
import { useToast } from '@/components/admin/Toast'
import {
  saveBanner, deleteBanner, toggleBanner,
  saveAnnouncement, toggleSection,
} from './actions'

// ── Types ───────────────────────────────────────────────────────────────────────
interface Banner {
  id: string
  title: string
  cloudinary_public_id: string | null
  cta_text: string | null
  cta_link: string | null
  is_active: boolean
  sort_order: number
}

interface Announcement {
  id: string
  text: string
  link: string | null
  is_active: boolean
}

interface Section {
  id: string
  title: string
  section_key: string
  is_active: boolean
}

interface Props {
  initialBanners:       Banner[]
  initialAnnouncements: Announcement[]
  initialSections:      Section[]
}

const TABS = ['Banners', 'Announcements', 'Sections'] as const
type TabName = typeof TABS[number]

const EMPTY_BANNER = { title: '', cta_text: 'Shop Now', cta_link: '', cloudinary_public_id: '' }

// ── CloudinaryPreview helper ────────────────────────────────────────────────────
function CldPreview({ publicId }: { publicId: string }) {
  const url = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_600,c_fill/${publicId}`
  return (
    <div className="mt-2 aspect-[21/9] rounded-xl overflow-hidden border border-[#e5e7eb] bg-gray-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Preview" className="w-full h-full object-cover" />
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────────
export default function CMSClient({ initialBanners, initialAnnouncements, initialSections }: Props) {
  const { showToast, ToastComponent } = useToast()
  const [activeTab,     setActiveTab]     = useState<TabName>('Banners')
  const [banners,       setBanners]       = useState<Banner[]>(initialBanners)
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [sections,      setSections]      = useState<Section[]>(initialSections)
  const [showAddBanner, setShowAddBanner] = useState(false)
  const [bannerForm,    setBannerForm]    = useState(EMPTY_BANNER)
  const [savingBanner,  setSavingBanner]  = useState(false)
  const [toggling,      setToggling]      = useState<Set<string>>(new Set())

  // ── Banners ────────────────────────────────────────────────────────────────
  const handleSaveBanner = async () => {
    if (!bannerForm.cloudinary_public_id || !bannerForm.title.trim()) {
      showToast('Image and Title are required', 'error'); return
    }
    setSavingBanner(true)
    const result = await saveBanner({
      title:                bannerForm.title,
      cta_text:             bannerForm.cta_text || 'Shop Now',
      cta_link:             bannerForm.cta_link || undefined,
      cloudinary_public_id: bannerForm.cloudinary_public_id,
      is_active:            true,
    })
    setSavingBanner(false)
    if (result.success) {
      showToast('Banner saved ✓', 'success')
      setShowAddBanner(false)
      setBannerForm(EMPTY_BANNER)
      // Optimistically add — we don't have the ID back from server action
      // so we just reload on next view
    } else {
      showToast(result.error ?? 'Save failed', 'error')
    }
  }

  const handleDeleteBanner = async (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id))
    await deleteBanner(id)
    showToast('Banner deleted', 'success')
  }

  const handleToggleBanner = async (b: Banner) => {
    setToggling(prev => new Set(prev).add(b.id))
    setBanners(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x))
    await toggleBanner(b.id, !b.is_active)
    setToggling(prev => { const n = new Set(prev); n.delete(b.id); return n })
  }

  // ── Announcements ──────────────────────────────────────────────────────────
  const handleAddAnnouncement = async () => {
    await saveAnnouncement({ text: 'New Announcement', is_active: false })
    showToast('Announcement added', 'success')
  }

  const handleUpdateAnnouncement = async (ann: Announcement, updates: Partial<Announcement>) => {
    setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, ...updates } : a))
    await saveAnnouncement({ id: ann.id, text: updates.text ?? ann.text, link: updates.link ?? ann.link ?? undefined, is_active: updates.is_active ?? ann.is_active })
  }

  // ── Sections ───────────────────────────────────────────────────────────────
  const handleToggleSection = async (sec: Section) => {
    setSections(prev => prev.map(s => s.id === sec.id ? { ...s, is_active: !s.is_active } : s))
    await toggleSection(sec.id, !sec.is_active)
  }

  return (
    <div className="space-y-5 max-w-[900px]">
      {ToastComponent}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#e5e7eb]">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-[#1b3a34] text-[#1b3a34]'
                : 'border-transparent text-[#6b7280] hover:text-[#ffffff]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── BANNERS ── */}
      {activeTab === 'Banners' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setShowAddBanner(s => !s); setBannerForm(EMPTY_BANNER) }}
              className="flex items-center gap-2 px-4 py-2 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b] transition-colors"
            >
              <Plus size={13} /> Add Banner
            </button>
          </div>

          {/* Add form */}
          {showAddBanner && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#ffffff]">New Hero Banner</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Image upload */}
                <div>
                  <p className="text-xs font-medium text-[#ffffff] mb-2">Banner Image *</p>
                  <CloudinaryImageUploader
                    onUpload={pid => setBannerForm(prev => ({ ...prev, cloudinary_public_id: pid }))}
                    folder="labelwink/banners"
                  />
                  {bannerForm.cloudinary_public_id && (
                    <CldPreview publicId={bannerForm.cloudinary_public_id} />
                  )}
                </div>
                {/* Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#ffffff] mb-1">Heading *</label>
                    <input
                      value={bannerForm.title}
                      onChange={e => setBannerForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. The Spring Edit 2026"
                      className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#ffffff] mb-1">Button Text</label>
                    <input
                      value={bannerForm.cta_text}
                      onChange={e => setBannerForm(p => ({ ...p, cta_text: e.target.value }))}
                      placeholder="Shop Now"
                      className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#ffffff] mb-1">Link URL</label>
                    <input
                      value={bannerForm.cta_link}
                      onChange={e => setBannerForm(p => ({ ...p, cta_link: e.target.value }))}
                      placeholder="/collections/new-arrivals"
                      className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowAddBanner(false)}
                      className="px-4 py-2 border border-[#e5e7eb] rounded-lg text-xs font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveBanner}
                      disabled={savingBanner}
                      className="flex items-center gap-1.5 px-5 py-2 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b] disabled:opacity-50"
                    >
                      <Save size={12} /> {savingBanner ? 'Saving…' : 'Save Banner'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Banner list */}
          {banners.length === 0 ? (
            <div className="bg-white border border-dashed border-[#e5e7eb] rounded-xl p-14 text-center">
              <ImageIcon size={28} className="mx-auto text-[#1a2e1e] mb-3" />
              <p className="text-sm text-[#6b7280]">No banners yet — add one above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {banners.map(b => {
                const previewUrl = b.cloudinary_public_id
                  ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_200,c_fill/${b.cloudinary_public_id}`
                  : null
                return (
                  <div key={b.id} className="bg-white border border-[#e5e7eb] rounded-xl p-4 flex items-center gap-4">
                    <div className="w-28 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {previewUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={previewUrl} alt={b.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[#5a7060]"><ImageIcon size={18} /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#ffffff] truncate">{b.title}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[#9ca3af]">
                        {b.cta_text && <span className="flex items-center gap-1"><ImageIcon size={9} /> {b.cta_text}</span>}
                        {b.cta_link && <span className="flex items-center gap-1"><LinkIcon size={9} /> {b.cta_link}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleBanner(b)}
                        disabled={toggling.has(b.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors disabled:opacity-50 ${
                          b.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-50 text-[#9aab9e] border-gray-200'
                        }`}
                      >
                        <Power size={10} /> {b.is_active ? 'Active' : 'Draft'}
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ANNOUNCEMENTS ── */}
      {activeTab === 'Announcements' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleAddAnnouncement}
              className="flex items-center gap-2 px-4 py-2 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b] transition-colors"
            >
              <Plus size={13} /> Add Announcement
            </button>
          </div>

          {announcements.length === 0 ? (
            <div className="bg-white border border-dashed border-[#e5e7eb] rounded-xl p-14 text-center">
              <p className="text-sm text-[#6b7280]">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map(ann => (
                <div key={ann.id} className="bg-white border border-[#e5e7eb] rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">Message</label>
                      <input
                        defaultValue={ann.text}
                        onBlur={e => handleUpdateAnnouncement(ann, { text: e.target.value })}
                        className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">Link (optional)</label>
                      <input
                        defaultValue={ann.link ?? ''}
                        onBlur={e => handleUpdateAnnouncement(ann, { link: e.target.value })}
                        placeholder="/collections/sale"
                        className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateAnnouncement(ann, { is_active: !ann.is_active })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border flex-shrink-0 transition-colors ${
                      ann.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-50 text-[#9aab9e] border-gray-200'
                    }`}
                  >
                    <Power size={10} /> {ann.is_active ? 'Active' : 'Draft'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SECTIONS ── */}
      {activeTab === 'Sections' && (
        <div className="space-y-3">
          <p className="text-xs text-[#6b7280]">Toggle homepage sections on/off.</p>
          {sections.length === 0 ? (
            <div className="bg-white border border-dashed border-[#e5e7eb] rounded-xl p-14 text-center">
              <Layout size={28} className="mx-auto text-[#1a2e1e] mb-3" />
              <p className="text-sm text-[#6b7280]">No sections configured</p>
            </div>
          ) : (
            sections.map(sec => (
              <div key={sec.id} className="bg-white border border-[#e5e7eb] rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1b3a34]/8 rounded-lg flex items-center justify-center">
                    <Layout size={14} className="text-[#1b3a34]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#ffffff]">{sec.title}</p>
                    <p className="text-[10px] font-mono text-[#9ca3af]">{sec.section_key}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSection(sec)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                    sec.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-50 text-[#9aab9e] border-gray-200'
                  }`}
                >
                  <Power size={10} /> {sec.is_active ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
