'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/admin/Toast'
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'

export default function FAQEditor() {
  const [items, setItems] = useState<Array<{ question: string; answer: string }>>([])
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    fetch('/api/admin/cms/faq').then(r => r.json()).then(d => setItems(d.items || []))
  }, [])

  const save = async () => {
    const res = await fetch('/api/admin/cms/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    showToast(res.ok ? 'Saved ✓' : 'Save failed', res.ok ? 'success' : 'error')
  }

  const move = (i: number, dir: -1 | 1) => {
    const next = [...items]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    setItems(next)
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-[#6b7280] mb-1">Admin › Pages › <span className="text-[#1a1a1a]">FAQ</span></nav>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">FAQ Editor</h1>
        </div>
        <button onClick={save} className="px-5 py-2 bg-[#1b3a34] text-white rounded-xl text-sm hover:bg-[#234d44]">Save All</button>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <button onClick={() => i > 0 && move(i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => i < items.length - 1 && move(i, 1)} disabled={i === items.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="flex-1 space-y-2">
                <input value={item.question} onChange={e => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, question: e.target.value } : it))}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
                  placeholder="Question" />
                <textarea value={item.answer} rows={3} onChange={e => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, answer: e.target.value } : it))}
                  className="w-full border border-[#e5e7eb] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] resize-none"
                  placeholder="Answer" />
              </div>
              <button onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setItems(prev => [...prev, { question: '', answer: '' }])}
        className="flex items-center gap-2 text-sm text-[#1b3a34] hover:underline">
        <Plus size={16} /> Add Question
      </button>
    </div>
  )
}
