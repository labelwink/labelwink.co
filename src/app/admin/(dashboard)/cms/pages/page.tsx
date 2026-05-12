'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, FileText, Layout, ExternalLink, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PAGES = [
  { slug: 'about', label: 'About Us' },
  { slug: 'faqs', label: 'Frequently Asked Questions' },
  { slug: 'shipping-policy', label: 'Shipping Policy' },
  { slug: 'return-exchange-policy', label: 'Return & Exchange Policy' },
  { slug: 'refund-policy', label: 'Refund Policy' },
  { slug: 'cancellation-policy', label: 'Cancellation Policy' },
  { slug: 'privacy-policy', label: 'Privacy Policy' },
  { slug: 'terms-conditions', label: 'Terms & Conditions' },
  { slug: 'size-guide', label: 'Size Guide' },
  { slug: 'contact', label: 'Contact Content' },
]

export default function CMSPagesPage() {
  const [selectedPage, setSelectedPage] = useState(PAGES[0].slug)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchPageContent()
  }, [selectedPage])

  const fetchPageContent = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/cms/pages/${selectedPage}`)
      const data = await res.json()
      setTitle(data.title || '')
      setContent(data.content || '')
    } catch (err) {
      console.error('Failed to fetch page:', err)
      setMessage({ type: 'error', text: 'Failed to load page content' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/cms/pages/${selectedPage}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      
      if (!res.ok) throw new Error('Failed to save')
      
      setMessage({ type: 'success', text: 'Page updated successfully' })
    } catch (err) {
      console.error('Save error:', err)
      setMessage({ type: 'error', text: 'Failed to save page changes' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layout className="text-[#1C3829]" size={24} />
            Page Content Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Edit policy and informational pages content</p>
        </div>
        
        <div className="flex items-center gap-3">
          <a
            href={`/${selectedPage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#1C3829] hover:underline px-3 py-2"
          >
            <ExternalLink size={16} />
            Preview Page
          </a>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-[#1C3829] hover:bg-[#1C3829]/90 text-white rounded-none h-10 px-6"
          >
            {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-none border flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'error' && <AlertCircle size={20} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar / Page List */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-none overflow-hidden sticky top-8">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Page</p>
            </div>
            <div className="divide-y divide-gray-100">
              {PAGES.map((page) => (
                <button
                  key={page.slug}
                  onClick={() => setSelectedPage(page.slug)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                    selectedPage === page.slug
                      ? 'bg-[#1C3829]/5 text-[#1C3829] font-semibold border-r-4 border-[#1C3829]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={16} />
                  {page.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-none shadow-sm min-h-[600px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Loading content...</p>
              </div>
            ) : (
              <div className="p-6 md:p-8 space-y-6 flex-1 flex flex-col">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Page Heading
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter page title (e.g. Shipping Policy)"
                    className="w-full text-2xl font-bold text-gray-900 border-none p-0 focus:ring-0 placeholder:text-gray-200"
                  />
                  <div className="h-px bg-gray-100 mt-2" />
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Content (HTML Supported)
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing your page content here... Use <h3>, <p>, <ul>, etc. for styling."
                    className="flex-1 w-full p-4 border border-gray-200 rounded-none text-gray-700 leading-relaxed min-h-[400px] focus:ring-2 focus:ring-[#1C3829]/10 focus:border-[#1C3829] outline-none"
                  />
                </div>
              </div>
            )}
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <p className="text-xs text-gray-400">
                Last auto-saved just now · <strong>{content.length}</strong> characters
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
