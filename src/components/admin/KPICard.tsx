import Link from 'next/link'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  linkHref?: string
  linkLabel?: string
}

export function KPICard({ title, value, subtitle, icon, linkHref, linkLabel }: KPICardProps) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div className="w-10 h-10 bg-[#1b3a34]/10 rounded-full flex items-center justify-center text-[#1b3a34]">
            {icon}
          </div>
        )}
      </div>
      <p className="text-sm text-[#6b7280] mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-[#1a1a1a]">{value}</h3>
      {subtitle && <p className="text-xs text-[#6b7280] mt-1">{subtitle}</p>}
      {linkHref && linkLabel && (
        <Link href={linkHref} className="text-sm text-[#1b3a34] underline mt-2 inline-block hover:text-[#234d44] transition-colors">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}
