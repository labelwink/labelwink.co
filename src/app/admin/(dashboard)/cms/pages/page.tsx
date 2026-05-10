'use client'

import { useState, useEffect } from 'react'
import { Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const PAGES = [
  { slug: 'privacy-policy', label: 'Privacy Policy' },
  { slug: 'return-policy', label: 'Return Policy' },
  { slug: 'terms-of-service', label: 'Terms of Service' },
  { slug: 'shipping-policy', label: 'Shipping Policy' },
  { slug: 'refund-policy', label: 'Refund Policy' },
]

export default function PoliciesAdminPage() {
  const [selectedPage, setSelectedPage] = useState(PAGES[0].slug)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    fetchPageContent(selectedPage)
  }, [selectedPage])

  const fetchPageContent = async (slug: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/cms/pages/${slug}`)
      const data = await res.json()
      setTitle(data.title || '')
      setContent(data.content || '')
      setLastUpdated(data.updated_at ? new Date(data.updated_at).toLocaleString() : null)
    } catch {
      toast.error('Failed to load page')
      setTitle('')
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title) {
      toast.error('Title is required')
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/cms/pages/${selectedPage}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })

      if (!res.ok) throw new Error('Save failed')
      
      const data = await res.json()
      setLastUpdated(data.updated_at ? new Date(data.updated_at).toLocaleString() : null)
      toast.success('Page saved successfully')
    } catch {
      toast.error('Failed to save page')
    } finally {
      setSaving(false)
    }
  }

  const currentPageLabel = PAGES.find((p) => p.slug === selectedPage)?.label

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Policy Pages</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left: Page List */}
        <div className="space-y-2">
          {PAGES.map((page) => (
            <button
              key={page.slug}
              onClick={() => setSelectedPage(page.slug)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                selectedPage === page.slug
                  ? 'border-[#1C3829] bg-[#1C3829]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{page.label}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {page.slug}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Editor */}
        <div className="md:col-span-3 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
              <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {currentPageLabel}
                </h2>
                <div className="flex justify-between items-center">
                  <div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Page title"
                      className="text-sm text-gray-600 mt-2 w-full px-0 py-1 border-b-2 border-gray-200 focus:border-[#1C3829] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter page content here..."
                  rows={20}
                  className="w-full px-6 py-4 resize-y font-mono text-sm text-gray-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  {lastUpdated && <p>Last updated: {lastUpdated}</p>}
                  <p>Character count: {content.length}</p>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`/policies?tab=${selectedPage.split('-')[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium text-[#1C3829] border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Preview →
                  </a>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#1C3829] hover:bg-[#1C3829]/90"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
