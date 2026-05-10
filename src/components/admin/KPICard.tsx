import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  linkHref?: string
  linkLabel?: string
  trend?: number          // positive = up, negative = down
  trendLabel?: string     // e.g. "vs last month"
  accent?: boolean        // use gold accent
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  linkHref,
  linkLabel,
  trend,
  trendLabel,
  accent = false,
}: KPICardProps) {
  const hasTrend = trend !== undefined
  const isUp = hasTrend && trend >= 0
  const TrendIcon = isUp ? TrendingUp : TrendingDown
  const trendColor = isUp ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'

  return (
    <div className={`
      bg-white border rounded-xl p-5 shadow-sm
      ${accent ? 'border-[#c9a84c]/40' : 'border-[#e5e7eb]'}
    `}>
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div className={`
            w-9 h-9 rounded-lg flex items-center justify-center
            ${accent ? 'bg-[#c9a84c]/12 text-[#c9a84c]' : 'bg-[#1b3a34]/8 text-[#1b3a34]'}
          `}>
            {icon}
          </div>
        )}
        {hasTrend && (
          <div className={`flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${trendColor}`}>
            <TrendIcon size={11} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p className="text-xs text-[#6b7280] font-medium tracking-wide mb-1">{title}</p>
      <p className="text-2xl font-bold text-[#ffffff] leading-tight">{value}</p>

      {(subtitle || trendLabel) && (
        <p className="text-[11px] text-[#9ca3af] mt-1.5">{subtitle ?? trendLabel}</p>
      )}

      {linkHref && linkLabel && (
        <Link
          href={linkHref}
          className="inline-flex items-center gap-1 text-xs text-[#1b3a34] font-medium mt-3 hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  )
}
