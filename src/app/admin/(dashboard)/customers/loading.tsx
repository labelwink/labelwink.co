export default function CustomersLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-gray-100 rounded-lg" />
        <div className="h-8 w-28 bg-gray-100 rounded-lg" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-4 space-y-2">
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-7 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      {/* Filter tabs */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <div key={i} className="h-8 w-24 bg-gray-100 rounded-lg" />)}
      </div>
      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
        <div className="flex gap-4 px-5 py-3 border-b border-[#e5e7eb]">
          {[...Array(5)].map((_, i) => <div key={i} className="h-4 w-20 bg-gray-100 rounded" />)}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 border-b border-[#e5e7eb] last:border-0 items-center">
            <div className="w-8 h-8 bg-gray-100 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-36 bg-gray-100 rounded" />
              <div className="h-3 w-48 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-6 w-20 bg-gray-100 rounded-full" />
            <div className="h-7 w-16 bg-gray-100 rounded-lg ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
