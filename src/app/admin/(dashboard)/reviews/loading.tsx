export default function ReviewsLoading() {
  return (
    <div className="space-y-4 animate-pulse max-w-[900px]">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 bg-gray-100 rounded-lg" />
        <div className="h-8 w-24 bg-gray-100 rounded-lg" />
      </div>
      {/* Status tab pills */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-8 w-24 bg-gray-100 rounded-lg" />)}
      </div>
      {/* Review cards */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 bg-gray-100 rounded" />
                <div className="h-3 w-36 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-6 w-20 bg-gray-100 rounded-full" />
          </div>
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-3/4 bg-gray-100 rounded" />
          <div className="flex gap-2 pt-1">
            <div className="h-7 w-20 bg-gray-100 rounded-lg" />
            <div className="h-7 w-20 bg-gray-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
