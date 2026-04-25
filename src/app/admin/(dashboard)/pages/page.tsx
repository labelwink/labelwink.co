import { createAdminClient } from '@/lib/supabase/server'
import PagesClient from './PagesClient'

export default async function PagesAdminPage() {
  const supabase = createAdminClient()

  const { data: pages, error } = await supabase
    .from('pages_content')
    .select('*')
    .order('slug', { ascending: true })

  if (error) {
    return <div>Error loading pages: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-charcoal">Pages Content</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage the content of your static pages like About, FAQ, and Home.</p>
      </div>

      <PagesClient initialPages={pages || []} />
    </div>
  )
}
