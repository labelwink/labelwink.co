import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'

export default async function NotFound() {
  const supabase = createAdminClient()
  let storeEmail = process.env.NEXT_PUBLIC_STORE_EMAIL || 'Support@labelwink.co'
  let logoUrl: string | null = null

  try {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['store_email', 'logo_url'])

    const s = (data ?? []).reduce((acc: Record<string, any>, row) => {
      const raw = row.value
      acc[row.key] = raw !== null && typeof raw === 'object' && 'v' in raw ? raw.v : raw
      return acc
    }, {})
    if (s.store_email) storeEmail = s.store_email
    if (s.logo_url) logoUrl = s.logo_url
  } catch {
    // use defaults
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center font-body">
      {/* Logo */}
      {logoUrl && (
        <div className="mb-12">
          <Image
            src={logoUrl}
            alt="LabelWink"
            width={120}
            height={40}
            className="h-10 w-auto opacity-80"
          />
        </div>
      )}

      {/* 404 Content */}
      <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-widest text-[#c9a84c]">
        404
      </h1>
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 uppercase tracking-wider">
        Page Not Found
      </h2>
      <p className="text-[#5a7060] max-w-md mx-auto mb-10 text-lg">
        The page you're looking for doesn't exist or has been moved.
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <Link
          href="/"
          className="bg-[#c9a84c] text-black px-8 py-3 rounded-none font-bold uppercase tracking-wider hover:bg-[#b39540] transition-colors inline-block"
        >
          ← Go Home
        </Link>
        <Link
          href="/products"
          className="border border-[#c9a84c] text-[#c9a84c] px-8 py-3 rounded-none font-bold uppercase tracking-wider hover:bg-[#c9a84c] hover:text-black transition-all inline-block"
        >
          Browse Products
        </Link>
      </div>

      {/* Footer Links */}
      <div className="space-y-3">
        <p className="text-[#9aab9e]">
          Looking for your order?{' '}
          <Link href="/track-order" className="text-[#c9a84c] hover:underline decoration-1 underline-offset-4">
            Track here
          </Link>
        </p>
        <p className="text-[#9aab9e]">
          Need help?{' '}
          <a href={`mailto:${storeEmail}`} className="text-[#c9a84c] hover:underline decoration-1 underline-offset-4">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  )
}
