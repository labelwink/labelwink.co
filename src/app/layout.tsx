import type { Metadata } from 'next'
import { fontVariables } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Label Wink | Women\'s Ethnic Wear', template: '%s | Label Wink' },
  description: 'Discover handcrafted ethnic wear — Kurtas, Co-ords, Dresses and more.',
  metadataBase: new URL('https://labelwink.in'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVariables} antialiased`}>
        {children}
      </body>
    </html>
  )
}
