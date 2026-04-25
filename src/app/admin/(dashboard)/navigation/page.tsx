import { createAdminClient } from '@/lib/supabase/server'
import NavigationClient from './NavigationClient'

export default async function NavigationAdminPage() {
  const supabase = createAdminClient()

  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .in('key', ['navigation_main', 'navigation_footer'])

  const mainNav = settings?.find(s => s.key === 'navigation_main')?.value || [
    { name: 'New Arrivals', href: '/collections/new-arrivals' },
    { name: 'Kurtas', href: '/collections/kurtas' },
    { name: 'Co-ords', href: '/collections/co-ords' },
    { name: 'Dresses', href: '/collections/dresses' },
    { name: 'Sale', href: '/collections/sale', className: 'text-red-600' }
  ]

  const footerNav = settings?.find(s => s.key === 'navigation_footer')?.value || [
    { 
      title: 'Shop', 
      links: [
        { label: 'New Arrivals', href: '/collections/new-arrivals' },
        { label: 'Bestsellers', href: '/collections/bestsellers' }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-charcoal">Navigation</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your header and footer links.</p>
      </div>

      <NavigationClient initialMainNav={mainNav} initialFooterNav={footerNav} />
    </div>
  )
}
