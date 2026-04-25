'use client'

import { useState } from 'react'
import { Save, Loader2, Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function NavigationClient({ initialMainNav, initialFooterNav }: { initialMainNav: any[], initialFooterNav: any[] }) {
  const [mainNav, setMainNav] = useState(initialMainNav)
  const [footerNav, setFooterNav] = useState(initialFooterNav)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('main')
  const supabase = createClient()

  const handleSave = async () => {
    setSaving(true)
    const { error: error1 } = await supabase
      .from('site_settings')
      .upsert({ key: 'navigation_main', value: mainNav, updated_at: new Date().toISOString() })
    
    const { error: error2 } = await supabase
      .from('site_settings')
      .upsert({ key: 'navigation_footer', value: footerNav, updated_at: new Date().toISOString() })

    if (error1 || error2) {
      toast.error('Failed to save navigation')
    } else {
      toast.success('Navigation saved successfully')
    }
    setSaving(false)
  }

  const addMainItem = () => {
    setMainNav([...mainNav, { name: 'New Link', href: '/' }])
  }

  const removeMainItem = (index: number) => {
    setMainNav(mainNav.filter((_, i) => i !== index))
  }

  const moveMainItem = (index: number, direction: 'up' | 'down') => {
    const newNav = [...mainNav]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newNav.length) return
    [newNav[index], newNav[targetIndex]] = [newNav[targetIndex], newNav[index]]
    setMainNav(newNav)
  }

  return (
    <div className="space-y-6">
      <div className="flex border-b border-sage/10 mb-8">
        <button
          onClick={() => setActiveTab('main')}
          className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
            activeTab === 'main' ? 'border-teal text-teal' : 'border-transparent text-muted-foreground'
          }`}
        >
          Main Navigation
        </button>
        <button
          onClick={() => setActiveTab('footer')}
          className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
            activeTab === 'footer' ? 'border-teal text-teal' : 'border-transparent text-muted-foreground'
          }`}
        >
          Footer Columns
        </button>
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={handleSave} disabled={saving} className="bg-charcoal hover:bg-charcoal/90 gap-2 px-8">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </Button>
      </div>

      {activeTab === 'main' && (
        <div className="bg-white border border-sage/20 rounded-2xl p-6 shadow-sm space-y-4">
          {mainNav.map((item, index) => (
            <div key={index} className="flex items-center gap-4 bg-sage/5 p-4 rounded-xl group">
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveMainItem(index, 'up')} disabled={index === 0}>
                  <ChevronUp size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveMainItem(index, 'down')} disabled={index === mainNav.length - 1}>
                  <ChevronDown size={14} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Label</label>
                  <Input 
                    value={item.name} 
                    onChange={e => {
                      const newNav = [...mainNav]
                      newNav[index].name = e.target.value
                      setMainNav(newNav)
                    }} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">URL / Slug</label>
                  <Input 
                    value={item.href} 
                    onChange={e => {
                      const newNav = [...mainNav]
                      newNav[index].href = e.target.value
                      setMainNav(newNav)
                    }} 
                  />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeMainItem(index)} className="text-red-500 hover:bg-red-50 self-end mb-1">
                <Trash2 size={18} />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addMainItem} className="w-full h-12 border-dashed border-2 gap-2 mt-4">
            <Plus size={18} /> Add Menu Item
          </Button>
        </div>
      )}

      {activeTab === 'footer' && (
        <div className="text-center py-20 bg-white border border-sage/20 rounded-2xl">
          <p className="text-muted-foreground italic">Footer management coming soon. Use site_settings JSON for now.</p>
        </div>
      )}
    </div>
  )
}
