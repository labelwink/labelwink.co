import { readFileSync } from 'fs'
import { join } from 'path'
import { AnnouncementBar } from '@/components/storefront/AnnouncementBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/storefront/WhatsAppButton'
import { CartDrawer } from '@/components/cart/CartDrawer'

function getSettings() {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'settings.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function getNavigation() {
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'navigation.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings()
  const nav = getNavigation()

  return (
    <>
      <AnnouncementBar
        enabled={settings.announcement_bar_enabled ?? false}
        text={settings.announcement_bar_text ?? ''}
        color={settings.announcement_bar_color ?? '#1b3a34'}
      />
      <Navbar />
      <CartDrawer />
      <main>{children}</main>
      <Footer columns={nav.footer_columns} social={settings.social} tagline={settings.tagline} />
      <WhatsAppButton />
    </>
  )
}
