export default function OrdersLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-gray-100 rounded-lg" />
        <div className="h-8 w-24 bg-gray-100 rounded-lg" />
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
        <div className="flex gap-4 px-5 py-3 border-b border-[#e5e7eb]">
          {[...Array(6)].map((_, i) => <div key={i} className="h-4 w-20 bg-gray-100 rounded" />)}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 border-b border-[#e5e7eb] last:border-0">
            <div className="h-4 w-28 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-4 w-12 bg-gray-100 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
