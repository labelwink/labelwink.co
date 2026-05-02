import type { Metadata } from 'next'
import { fontVariables } from '@/lib/fonts'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  let settings = null;
  try {
    const res = await fetch(`${baseUrl}/api/storefront/settings`, { next: { revalidate: 300 } });
    if (res.ok) settings = await res.json();
  } catch (err) {}

  const storeName = settings?.store_name || 'Store';
  const tagLine = settings?.store_tagline || 'Store Tagline';
  
  return {
    title: { default: `${storeName} | ${tagLine}`, template: `%s | ${storeName}` },
    description: tagLine,
    metadataBase: new URL(baseUrl),
    icons: {
      icon: settings?.favicon_url || '/favicon.ico'
    }
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${fontVariables} antialiased overflow-x-hidden`}>
        {children}
      </body>
    </html>
  )
}
