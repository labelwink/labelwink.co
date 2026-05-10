import { SkeletonRow } from '@/components/ui/Skeleton'

export default function CustomerDetailLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div className="animate-pulse flex items-center gap-4">
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Profile card */}
      <div className="animate-pulse bg-white border border-gray-200 rounded-xl p-6 flex items-start gap-6">
        {/* Avatar circle */}
        <div className="w-20 h-20 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-36 bg-gray-200 rounded" />
          <div className="flex gap-4 pt-2">
            <div className="h-8 w-24 bg-gray-200 rounded-lg" />
            <div className="h-8 w-24 bg-gray-200 rounded-lg" />
          </div>
        </div>
        {/* KPI pills */}
        <div className="flex gap-4 flex-shrink-0">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 w-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="animate-pulse px-4 py-3 border-b border-gray-100 h-12 bg-gray-50" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}
