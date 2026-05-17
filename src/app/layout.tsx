import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { generateOrganizationSchema } from '@/lib/json-ld'
import { Toaster } from 'sonner'
import { createAdminClient } from '@/lib/supabase/server'
import CookieBanner from '@/components/ui/CookieBanner'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '600', '700'],
});

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  let settings: Record<string, any> = {};
  try {
    const res = await fetch(`${baseUrl}/api/storefront/settings`, { next: { revalidate: 3600 } });
    if (res.ok) settings = await res.json();
  } catch (err) {
    console.error('Metadata fetch error:', err);
  }

  const storeName = settings?.store_name || 'LabelWink';
  const tagLine = settings?.store_tagline || 'Modern Ethnic Fashion';
  
  return {
    title: { 
      default: `${storeName} | ${tagLine}`, 
      template: `%s | ${storeName}` 
    },
    description: tagLine,
    keywords: ['fashion', 'ethnic wear', 'women clothing', 'labelwink', storeName],
    authors: [{ name: storeName }],
    metadataBase: new URL(baseUrl),
    openGraph: {
      siteName: storeName,
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
    },
    icons: {
      icon: settings?.favicon_url || '/favicon.ico',
      apple: settings?.logo_url || '/apple-icon.png',
    }
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co';

  let settings: Record<string, any> = {};
  let social: Record<string, any> = {};
  try {
    const keys = ['store_name', 'logo_url', 'store_email', 'store_phone', 'store_address', 'store_city', 'store_state', 'social_links'];
    const { data } = await supabase.from('site_settings').select('key, value').in('key', keys);
    settings = (data ?? []).reduce((acc: Record<string, any>, row) => {
      const raw = row.value;
      acc[row.key] = raw !== null && typeof raw === 'object' && 'v' in raw ? raw.v : raw;
      return acc;
    }, {});
    social = settings.social_links || {};
  } catch (err) {
    console.error('Layout settings fetch error:', err);
  }

  const orgSchema = generateOrganizationSchema({
    store_name: settings.store_name || 'LabelWink',
    store_url: siteUrl,
    logo_url: settings.logo_url,
    store_email: settings.store_email,
    store_phone: settings.store_phone,
    store_address: settings.store_address,
    store_city: settings.store_city,
    store_state: settings.store_state,
    social_links: {
      instagram: social.instagram,
      facebook: social.facebook
    }
  });

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased overflow-x-hidden`}
        style={{ background: '#faf8f4', color: '#1a2e1e' }}
      >
        {children}
        <Toaster position="bottom-right" richColors closeButton />
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
