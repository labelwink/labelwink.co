'use client'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface EmailTemplate {
  id: string
  type: string
  subject: string
  body_html: string
  variables: string[]
  is_active: boolean
  updated_at: string
}

const TEMPLATES = [
  { key: 'order_confirmed', label: 'Order Confirmed' },
  { key: 'order_shipped', label: 'Order Shipped' },
  { key: 'order_delivered', label: 'Order Delivered' },
  { key: 'order_cancelled', label: 'Order Cancelled' },
  { key: 'return_initiated', label: 'Return Initiated' },
  { key: 'return_approved', label: 'Return Approved' },
  { key: 'welcome_email', label: 'Welcome' },
  { key: 'otp_email', label: 'OTP' },
]

const VARIABLE_CHIPS = [
  '{{customer_name}}',
  '{{order_id}}',
  '{{order_total}}',
  '{{items_list}}',
  '{{tracking_link}}',
  '{{awb_code}}',
  '{{courier_name}}',
  '{{store_name}}',
  '{{support_email}}',
  '{{otp_code}}',
]

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Map<string, EmailTemplate>>(new Map())
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cursorPos, setCursorPos] = useState(0)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (selectedTemplate && templates.has(selectedTemplate)) {
      const template = templates.get(selectedTemplate)!
      setSubject(template.subject)
      setBodyHtml(template.body_html)
    }
  }, [selectedTemplate])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/email-templates')
      const data = await res.json()
      const templateMap = new Map()
      data.templates?.forEach((t: EmailTemplate) => {
        templateMap.set(t.type, t)
      })
      setTemplates(templateMap)
      if (templateMap.size > 0) {
        setSelectedTemplate(Array.from(templateMap.keys())[0])
      }
    } catch (error) {
      toast.error('Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedTemplate) return

    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/email-templates/${selectedTemplate}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body_html: bodyHtml }),
      })

      if (res.ok) {
        toast.success('Template saved')
        fetchTemplates()
      } else {
        toast.error('Failed to save template')
      }
    } catch (error) {
      toast.error('Error saving template')
    } finally {
      setSaving(false)
    }
  }

  const handleInsertVariable = (variable: string) => {
    if (!bodyRef.current) return

    const start = bodyRef.current.selectionStart || 0
    const end = bodyRef.current.selectionEnd || 0
    const newBody = bodyHtml.slice(0, start) + variable + bodyHtml.slice(end)
    setBodyHtml(newBody)
    
    // Restore cursor position
    setTimeout(() => {
      if (bodyRef.current) {
        bodyRef.current.selectionStart = start + variable.length
        bodyRef.current.selectionEnd = start + variable.length
        bodyRef.current.focus()
      }
    }, 0)
  }

  const handleSendTest = async () => {
    if (!selectedTemplate) return

    try {
      const res = await fetch(`/api/superadmin/email-templates/${selectedTemplate}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body_html: bodyHtml }),
      })

      if (res.ok) {
        toast.success('Test email sent')
      } else {
        toast.error('Failed to send test email')
      }
    } catch (error) {
      toast.error('Error sending test email')
    }
  }

  if (loading) {
    return <div className="text-[#5a7060]">Loading...</div>
  }

  const currentTemplate = selectedTemplate ? templates.get(selectedTemplate) : null

  return (
    <div className="flex gap-6 h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-[#faf8f4] rounded-lg p-4 overflow-y-auto">
        <h2 className="text-gray-900 font-semibold mb-4">Templates</h2>
        <div className="space-y-2">
          {TEMPLATES.map(template => (
            <button
              key={template.key}
              onClick={() => setSelectedTemplate(template.key)}
              className={`w-full text-left px-4 py-2 rounded transition-colors text-sm ${
                selectedTemplate === template.key
                  ? 'bg-[#c9a84c]/20 text-[#c9a84c]'
                  : 'text-[#5a7060] hover:text-white hover:bg-white'
              }`}
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      {selectedTemplate && (
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <label className="block text-[#5a7060] text-sm mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
            />
          </div>

          <div>
            <label className="block text-[#5a7060] text-sm mb-2">Body HTML</label>
            <textarea
              ref={bodyRef}
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="w-full flex-1 bg-white border border-gray-300 rounded px-4 py-2 text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c] resize-none"
            />
          </div>

          <div>
            <p className="text-[#5a7060] text-sm mb-2">Variables</p>
            <div className="flex flex-wrap gap-2">
              {VARIABLE_CHIPS.map(variable => (
                <button
                  key={variable}
                  onClick={() => handleInsertVariable(variable)}
                  className="bg-white hover:bg-[#f5f2ec] text-[#c9a84c] text-xs px-3 py-1 rounded font-mono transition-colors"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-[#5a7060] text-sm mb-2">Preview</p>
            <div
              className="w-full bg-white rounded p-6 min-h-64 overflow-auto border border-[#f5f2ec]"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSendTest}
              className="bg-white text-white px-4 py-2 rounded hover:bg-[#f5f2ec]"
            >
              Send Test Email
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#c9a84c] text-black font-bold px-6 py-2 rounded hover:bg-[#d4b66a] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
