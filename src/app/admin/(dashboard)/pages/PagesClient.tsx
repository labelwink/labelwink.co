'use client'

import { useState } from 'react'
import { Save, Loader2, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

interface PageContent {
  id: string
  slug: string
  title: string
  sections: any[]
  updated_at: string
}

export default function PagesClient({ initialPages }: { initialPages: PageContent[] }) {
  const [pages, setPages] = useState<PageContent[]>(initialPages)
  const [activeSlug, setActiveSlug] = useState(initialPages[0]?.slug)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const activePage = pages.find(p => p.slug === activeSlug)

  const handleUpdateSection = (index: number, field: string, value: any) => {
    if (!activePage) return
    const newSections = [...activePage.sections]
    newSections[index] = { ...newSections[index], [field]: value }
    setPages(prev => prev.map(p => 
      p.slug === activeSlug ? { ...p, sections: newSections } : p
    ))
  }

  const handleAddSection = (type: string) => {
    if (!activePage) return
    let newSection = {}
    if (type === 'text_block') newSection = { type, title: '', content: '' }
    if (type === 'faq_item') newSection = { type, question: '', answer: '' }
    if (type === 'hero') newSection = { type, title: '', content: '', image: '' }
    
    const newSections = [...activePage.sections, newSection]
    setPages(prev => prev.map(p => 
      p.slug === activeSlug ? { ...p, sections: newSections } : p
    ))
  }

  const handleRemoveSection = (index: number) => {
    if (!activePage) return
    const newSections = activePage.sections.filter((_, i) => i !== index)
    setPages(prev => prev.map(p => 
      p.slug === activeSlug ? { ...p, sections: newSections } : p
    ))
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!activePage) return
    const newSections = [...activePage.sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSections.length) return
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]]
    setPages(prev => prev.map(p => 
      p.slug === activeSlug ? { ...p, sections: newSections } : p
    ))
  }

  const handleSave = async () => {
    if (!activePage) return
    setSaving(true)
    
    const { error } = await supabase
      .from('pages_content')
      .update({ 
        sections: activePage.sections,
        updated_at: new Date().toISOString()
      })
      .eq('id', activePage.id)

    if (error) {
      toast.error('Failed to save page content')
    } else {
      toast.success('Page content updated successfully')
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-64 space-y-1">
        {pages.map(page => (
          <button
            key={page.slug}
            onClick={() => setActiveSlug(page.slug)}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeSlug === page.slug 
                ? 'bg-teal text-white' 
                : 'text-charcoal hover:bg-sage/10'
            }`}
          >
            {page.title}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-6">
        {activePage ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white border border-sage/20 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-heading font-semibold text-charcoal">{activePage.title}</h2>
              <Button onClick={handleSave} disabled={saving} className="bg-charcoal hover:bg-charcoal/90 gap-2 px-6">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Changes
              </Button>
            </div>

            <div className="space-y-4">
              {activePage.sections.map((section, index) => (
                <div key={index} className="bg-white border border-sage/20 rounded-2xl p-6 shadow-sm group relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleMoveSection(index, 'up')} disabled={index === 0}>
                        <ChevronUp size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleMoveSection(index, 'down')} disabled={index === activePage.sections.length - 1}>
                        <ChevronDown size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6 pl-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal bg-teal/5 px-2 py-1 rounded">
                      {section.type.replace('_', ' ')}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveSection(index)} className="text-red-500 hover:bg-red-50">
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div className="space-y-4 pl-6">
                    {section.type === 'hero' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hero Title</label>
                          <Input value={section.title} onChange={e => handleUpdateSection(index, 'title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hero Subtitle</label>
                          <Textarea value={section.content} onChange={e => handleUpdateSection(index, 'content', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Background Image URL</label>
                          <Input value={section.image} onChange={e => handleUpdateSection(index, 'image', e.target.value)} />
                        </div>
                      </>
                    )}

                    {section.type === 'text_block' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Section Title</label>
                          <Input value={section.title} onChange={e => handleUpdateSection(index, 'title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Body Content</label>
                          <RichTextEditor content={section.content} onChange={value => handleUpdateSection(index, 'content', value)} />
                        </div>
                      </>
                    )}

                    {section.type === 'faq_item' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Question</label>
                          <Input value={section.question} onChange={e => handleUpdateSection(index, 'question', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Answer</label>
                          <RichTextEditor content={section.answer} onChange={value => handleUpdateSection(index, 'answer', value)} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => handleAddSection('text_block')} className="gap-2 border-dashed border-2 hover:border-teal hover:text-teal h-12 px-6">
                <Plus size={18} /> Add Text Block
              </Button>
              <Button variant="outline" onClick={() => handleAddSection('faq_item')} className="gap-2 border-dashed border-2 hover:border-teal hover:text-teal h-12 px-6">
                <Plus size={18} /> Add FAQ Item
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-sage/20 rounded-2xl p-12 text-center text-muted-foreground italic">
            Select a page to edit
          </div>
        )}
      </div>
    </div>
  )
}
