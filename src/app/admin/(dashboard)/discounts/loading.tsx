import { SkeletonRow } from '@/components/ui/Skeleton'

export default function DiscountsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-gray-200 rounded-lg" />
          <div className="h-4 w-56 bg-gray-200 rounded" />
        </div>
        <div className="h-9 w-40 bg-gray-200 rounded-lg" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-xl p-5 h-28" />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="animate-pulse px-4 py-3 border-b border-gray-100 h-12 bg-gray-50" />
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}
