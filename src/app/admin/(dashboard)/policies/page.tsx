'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/admin/Toast'

const POLICIES = [
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'returns', label: 'Return & Refund' },
  { key: 'shipping', label: 'Shipping Policy' },
  { key: 'terms', label: 'Terms & Conditions' },
]

export default function PoliciesPage() {
  const [activeKey, setActiveKey] = useState('privacy')
  const [contentMap, setContentMap] = useState<Record<string, { title: string; last_updated: string; content: string }>>({})
  const [loading, setLoading] = useState(false)
  const { showToast, ToastComponent } = useToast()
  const editorRef = useRef<HTMLDivElement>(null)

  const load = async (key: string) => {
    if (contentMap[key]) return
    setLoading(true)
    const res = await fetch(`/api/admin/policies/${key}`)
    const data = await res.json()
    setContentMap(prev => ({ ...prev, [key]: data }))
    setLoading(false)
  }

  useEffect(() => { load('privacy') }, [])

  // Re-initialize editor content whenever activeKey changes or data loads
  useEffect(() => {
    if (editorRef.current && contentMap[activeKey]?.content !== undefined) {
      editorRef.current.innerHTML = contentMap[activeKey].content
    }
  }, [activeKey, contentMap[activeKey]?.content !== undefined])

  const handleTabChange = (key: string) => {
    // Save current editor content before switching
    if (editorRef.current && contentMap[activeKey]) {
      setContentMap(prev => ({ ...prev, [activeKey]: { ...prev[activeKey], content: editorRef.current!.innerHTML } }))
    }
    setActiveKey(key)
    load(key)
  }

  const handleBlur = () => {
    if (editorRef.current && contentMap[activeKey]) {
      setContentMap(prev => ({ ...prev, [activeKey]: { ...prev[activeKey], content: editorRef.current!.innerHTML } }))
    }
  }

  const format = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
  }

  const savePolicy = async () => {
    // Capture latest content from DOM
    const currentContent = editorRef.current?.innerHTML ?? contentMap[activeKey]?.content ?? ''
    const policy = { ...contentMap[activeKey], content: currentContent }

    const res = await fetch(`/api/admin/policies/${activeKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    })
    if (res.ok) {
      setContentMap(prev => ({ ...prev, [activeKey]: { ...prev[activeKey], content: currentContent, last_updated: new Date().toISOString().slice(0, 10) } }))
      showToast('Policy saved ✓', 'success')
    } else {
      showToast('Save failed', 'error')
    }
  }

  const policy = contentMap[activeKey]

  return (
    <div className="space-y-6">
      {ToastComponent}

      {/* Prose styles for contenteditable */}
      <style>{`
        [contenteditable] h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        [contenteditable] h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.4rem; }
        [contenteditable] p { margin-bottom: 0.75rem; }
        [contenteditable] ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        [contenteditable] ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        [contenteditable] strong { font-weight: 700; }
        [contenteditable] em { font-style: italic; }
        [contenteditable] a { color: #1b3a34; text-decoration: underline; }
      `}</style>

      <h1 className="text-2xl font-bold text-[#1a1a1a]">Policy Editor</h1>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-[#e5e7eb]">
        {POLICIES.map(p => (
          <button key={p.key} onClick={() => handleTabChange(p.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeKey === p.key ? 'bg-[#1b3a34] text-white rounded-t-lg' : 'text-[#6b7280] hover:text-[#1a1a1a]'
            }`}
          >{p.label}</button>
        ))}
      </div>

      {policy && (
        <div className="space-y-4">
          <p className="text-xs text-[#6b7280]">Last updated: {policy.last_updated}</p>

          <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex gap-1 p-2 bg-gray-50 border-b border-[#e5e7eb] flex-wrap">
              {[
                { label: 'B', cmd: 'bold', title: 'Bold', cls: 'font-bold' },
                { label: 'I', cmd: 'italic', title: 'Italic', cls: 'italic' },
                { label: 'U', cmd: 'underline', title: 'Underline', cls: 'underline' },
              ].map(btn => (
                <button
                  key={btn.cmd}
                  onMouseDown={e => { e.preventDefault(); format(btn.cmd) }}
                  className={`px-3 py-1 text-sm ${btn.cls} border border-[#e5e7eb] rounded hover:bg-gray-200 bg-white`}
                  title={btn.title}
                >
                  {btn.label}
                </button>
              ))}
              <div className="w-px bg-gray-300 mx-1" />
              <button onMouseDown={e => { e.preventDefault(); format('formatBlock', 'h2') }}
                className="px-3 py-1 text-sm font-semibold border border-[#e5e7eb] rounded hover:bg-gray-200 bg-white">H2</button>
              <button onMouseDown={e => { e.preventDefault(); format('formatBlock', 'h3') }}
                className="px-3 py-1 text-sm font-semibold border border-[#e5e7eb] rounded hover:bg-gray-200 bg-white">H3</button>
              <button onMouseDown={e => { e.preventDefault(); format('formatBlock', 'p') }}
                className="px-3 py-1 text-sm border border-[#e5e7eb] rounded hover:bg-gray-200 bg-white">¶ Para</button>
              <div className="w-px bg-gray-300 mx-1" />
              <button onMouseDown={e => { e.preventDefault(); format('insertUnorderedList') }}
                className="px-3 py-1 text-sm border border-[#e5e7eb] rounded hover:bg-gray-200 bg-white">• List</button>
              <button onMouseDown={e => { e.preventDefault(); format('insertOrderedList') }}
                className="px-3 py-1 text-sm border border-[#e5e7eb] rounded hover:bg-gray-200 bg-white">1. List</button>
            </div>

            {/* Editor area */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleBlur}
              className="min-h-[450px] p-5 focus:outline-none text-sm leading-relaxed"
              style={{ fontFamily: 'inherit' }}
            />
          </div>

          <button
            onClick={savePolicy}
            className="px-6 py-2.5 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#234d44]"
          >
            Save Policy
          </button>
        </div>
      )}

      {loading && <div className="text-center py-10 text-[#6b7280]">Loading…</div>}
    </div>
  )
}
