export default function ProductsLoading() {
  return (
    <div className="space-y-5 max-w-[1400px] animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-28 bg-gray-100 rounded-lg" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-gray-100 rounded-lg" />
          <div className="h-8 w-20 bg-gray-100 rounded-lg" />
          <div className="h-8 w-28 bg-gray-100 rounded-lg" />
        </div>
      </div>
      {/* Filters */}
      <div className="flex gap-2">
        <div className="h-8 flex-1 max-w-xs bg-gray-100 rounded-lg" />
        <div className="h-8 w-36 bg-gray-100 rounded-lg" />
        <div className="h-8 w-28 bg-gray-100 rounded-lg" />
      </div>
      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
        <div className="flex gap-4 px-5 py-3 border-b border-[#e5e7eb] bg-gray-50">
          {[...Array(8)].map((_, i) => <div key={i} className="h-3 w-20 bg-gray-100 rounded" />)}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-[#e5e7eb] last:border-0 items-center">
            <div className="w-4 h-4 bg-gray-100 rounded" />
            <div className="w-10 h-12 bg-gray-100 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="h-3.5 w-48 bg-gray-100 rounded" />
              <div className="h-2.5 w-36 bg-gray-100 rounded" />
            </div>
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="h-3 w-12 bg-gray-100 rounded" />
            <div className="h-6 w-16 bg-gray-100 rounded-full" />
            <div className="flex gap-1 ml-auto">
              <div className="w-7 h-7 bg-gray-100 rounded-lg" />
              <div className="w-7 h-7 bg-gray-100 rounded-lg" />
              <div className="w-7 h-7 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
