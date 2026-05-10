export default function ReturnsLoading() {
  return (
    <div className="space-y-4 animate-pulse max-w-[900px]">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 bg-gray-100 rounded-lg" />
        <div className="h-8 w-24 bg-gray-100 rounded-lg" />
      </div>
      {/* Status tab pills */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <div key={i} className="h-8 w-24 bg-gray-100 rounded-lg" />)}
      </div>
      {/* Return cards */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
              </div>
              <div className="h-3 w-40 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="text-right space-y-1.5">
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
