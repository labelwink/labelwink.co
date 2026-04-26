export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-48 bg-gray-100 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-3">
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-8 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
