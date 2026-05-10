import { Skeleton } from '@/components/ui/Skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-gray-200 rounded-lg" />
          <div className="h-4 w-52 bg-gray-200 rounded" />
        </div>
        <div className="h-9 w-56 bg-gray-200 rounded-lg" />
      </div>

      {/* KPI Cards — 6 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-xl p-5 h-28" />
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="animate-pulse bg-white border border-gray-200 rounded-xl p-5 h-64" />

      {/* Two column */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="animate-pulse bg-white border border-gray-200 rounded-xl p-5 h-64" />
        <div className="animate-pulse bg-white border border-gray-200 rounded-xl p-5 h-64" />
      </div>
    </div>
  )
}
