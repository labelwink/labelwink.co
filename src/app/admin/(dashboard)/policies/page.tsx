import { createAdminClient } from '@/lib/supabase/server'
import PoliciesClient from './PoliciesClient'

export default async function PoliciesAdminPage() {
  const supabase = createAdminClient()

  const { data: policies, error } = await supabase
    .from('policies')
    .select('*')
    .order('type', { ascending: true })

  if (error) {
    return <div>Error loading policies: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-charcoal">Store Policies</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage Shipping, Refunds, Privacy, and Terms.</p>
      </div>

      <PoliciesClient initialPolicies={policies || []} />
    </div>
  )
}
