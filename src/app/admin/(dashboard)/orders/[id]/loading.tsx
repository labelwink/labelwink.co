import { SkeletonRow } from '@/components/ui/Skeleton'

export default function OrderDetailLoading() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-36 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-gray-200 rounded-lg" />
          <div className="h-9 w-28 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Two column grid: order info + customer info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order info — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="animate-pulse bg-white border border-gray-200 rounded-xl p-6 space-y-3">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          {/* Line items */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="animate-pulse px-4 py-3 border-b border-gray-100 h-10 bg-gray-50" />
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        </div>

        {/* Customer info — 1 col */}
        <div className="space-y-4">
          <div className="animate-pulse bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-40 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          <div className="animate-pulse bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 w-full bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
