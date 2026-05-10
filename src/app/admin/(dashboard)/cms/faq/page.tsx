'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  sort_order: number
  is_active: boolean
}

export default function FAQAdminPage() {
  const [items, setItems] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: 'general',
    sort_order: 0,
    is_active: true,
  })

  useEffect(() => {
    fetchFAQ()
  }, [])

  const fetchFAQ = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/cms/faq')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      toast.error('Failed to load FAQ')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.question || !form.answer) {
      toast.error('Question and answer are required')
      return
    }

    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/admin/cms/faq/${editingId}` : '/api/admin/cms/faq'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Save failed')
      
      toast.success(editingId ? 'FAQ updated' : 'FAQ created')
      setIsModalOpen(false)
      setEditingId(null)
      setForm({ question: '', answer: '', category: 'general', sort_order: 0, is_active: true })
      await fetchFAQ()
    } catch {
      toast.error('Failed to save FAQ')
    }
  }

  const handleEdit = (item: FAQItem) => {
    setForm({
      question: item.question,
      answer: item.answer,
      category: item.category,
      sort_order: item.sort_order,
      is_active: item.is_active,
    })
    setEditingId(item.id)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return

    try {
      const res = await fetch(`/api/admin/cms/faq/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('FAQ deleted')
      await fetchFAQ()
    } catch {
      toast.error('Failed to delete FAQ')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">FAQ</h1>
        <Button
          onClick={() => {
            setEditingId(null)
            setForm({ question: '', answer: '', category: 'general', sort_order: 0, is_active: true })
            setIsModalOpen(true)
          }}
          className="gap-2 bg-[#1C3829] hover:bg-[#1C3829]/90"
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No FAQ items yet. Click + Add FAQ to create one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Question</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-900 font-medium">{item.question}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{item.category}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right flex gap-2 justify-end">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-gray-600 hover:text-[#1C3829] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit FAQ' : 'Add FAQ'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <Label htmlFor="question" className="text-sm font-medium text-gray-900">
                  Question *
                </Label>
                <Input
                  id="question"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="Enter FAQ question"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="answer" className="text-sm font-medium text-gray-900">
                  Answer *
                </Label>
                <textarea
                  id="answer"
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="Enter FAQ answer"
                  rows={6}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C3829] resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-900">
                    Category
                  </Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. shipping"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="sort_order" className="text-sm font-medium text-gray-900">
                    Sort Order
                  </Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="text-sm font-medium text-gray-900">
                  Active
                </Label>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#1C3829] text-white rounded-lg text-sm font-medium hover:bg-[#1C3829]/90"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
