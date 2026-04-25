'use client'

import { useState } from 'react'
import { Save, Loader2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

interface Policy {
  id: string
  type: string
  title: string
  content: string
  updated_at: string
}

export default function PoliciesClient({ initialPolicies }: { initialPolicies: Policy[] }) {
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies)
  const [activeTab, setActiveTab] = useState(initialPolicies[0]?.id)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const activePolicy = policies.find(p => p.id === activeTab)

  const handleContentChange = (content: string) => {
    setPolicies(prev => prev.map(p => 
      p.id === activeTab ? { ...p, content } : p
    ))
  }

  const handleSave = async () => {
    if (!activePolicy) return
    setSaving(true)
    
    const { error } = await supabase
      .from('policies')
      .update({ 
        content: activePolicy.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', activePolicy.id)

    if (error) {
      toast.error('Failed to save policy')
    } else {
      toast.success('Policy updated successfully')
      // Update the timestamp locally
      setPolicies(prev => prev.map(p => 
        p.id === activeTab ? { ...p, updated_at: new Date().toISOString() } : p
      ))
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 space-y-1">
        {policies.map(policy => (
          <button
            key={policy.id}
            onClick={() => setActiveTab(policy.id)}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === policy.id 
                ? 'bg-teal text-white shadow-lg shadow-teal/20' 
                : 'text-charcoal hover:bg-sage/10'
            }`}
          >
            {policy.title}
          </button>
        ))}
      </div>

      {/* Editor Area */}
      <div className="flex-1 space-y-6">
        {activePolicy ? (
          <div className="bg-white border border-sage/20 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-sage/10 pb-4">
              <div>
                <h2 className="text-xl font-heading font-semibold text-charcoal">{activePolicy.title}</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                  <Clock size={10} /> Last updated: {new Date(activePolicy.updated_at).toLocaleString()}
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="bg-charcoal hover:bg-charcoal/90 gap-2 px-6">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Changes
              </Button>
            </div>

            <RichTextEditor 
              content={activePolicy.content} 
              onChange={handleContentChange} 
            />
          </div>
        ) : (
          <div className="bg-white border border-sage/20 rounded-2xl p-12 text-center text-muted-foreground italic">
            Select a policy to edit
          </div>
        )}
      </div>
    </div>
  )
}
