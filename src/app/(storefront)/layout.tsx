import { readFileSync } from 'fs'
import { join } from 'path'
import { AnnouncementBar } from '@/components/storefront/AnnouncementBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/storefront/WhatsAppButton'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { AuthModalProvider } from '@/components/auth/OTPLoginModal'
import { MobileBottomNav } from '@/components/storefront/MobileBottomNav'
import { PWAInstallPrompt, ServiceWorkerRegistration } from '@/components/PWAInstallPrompt'
import { AbandonedCartTracker } from '@/components/cart/AbandonedCartTracker'

function getNavigation() {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'navigation.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

interface ShopSettings {
  announcement_text?:    string
  announcement_url?:     string
  announcement_enabled?: boolean
  announcement_bg?:      string
  announcement_bar_enabled?: boolean
  announcement_bar_text?:    string
  announcement_bar_color?:   string
  social?:                   Record<string, string>
  tagline?:                  string
  whatsapp_number?:          string
}

async function getSettings(): Promise<ShopSettings> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminSupabaseClient() as any
    const { data } = await supabase
      .from('shop_settings')
      .select('*')
      .limit(1)
      .single()
    return data ?? {}
  } catch {
    // Fallback to local JSON if DB not available
    try {
      const raw = readFileSync(join(process.cwd(), 'data', 'settings.json'), 'utf-8')
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
}

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [settings, nav] = await Promise.all([getSettings(), Promise.resolve(getNavigation())])

  // Support both old (announcement_bar_*) and new (announcement_*) columns
  const announcementEnabled = settings.announcement_enabled ?? settings.announcement_bar_enabled ?? false
  const announcementText    = settings.announcement_text    ?? settings.announcement_bar_text    ?? ''
  const announcementColor   = settings.announcement_bg      ?? settings.announcement_bar_color   ?? '#c9a84c'

  return (
    <AuthModalProvider>
      <AnnouncementBar
        enabled={announcementEnabled}
        text={announcementText}
        color={announcementColor}
      />
      <Navbar />
      <CartDrawer />
      <main className="page-transition bg-[#FDF8F0] min-h-screen pb-20 md:pb-0 pt-16 md:pt-[72px]">{children}</main>
      <Footer columns={nav.footer_columns} social={settings.social} tagline={settings.tagline} />
      <WhatsAppButton />
      <MobileBottomNav />
      <PWAInstallPrompt />
      <ServiceWorkerRegistration />
      <AbandonedCartTracker />
    </AuthModalProvider>
  )
}

