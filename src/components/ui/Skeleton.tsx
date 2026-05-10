// src/components/ui/Skeleton.tsx

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-[#FAF5E9] border border-[#E8DFC8] rounded-xl overflow-hidden">
      <div className="aspect-[3/4] bg-[#E8DFC8]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#E8DFC8] rounded w-3/4" />
        <div className="h-4 bg-[#E8DFC8] rounded w-1/3" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="h-6 w-16 bg-gray-200 rounded-full flex-shrink-0" />
    </div>
  )
}
